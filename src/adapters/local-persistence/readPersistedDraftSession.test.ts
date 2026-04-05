import { describe, expect, test, vi } from 'vitest';
import { readPersistedDraftSession } from './readPersistedDraftSession';

describe('T05 local persisted draft reader adapter', () => {
  test('restores a persisted draft session from chrome.storage.local keys', async () => {
    const result = await readPersistedDraftSession({
      get: vi.fn(async () => ({
        'draft-snapshot': {
          schemaVersion: 'draft-graph/v1',
          snapshotVersion: 4,
          selectedNodeId: null,
          nodesById: {},
          rootIds: [],
        },
        'expanded-state-by-id': {},
        'node-positions-by-id': {},
        'draft-undo-history': [],
        'draft-checkpoints': [],
      })),
    });

    expect(result).toEqual({
      kind: 'restored',
      session: {
        schemaVersion: 'local-persistence/v1',
        draftSnapshot: {
          schemaVersion: 'draft-graph/v1',
          snapshotVersion: 4,
          selectedNodeId: null,
          nodesById: {},
          rootIds: [],
        },
        expandedStateById: {},
        nodePositionsById: {},
        undoHistory: [],
        checkpoints: [],
      },
    });
  });

  test('returns empty when no persisted draft snapshot exists', async () => {
    const result = await readPersistedDraftSession({
      get: vi.fn(async () => ({})),
    });

    expect(result).toEqual({
      kind: 'empty',
    });
  });
});
