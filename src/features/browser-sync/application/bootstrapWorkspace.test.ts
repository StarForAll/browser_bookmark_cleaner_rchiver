import { describe, expect, test, vi } from 'vitest';
import type { ReadPersistedDraftSessionResult } from '@/adapters/local-persistence/readPersistedDraftSession';
import type { PersistedDraftSession } from '@/adapters/local-persistence/contracts';

describe('T05 workspace startup bootstrap', () => {
  test('restores the persisted draft snapshot before reading browser bookmarks', async () => {
    const bootstrap = await import('./bootstrapWorkspace');

    const restoredSession: PersistedDraftSession = {
      schemaVersion: 'local-persistence/v1',
      draftSnapshot: {
        schemaVersion: 'draft-graph/v1',
        snapshotVersion: 2,
        selectedNodeId: null,
        nodesById: {},
        rootIds: [],
      },
      expandedStateById: {},
      nodePositionsById: {},
      undoHistory: [],
      checkpoints: [],
    };
    const readPersistedDraftSession = vi.fn(
      async (): Promise<ReadPersistedDraftSessionResult> => ({
        kind: 'restored',
        session: restoredSession,
      }),
    );
    const readBrowserBookmarkTree = vi.fn(async () => ({
      kind: 'loaded' as const,
      tree: [],
    }));

    const result = await bootstrap.bootstrapWorkspace({
      readPersistedDraftSession,
      readBrowserBookmarkTree,
    });

    expect(result.policy.action).toBe('restore-local-draft');
    expect(result.statusKey).toBe('restored-local-draft');
    expect(result.draftSnapshot).not.toBeNull();
    if (result.draftSnapshot) {
      expect(result.draftSnapshot.snapshotVersion).toBe(2);
    }
    expect(readBrowserBookmarkTree).not.toHaveBeenCalled();
  });

  test('imports browser bookmarks into the draft when no persisted draft session exists', async () => {
    const bootstrap = await import('./bootstrapWorkspace');
    const writePersistedDraftSession = vi.fn(async () => ({
      kind: 'saved' as const,
    }));

    const result = await bootstrap.bootstrapWorkspace({
      readPersistedDraftSession: async (): Promise<ReadPersistedDraftSessionResult> => ({
        kind: 'empty',
      }),
      readBrowserBookmarkTree: async () => ({
        kind: 'loaded',
        tree: [
          {
            id: '1',
            parentId: '0',
            title: 'Bookmarks Bar',
            children: [
              {
                id: '10',
                parentId: '1',
                title: 'Docs',
                url: 'https://docs.example.com',
              },
            ],
          },
        ],
      }),
      writePersistedDraftSession,
    });

    expect(result.policy.action).toBe('import-browser-tree');
    expect(result.statusKey).toBe('imported-browser-tree');
    expect(result.draftSnapshot).not.toBeNull();
    if (result.draftSnapshot) {
      expect(result.draftSnapshot.rootIds).toEqual(['browser-10']);
    }
    expect(writePersistedDraftSession).toHaveBeenCalledTimes(1);
    expect(writePersistedDraftSession).toHaveBeenCalledWith({
      schemaVersion: 'local-persistence/v1',
      draftSnapshot: result.draftSnapshot,
      expandedStateById: {},
      nodePositionsById: {},
      undoHistory: [],
      checkpoints: [],
    });
  });

  test('returns a waiting state when startup cannot read browser bookmarks and no draft exists', async () => {
    const bootstrap = await import('./bootstrapWorkspace');

    const result = await bootstrap.bootstrapWorkspace({
      readPersistedDraftSession: async (): Promise<ReadPersistedDraftSessionResult> => ({
        kind: 'empty',
      }),
      readBrowserBookmarkTree: async () => ({
        kind: 'unavailable',
      }),
    });

    expect(result.policy.action).toBe('await-browser-import');
    expect(result.statusKey).toBe('await-browser-import');
    expect(result.draftSnapshot).toBeNull();
  });

  test('returns a restore error state when the persisted draft session is unreadable', async () => {
    const bootstrap = await import('./bootstrapWorkspace');
    const readBrowserBookmarkTree = vi.fn(async () => ({
      kind: 'loaded' as const,
      tree: [],
    }));

    const result = await bootstrap.bootstrapWorkspace({
      readPersistedDraftSession: async (): Promise<ReadPersistedDraftSessionResult> => ({
        kind: 'error',
        error: 'Persisted draft session schemaVersion is invalid.',
      }),
      readBrowserBookmarkTree,
    });

    expect(result.policy.action).toBe('await-browser-import');
    expect(result.policy.reason).toBe('persisted-draft-corrupted');
    expect(result.statusKey).toBe('restore-error');
    expect(result.draftSnapshot).toBeNull();
    expect(result.errorDetail).toBe('Persisted draft session schemaVersion is invalid.');
    expect(readBrowserBookmarkTree).not.toHaveBeenCalled();
  });

  test('returns a browser read error state when startup browser import fails', async () => {
    const bootstrap = await import('./bootstrapWorkspace');

    const result = await bootstrap.bootstrapWorkspace({
      readPersistedDraftSession: async (): Promise<ReadPersistedDraftSessionResult> => ({
        kind: 'empty',
      }),
      readBrowserBookmarkTree: async () => ({
        kind: 'error',
        error: 'Chrome bookmarks runtime failed.',
      }),
    });

    expect(result.policy.action).toBe('await-browser-import');
    expect(result.policy.reason).toBe('browser-bookmark-read-failed');
    expect(result.statusKey).toBe('browser-read-error');
    expect(result.draftSnapshot).toBeNull();
    expect(result.errorDetail).toBe('Chrome bookmarks runtime failed.');
  });

  test('returns an unsaved import state when browser import succeeds but local persistence write fails', async () => {
    const bootstrap = await import('./bootstrapWorkspace');

    const result = await bootstrap.bootstrapWorkspace({
      readPersistedDraftSession: async (): Promise<ReadPersistedDraftSessionResult> => ({
        kind: 'empty',
      }),
      readBrowserBookmarkTree: async () => ({
        kind: 'loaded',
        tree: [
          {
            id: '1',
            parentId: '0',
            title: 'Bookmarks Bar',
            children: [
              {
                id: '10',
                parentId: '1',
                title: 'Docs',
                url: 'https://docs.example.com',
              },
            ],
          },
        ],
      }),
      writePersistedDraftSession: vi.fn(async () => ({
        kind: 'error' as const,
        error: 'Storage quota exceeded.',
      })),
    });

    expect(result.policy.action).toBe('import-browser-tree');
    expect(result.statusKey).toBe('imported-browser-tree-unsaved');
    expect(result.draftSnapshot).not.toBeNull();
    expect(result.errorDetail).toBe('Storage quota exceeded.');
  });

  test('returns a localized unsaved import detail when local persistence is unavailable', async () => {
    const bootstrap = await import('./bootstrapWorkspace');

    const result = await bootstrap.bootstrapWorkspace({
      readPersistedDraftSession: async (): Promise<ReadPersistedDraftSessionResult> => ({
        kind: 'empty',
      }),
      readBrowserBookmarkTree: async () => ({
        kind: 'loaded',
        tree: [
          {
            id: '1',
            parentId: '0',
            title: 'Bookmarks Bar',
            children: [
              {
                id: '10',
                parentId: '1',
                title: 'Docs',
                url: 'https://docs.example.com',
              },
            ],
          },
        ],
      }),
      writePersistedDraftSession: async () => ({
        kind: 'unavailable',
      }),
    });

    expect(result.policy.action).toBe('import-browser-tree');
    expect(result.statusKey).toBe('imported-browser-tree-unsaved');
    expect(result.errorDetail).toBe('本地存储不可用，草稿尚未保存。');
  });
});
