import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
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
        url: 'https://portal.example.com/docs',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', 'Docs Hub'],
      },
    },
    rootIds: ['folder-root'],
  };
}

afterEach(() => {
  cleanup();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T05 app startup integration', () => {
  test('updates the status area after importing the browser tree on first startup', async () => {
    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'import-browser-tree',
            reason: 'no-persisted-draft-session',
          },
          draftSnapshot: {
            schemaVersion: 'draft-graph/v1',
            snapshotVersion: 0,
            selectedNodeId: null,
            nodesById: {
              'browser-10': {
                internalId: 'browser-10',
                sourceType: 'browser',
                nodeType: 'bookmark',
                title: 'Docs',
                url: 'https://docs.example.com',
                parentId: null,
                childIds: [],
                pathTokens: ['Docs'],
              },
            },
            rootIds: ['browser-10'],
          },
          statusKey: 'imported-browser-tree',
          occurredAt: '2026-04-06T16:08:09',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('首次启动已从浏览器导入当前书签树', { selector: '.status-entry dd' })).toBeInTheDocument();
    });

    expect(screen.getByText('当前草稿包含 1 个节点，已可进入后续编辑。', { selector: '.status-entry p' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '书签节点：Docs' })).toBeInTheDocument();
    expect(screen.getByText('docs.example.com')).toBeInTheDocument();
    expect(screen.getByText('2026-04-06 16:08:09', { selector: '.status-entry dd' })).toBeInTheDocument();
  });

  test('surfaces an unsaved import warning when startup import cannot be persisted locally', async () => {
    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'import-browser-tree',
            reason: 'no-persisted-draft-session',
          },
          draftSnapshot: {
            schemaVersion: 'draft-graph/v1',
            snapshotVersion: 0,
            selectedNodeId: null,
            nodesById: {
              'browser-10': {
                internalId: 'browser-10',
                sourceType: 'browser',
                nodeType: 'bookmark',
                title: 'Docs',
                url: 'https://docs.example.com',
                parentId: null,
                childIds: [],
                pathTokens: ['Docs'],
              },
            },
            rootIds: ['browser-10'],
          },
          statusKey: 'imported-browser-tree-unsaved',
          occurredAt: '2026-04-06T16:08:09',
          errorDetail: 'Storage quota exceeded.',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('已导入浏览器书签，但本地草稿保存失败', { selector: '.status-entry dd' })).toBeInTheDocument();
    });

    expect(screen.getByText('Storage quota exceeded.', { selector: '.status-entry p' })).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
  });

  test('keeps the persisted operation time when the latest startup status means the same result', async () => {
    const storageState: Record<string, unknown> = {
      'workspace-latest-status-entry': {
        statusKey: 'imported-browser-tree',
        action: '浏览器书签读取',
        time: '2026-04-06 08:00:00',
        result: '首次启动已从浏览器导入当前书签树',
        detail: '当前草稿包含 1 个节点，已可进入后续编辑。',
      },
    };
    (globalThis as typeof globalThis & {
      chrome?: { storage: { local: { get: (keys: string[]) => Promise<Record<string, unknown>>; set: (items: Record<string, unknown>) => Promise<void> } } };
    }).chrome = {
      storage: {
        local: {
          get: async (keys) =>
            Object.fromEntries(keys.map((key) => [key, storageState[key]])),
          set: async (items) => {
            Object.assign(storageState, items);
          },
        },
      },
    };

    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'import-browser-tree',
            reason: 'no-persisted-draft-session',
          },
          draftSnapshot: {
            schemaVersion: 'draft-graph/v1',
            snapshotVersion: 0,
            selectedNodeId: null,
            nodesById: {
              'browser-10': {
                internalId: 'browser-10',
                sourceType: 'browser',
                nodeType: 'bookmark',
                title: 'Docs',
                url: 'https://docs.example.com',
                parentId: null,
                childIds: [],
                pathTokens: ['Docs'],
              },
            },
            rootIds: ['browser-10'],
          },
          statusKey: 'imported-browser-tree',
          occurredAt: '2026-04-06T16:08:09',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('首次启动已从浏览器导入当前书签树', { selector: '.status-entry dd' })).toBeInTheDocument();
    });

    expect(screen.getByText('2026-04-06 08:00:00', { selector: '.status-entry dd' })).toBeInTheDocument();
    expect(storageState['workspace-latest-status-entry']).toEqual({
      statusKey: 'imported-browser-tree',
      action: '浏览器书签读取',
      time: '2026-04-06 08:00:00',
      result: '首次启动已从浏览器导入当前书签树',
      detail: '当前草稿包含 1 个节点，已可进入后续编辑。',
    });
  });
  test('prepends the latest startup result to retained history and keeps only the newest three entries', async () => {
    const storageState: Record<string, unknown> = {
      'workspace-status-history': [
        {
          statusKey: 'browser-read-error',
          action: '浏览器书签读取',
          time: '2026-04-07 08:00:00',
          result: '浏览器书签读取失败',
          detail: '权限尚未授予。',
        },
        {
          statusKey: 'restore-error',
          action: '本地草稿恢复',
          time: '2026-04-07 07:50:00',
          result: '本地草稿恢复失败',
          detail: '本地数据损坏。',
        },
        {
          statusKey: 'imported-browser-tree-unsaved',
          action: '浏览器书签读取',
          time: '2026-04-07 07:40:00',
          result: '已导入浏览器书签，但本地草稿保存失败',
          detail: 'Storage quota exceeded.',
        },
      ],
      'workspace-latest-status-entry': {
        statusKey: 'browser-read-error',
        action: '浏览器书签读取',
        time: '2026-04-07 08:00:00',
        result: '浏览器书签读取失败',
        detail: '权限尚未授予。',
      },
    };
    (globalThis as typeof globalThis & {
      chrome?: { storage: { local: { get: (keys: string[]) => Promise<Record<string, unknown>>; set: (items: Record<string, unknown>) => Promise<void> } } };
    }).chrome = {
      storage: {
        local: {
          get: async (keys) =>
            Object.fromEntries(keys.map((key) => [key, storageState[key]])),
          set: async (items) => {
            Object.assign(storageState, items);
          },
        },
      },
    };

    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'restore-local-draft',
            reason: 'persisted-draft-session-exists',
          },
          draftSnapshot: createDraftSnapshot(),
          statusKey: 'restored-local-draft',
          occurredAt: '2026-04-07T11:00:00',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('已恢复上次保存的本地草稿会话', { selector: '.status-entry dd' })).toBeInTheDocument();
    });

    const historyItems = Array.from(document.body.querySelectorAll('.status-history-list li'));

    expect(historyItems).toHaveLength(3);
    expect(historyItems[0]?.textContent).toContain('本地草稿恢复');
    expect(historyItems[0]?.textContent).toContain('2026-04-07 11:00:00');
    expect(historyItems[0]?.textContent).toContain('已恢复上次保存的本地草稿会话');
    expect(historyItems[1]?.textContent).toContain('浏览器书签读取失败');
    expect(historyItems[1]?.textContent).toContain('权限尚未授予。');
    expect(historyItems[2]?.textContent).toContain('本地草稿恢复失败');
    expect(screen.queryByText('Storage quota exceeded.')).not.toBeInTheDocument();
    expect(storageState['workspace-status-history']).toEqual([
      {
        statusKey: 'restored-local-draft',
        action: '本地草稿恢复',
        time: '2026-04-07 11:00:00',
        result: '已恢复上次保存的本地草稿会话',
        detail: '启动时优先恢复了本地草稿，会话包含 2 个节点，本次未自动读取浏览器书签。',
      },
      {
        statusKey: 'browser-read-error',
        action: '浏览器书签读取',
        time: '2026-04-07 08:00:00',
        result: '浏览器书签读取失败',
        detail: '权限尚未授予。',
      },
      {
        statusKey: 'restore-error',
        action: '本地草稿恢复',
        time: '2026-04-07 07:50:00',
        result: '本地草稿恢复失败',
        detail: '本地数据损坏。',
      },
    ]);
  });

});
