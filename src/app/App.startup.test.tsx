import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { App } from './App';

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

    expect(screen.getByText('当前草稿包含 1 个节点，已可进入后续编辑。')).toBeInTheDocument();
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

    expect(screen.getByText('Storage quota exceeded.')).toBeInTheDocument();
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
});
