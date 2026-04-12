import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { LOCAL_PERSISTENCE_KEYS } from '@/adapters/local-persistence/contracts';
import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { App } from './App';

function createDraftSnapshot(): DraftGraphSnapshot {
  return {
    schemaVersion: 'draft-graph/v1',
    snapshotVersion: 0,
    selectedNodeId: null,
    nodesById: {
      'folder-root': {
        internalId: 'folder-root',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '工作资料',
        url: null,
        parentId: null,
        childIds: ['bookmark-docs'],
        pathTokens: ['工作资料'],
      },
      'bookmark-docs': {
        internalId: 'bookmark-docs',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: 'Docs Hub',
        url: 'https://docs.example.com',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', 'Docs Hub'],
      },
    },
    rootIds: ['folder-root'],
  };
}

function installChromeRuntime(input: {
  initialPermissionGranted?: boolean;
  requestGranted?: boolean;
  storageState?: Record<string, unknown>;
} = {}) {
  const storageState = { ...(input.storageState ?? {}) };
  let permissionGranted = input.initialPermissionGranted ?? false;
  const requestGranted = input.requestGranted ?? true;

  const get = vi.fn(async (keys: string[]) =>
    Object.fromEntries(keys.map((key) => [key, storageState[key]])),
  );
  const set = vi.fn(async (items: Record<string, unknown>) => {
    Object.assign(storageState, items);
  });
  const permissions = {
    contains: vi.fn(async () => permissionGranted),
    request: vi.fn(async () => {
      permissionGranted = requestGranted;
      return requestGranted;
    }),
  };

  (globalThis as typeof globalThis & { chrome?: unknown }).chrome = {
    storage: {
      local: {
        get,
        set,
      },
    },
    permissions,
  };

  return {
    storageState,
    set,
    permissions,
  };
}

async function renderAppWithEditableDraft() {
  render(
    <App
      bootstrapWorkspace={async () => ({
        policy: {
          action: 'restore-local-draft',
          reason: 'persisted-draft-session-exists',
        },
        draftSnapshot: createDraftSnapshot(),
        statusKey: 'restored-local-draft',
        occurredAt: '2026-04-12T10:00:00.000Z',
      })}
      enableStartupBootstrap
    />,
  );

  await waitFor(() => {
    expect(screen.getByRole('button', { name: '书签节点：Docs Hub' })).toBeInTheDocument();
  });
}

function openWebdavSettings() {
  const settingsButton = screen.getByRole('button', { name: 'WebDAV 设置' });
  expect(settingsButton).toBeEnabled();
  fireEvent.click(settingsButton);

  return {
    endpointInput: screen.getByLabelText('WebDAV URL'),
    usernameInput: screen.getByLabelText('用户名'),
    passwordInput: screen.getByLabelText('密码'),
    saveButton: screen.getByRole('button', { name: '保存设置' }),
    testButton: screen.getByRole('button', { name: '测试可用性' }),
  };
}

