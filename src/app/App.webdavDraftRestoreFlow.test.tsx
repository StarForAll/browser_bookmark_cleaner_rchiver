import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { LOCAL_PERSISTENCE_KEYS } from '@/adapters/local-persistence/contracts';
import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { formatStatusTimestamp } from '@/shared/copy/appShell';
import { App } from './App';

type ChromeStorageArea = {
  get: (keys: string[]) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
};

type StoredVersionDescriptor = {
  artifactType: 'draft-snapshot';
  createdAt: string;
  snapshotLabel: string | null;
  source: 'draft';
  versionId: string;
};

function createCurrentDraftSnapshot(): DraftGraphSnapshot {
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

function createRestoredDraftSnapshot(): DraftGraphSnapshot {
  return {
    schemaVersion: 'draft-graph/v1',
    snapshotVersion: 1,
    selectedNodeId: null,
    nodesById: {
      'folder-restored': {
        internalId: 'folder-restored',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '恢复后的目录',
        url: null,
        parentId: null,
        childIds: ['bookmark-restored'],
        pathTokens: ['恢复后的目录'],
      },
      'bookmark-restored': {
        internalId: 'bookmark-restored',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: 'Recovered Docs',
        url: 'https://recovered.example.com',
        parentId: 'folder-restored',
        childIds: [],
        pathTokens: ['恢复后的目录', 'Recovered Docs'],
      },
    },
    rootIds: ['folder-restored'],
  };
}

function createReadyWebdavStorageState(): Record<string, unknown> {
  return {
    [LOCAL_PERSISTENCE_KEYS.sensitive.webdavPermissionState]: {
      granted: true,
      origin: 'https://dav.example.com/',
    },
    [LOCAL_PERSISTENCE_KEYS.sensitive.webdavProfile]: {
      endpointUrl: 'https://dav.example.com/collection/',
      username: 'alice',
      password: 'secret-pass',
      lastTestedAt: '2026-04-12T11:00:00.000Z',
      lastTestStatus: 'success',
    },
  };
}

function createDraftVersionDescriptor(): StoredVersionDescriptor {
  return {
    artifactType: 'draft-snapshot',
    createdAt: '2026-04-12T12:00:00.000Z',
    snapshotLabel: '午间备份',
    source: 'draft',
    versionId: '2026-04-12T12-00-00.000Z',
  };
}

function createOlderDraftVersionDescriptor(): StoredVersionDescriptor {
  return {
    artifactType: 'draft-snapshot',
    createdAt: '2026-04-11T09:30:00.000Z',
    snapshotLabel: '昨日备份',
    source: 'draft',
    versionId: '2026-04-11T09-30-00.000Z',
  };
}

function createVersionIndex(versions: StoredVersionDescriptor[]) {
  return {
    schemaVersion: 'webdav-index/v1',
    versions,
  };
}

function createDraftEnvelope(
  version: StoredVersionDescriptor,
  payload: DraftGraphSnapshot,
) {
  return {
    schemaVersion: 'webdav-snapshot/v1',
    artifactType: 'draft-snapshot' as const,
    createdAt: version.createdAt,
    versionId: version.versionId,
    source: 'draft' as const,
    originAction: 'upload-draft-to-webdav' as const,
    snapshotLabel: version.snapshotLabel,
    payloadFormat: 'draft-graph-snapshot' as const,
    payload,
  };
}

function installChromeRuntime(input: {
  storageState?: Record<string, unknown>;
} = {}) {
  const storageState = {
    ...(input.storageState ?? {}),
  };

  const storage: ChromeStorageArea = {
    get: vi.fn(async (keys: string[]) => {
      return Object.fromEntries(keys.map((key) => [key, storageState[key]]));
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(storageState, items);
    }),
  };

  (globalThis as typeof globalThis & {
    chrome?: {
      permissions: {
        contains: (permissions: { origins?: string[]; permissions?: string[] }) => Promise<boolean>;
        request: (permissions: { origins?: string[]; permissions?: string[] }) => Promise<boolean>;
      };
      storage: {
        local: ChromeStorageArea;
      };
    };
  }).chrome = {
    permissions: {
      contains: vi.fn(async () => true),
      request: vi.fn(async () => true),
    },
    storage: {
      local: storage,
    },
  };

  return {
    storage,
    storageState,
  };
}

function installWebdavRestoreFetch(input: {
  index: unknown;
  versionDocument: unknown;
}) {
  const version = createDraftVersionDescriptor();
  const fetchMock = vi.fn(async (resource: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl =
      typeof resource === 'string'
        ? resource
        : resource instanceof URL
          ? resource.toString()
          : resource.url;
    const pathname = new URL(requestUrl).pathname;
    const method = (init?.method ?? 'GET').toUpperCase();

    if (method === 'GET') {
      if (pathname === '/collection/bookmark-extension-data/drafts/index.json') {
        return new Response(JSON.stringify(input.index), {
          headers: {
            'content-type': 'application/json',
          },
          status: 200,
        });
      }

      if (pathname === `/collection/bookmark-extension-data/drafts/versions/${version.versionId}.json`) {
        return new Response(JSON.stringify(input.versionDocument), {
          headers: {
            'content-type': 'application/json',
          },
          status: 200,
        });
      }

      return new Response('', { status: 404 });
    }

    if (method === 'PROPFIND' || method === 'OPTIONS') {
      return new Response('', { status: 200 });
    }

    return new Response('', { status: 405 });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function renderAppWithEditableDraft() {
  render(
    <App
      bootstrapWorkspace={async () => ({
        policy: {
          action: 'restore-local-draft',
          reason: 'persisted-draft-session-exists',
        },
        draftSnapshot: createCurrentDraftSnapshot(),
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

function findStorageCallOrder(
  setMock: {
    mock: {
      calls: Array<[Record<string, unknown>]>;
      invocationCallOrder: number[];
    };
  },
  storageKey: string,
): number | null {
  const targetCall = setMock.mock.calls.find(([items]) =>
    typeof items === 'object' &&
    items !== null &&
    Object.prototype.hasOwnProperty.call(items, storageKey),
  );

  if (!targetCall) {
    return null;
  }

  return setMock.mock.invocationCallOrder[setMock.mock.calls.indexOf(targetCall)] ?? null;
}

function findFetchCallOrder(
  fetchMock: ReturnType<typeof vi.fn>,
  pathname: string,
): number | null {
  const targetCall = fetchMock.mock.calls.find(([resource]) => {
    const requestUrl =
      typeof resource === 'string'
        ? resource
        : resource instanceof URL
          ? resource.toString()
          : resource.url;

    return new URL(requestUrl).pathname === pathname;
  });

  if (!targetCall) {
    return null;
  }

  return fetchMock.mock.invocationCallOrder[fetchMock.mock.calls.indexOf(targetCall)] ?? null;
}

function readTopStatusAction(): string {
  return document.querySelector('.status-history-list li strong')?.textContent ?? '';
}

function readTopStatusResult(): string {
  const resultItems = document.querySelectorAll('.status-history-list li dd');
  return resultItems[1]?.textContent ?? '';
}

beforeEach(() => {
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T12A WebDAV draft restore flow', () => {
  test('loads draft-only remote versions, creates a draft backup before downloading the selected version, and replaces the current draft after confirmation', async () => {
    const runtime = installChromeRuntime({
      storageState: createReadyWebdavStorageState(),
    });
    const version = createDraftVersionDescriptor();
    const olderVersion = createOlderDraftVersionDescriptor();
    const fetchMock = installWebdavRestoreFetch({
      index: createVersionIndex([olderVersion, version]),
      versionDocument: createDraftEnvelope(version, createRestoredDraftSnapshot()),
    });

    await renderAppWithEditableDraft();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '恢复 WebDAV 草稿到当前草稿' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: '恢复 WebDAV 草稿到当前草稿' }));

    const picker = await screen.findByRole('dialog');
    expect(picker.textContent ?? '').toMatch(/当前草稿/);
    expect(within(picker).getByText('版本1')).toBeInTheDocument();
    expect(within(picker).getByText('版本2')).toBeInTheDocument();
    expect(within(picker).getByText(formatStatusTimestamp(version.createdAt))).toBeInTheDocument();
    expect(within(picker).getByText(formatStatusTimestamp(olderVersion.createdAt))).toBeInTheDocument();
    expect(picker.textContent ?? '').not.toContain('午间备份');
    expect(picker.textContent ?? '').not.toContain('昨日备份');

    fireEvent.click(within(picker).getByText('版本1'));
    fireEvent.click(within(picker).getByRole('button', { name: /继续/ }));

    await waitFor(() => {
      expect(screen.getByRole('dialog').textContent ?? '').toMatch(/WebDAV 草稿.*当前草稿/);
    });
    const confirmation = screen.getByRole('dialog');
    expect(confirmation.textContent ?? '').toMatch(/本地备份/);

    fireEvent.click(within(confirmation).getByRole('button', { name: /确认恢复/ }));

    await waitFor(() => {
      expect(runtime.storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          [LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup]: expect.objectContaining({
            sourceOrigin: 'webdav-draft-version',
            sourceVersionId: version.versionId,
            sourceVersionLabel: version.snapshotLabel,
          }),
        }),
      );
    });

    const backupWriteCallOrder = findStorageCallOrder(
      runtime.storage.set as unknown as {
        mock: {
          calls: Array<[Record<string, unknown>]>;
          invocationCallOrder: number[];
        };
      },
      LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup,
    );
    const versionReadCallOrder = findFetchCallOrder(
      fetchMock,
      `/collection/bookmark-extension-data/drafts/versions/${version.versionId}.json`,
    );

    expect(backupWriteCallOrder).not.toBeNull();
    expect(versionReadCallOrder).not.toBeNull();
    if (backupWriteCallOrder === null || versionReadCallOrder === null) {
      throw new Error('Expected backup write and version read call order to be recorded.');
    }
    expect(backupWriteCallOrder).toBeLessThan(versionReadCallOrder);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '书签节点：Recovered Docs' })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: '书签节点：Docs Hub' })).not.toBeInTheDocument();
    expect(readTopStatusAction()).toBe('恢复 WebDAV 草稿到当前草稿');
    expect(readTopStatusResult()).toBe('已将所选 WebDAV 草稿版本恢复到当前草稿');
  });

  test('keeps the current draft unchanged and records a restore failure when the selected remote payload is invalid for draft restore', async () => {
    const runtime = installChromeRuntime({
      storageState: createReadyWebdavStorageState(),
    });
    const version = createDraftVersionDescriptor();
    const olderVersion = createOlderDraftVersionDescriptor();
    installWebdavRestoreFetch({
      index: createVersionIndex([olderVersion, version]),
      versionDocument: {
        ...createDraftEnvelope(version, createRestoredDraftSnapshot()),
        artifactType: 'bookmark-snapshot',
        payloadFormat: 'browser-bookmark-tree',
        source: 'browser',
        payload: [],
      },
    });

    await renderAppWithEditableDraft();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '恢复 WebDAV 草稿到当前草稿' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: '恢复 WebDAV 草稿到当前草稿' }));

    const picker = await screen.findByRole('dialog');
    fireEvent.click(within(picker).getByText('版本1'));
    fireEvent.click(within(picker).getByRole('button', { name: /继续/ }));

    await waitFor(() => {
      expect(screen.getByRole('dialog').textContent ?? '').toMatch(/WebDAV 草稿.*当前草稿/);
    });
    const confirmation = screen.getByRole('dialog');
    fireEvent.click(within(confirmation).getByRole('button', { name: /确认恢复/ }));

    await waitFor(() => {
      expect(runtime.storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          [LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup]: expect.objectContaining({
            sourceOrigin: 'webdav-draft-version',
            sourceVersionId: version.versionId,
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '书签节点：Docs Hub' })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: '书签节点：Recovered Docs' })).not.toBeInTheDocument();
    expect(readTopStatusAction()).toBe('恢复 WebDAV 草稿到当前草稿');
    expect(readTopStatusResult()).toMatch(/失败/);
    expect(document.querySelector('.status-history-list li')?.textContent ?? '').toMatch(/草稿|类型|无效/);
  });
});
