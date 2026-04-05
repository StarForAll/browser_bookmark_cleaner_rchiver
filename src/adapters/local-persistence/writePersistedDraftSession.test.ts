import { describe, expect, test, vi } from 'vitest';
import type { PersistedDraftSession } from './contracts';
import { writePersistedDraftSession } from './writePersistedDraftSession';

describe('T05 local persisted draft writer adapter', () => {
  test('persists the current draft session into chrome.storage.local keys', async () => {
    const set = vi.fn(async () => undefined);
    const session: PersistedDraftSession = {
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
    };

    const result = await writePersistedDraftSession(session, { set });

    expect(result).toEqual({ kind: 'saved' });
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({
      'draft-snapshot': session.draftSnapshot,
      'expanded-state-by-id': {},
      'node-positions-by-id': {},
      'draft-undo-history': [],
      'draft-checkpoints': [],
    });
  });

  test('returns unavailable when chrome.storage.local cannot be written', async () => {
    const session: PersistedDraftSession = {
      schemaVersion: 'local-persistence/v1',
      draftSnapshot: {
        schemaVersion: 'draft-graph/v1',
        snapshotVersion: 1,
        selectedNodeId: null,
        nodesById: {},
        rootIds: [],
      },
      expandedStateById: {},
      nodePositionsById: {},
      undoHistory: [],
      checkpoints: [],
    };

    await expect(writePersistedDraftSession(session)).resolves.toEqual({
      kind: 'unavailable',
    });
  });
});