function fillProfileForm(input: {
  endpointUrl?: string;
  username?: string;
  password?: string;
}) {
  const form = openWebdavSettings();

  fireEvent.change(form.endpointInput, {
    target: {
      value: input.endpointUrl ?? 'https://dav.example.com/collection/',
    },
  });
  fireEvent.change(form.usernameInput, {
    target: {
      value: input.username ?? 'alice',
    },
  });
  fireEvent.change(form.passwordInput, {
    target: {
      value: input.password ?? 'secret-pass',
    },
  });

  return form;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T10 WebDAV configuration and availability gate', () => {
  test('keeps WebDAV settings available, persists a valid profile, and does not treat save as connectivity success', async () => {
    const runtime = installChromeRuntime();

    render(<App />);

    const form = fillProfileForm({});
    fireEvent.click(form.saveButton);

    await waitFor(() => {
      expect(runtime.set).toHaveBeenCalledWith(
        expect.objectContaining({
          [LOCAL_PERSISTENCE_KEYS.sensitive.webdavProfile]: expect.objectContaining({
            endpointUrl: 'https://dav.example.com/collection/',
            username: 'alice',
            password: 'secret-pass',
          }),
        }),
      );
    });

    expect(runtime.permissions.request).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '上传当前浏览器书签到 WebDAV' })).toBeDisabled();
  });

  test('requests host permission on demand and enables upload actions only after a successful availability test', async () => {
    const runtime = installChromeRuntime();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response('', { status: 200 });
      }),
    );

    await renderAppWithEditableDraft();

    const form = fillProfileForm({});
    fireEvent.click(form.saveButton);

    await waitFor(() => {
      expect(runtime.set).toHaveBeenCalled();
    });

    fireEvent.click(form.testButton);

    await waitFor(() => {
      expect(runtime.permissions.request).toHaveBeenCalledWith({
        origins: ['https://dav.example.com/'],
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '上传当前浏览器书签到 WebDAV' })).toBeEnabled();
    });

    expect(screen.getByRole('button', { name: '上传当前草稿到 WebDAV' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '恢复 WebDAV 草稿到当前草稿' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '恢复 WebDAV 书签到浏览器书签' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '恢复 WebDAV 草稿到当前草稿' })).toHaveAttribute(
      'title',
      '当前 WebDAV 恢复列表与恢复流程将在后续任务接入。',
    );
  });

  test('keeps uploads disabled and records a failure entry without leaking secrets when availability test fails', async () => {
    installChromeRuntime();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Network unreachable');
      }),
    );

    render(<App />);

    const form = fillProfileForm({
      password: 'top-secret-password',
    });
    fireEvent.click(form.saveButton);
    fireEvent.click(form.testButton);

    await waitFor(() => {
      const historyList = document.querySelector('.status-history-list');
      expect(historyList).not.toBeNull();
      expect(historyList ? historyList.querySelectorAll('li').length : 0).toBe(1);
    });

    expect(screen.getByRole('button', { name: '上传当前浏览器书签到 WebDAV' })).toBeDisabled();

    const historyText = document.querySelector('.status-history-list')?.textContent ?? '';
    expect(historyText).toMatch(/WebDAV|可用性/);
    expect(historyText).not.toContain('top-secret-password');
  });

  test('appends a new failure record even when the same availability check fails with the same result twice', async () => {
    installChromeRuntime();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Network unreachable');
      }),
    );

    await renderAppWithEditableDraft();

    const form = fillProfileForm({
      password: 'repeat-secret',
    });
    fireEvent.click(form.saveButton);

    fireEvent.click(form.testButton);
    await waitFor(() => {
      const items = Array.from(document.querySelectorAll('.status-history-list li'));
      expect(items).toHaveLength(2);
    });

    fireEvent.click(form.testButton);
    await waitFor(() => {
      const items = Array.from(document.querySelectorAll('.status-history-list li'));
      expect(items).toHaveLength(3);
      expect(items.every((item) => (item.textContent ?? '').includes('WebDAV 可用性检测失败'))).toBe(false);
    });

    fireEvent.click(form.testButton);
    await waitFor(() => {
      const items = Array.from(document.querySelectorAll('.status-history-list li'));
      expect(items).toHaveLength(3);
      expect(items.every((item) => (item.textContent ?? '').includes('WebDAV 可用性检测失败'))).toBe(true);
      expect(items.some((item) => (item.textContent ?? '').includes('已恢复上次保存的本地草稿会话'))).toBe(false);
    });
  });

  test('prepends WebDAV failure above an existing startup restore entry instead of leaving the startup entry on top', async () => {
    installChromeRuntime({
      storageState: {
        'workspace-status-history': [
          {
            statusKey: 'restored-local-draft',
            action: '本地草稿恢复',
            time: '2026-04-12 09:58:00',
            result: '已恢复上次保存的本地草稿会话',
            detail: '启动时优先恢复了本地草稿，会话包含 2 个节点，本次未自动读取浏览器书签。',
          },
        ],
        'workspace-latest-status-entry': {
          statusKey: 'restored-local-draft',
          action: '本地草稿恢复',
          time: '2026-04-12 09:58:00',
          result: '已恢复上次保存的本地草稿会话',
          detail: '启动时优先恢复了本地草稿，会话包含 2 个节点，本次未自动读取浏览器书签。',
        },
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Network unreachable');
      }),
    );

    await renderAppWithEditableDraft();

    const form = fillProfileForm({
      password: 'history-order-secret',
    });
    fireEvent.click(form.saveButton);
    fireEvent.click(form.testButton);

    await waitFor(() => {
      const results = Array.from(
        document.querySelectorAll('.status-history-list li dd'),
      ).map((item) => item.textContent ?? '');

      expect(results[1]).toBe('WebDAV 可用性检测失败');
      expect(results[3]).toBe('已恢复上次保存的本地草稿会话');
    });
  });

  test('maps manifest-mismatch permission errors to an explicit extension-reload hint', async () => {
    const runtime = installChromeRuntime();
    runtime.permissions.request.mockImplementationOnce(async () => {
      throw new Error('Only permissions specified in the manifest may be requested.');
    });

    await renderAppWithEditableDraft();

    const form = fillProfileForm({
      password: 'manifest-reload-secret',
    });
    fireEvent.click(form.saveButton);
    fireEvent.click(form.testButton);

    await waitFor(() => {
      expect(
        screen.getByText('当前扩展可能仍在使用旧的 manifest。请到 chrome://extensions 重新加载该扩展后，再重试 WebDAV 可用性检测。'),
      ).toBeInTheDocument();
    });
  });
});
