import { describe, expect, test } from 'vitest';

describe('T04 draft graph contracts', () => {
  test('exports a versioned validator for the normalized draft snapshot boundary', async () => {
    const contracts = await import('./contracts');

    expect(contracts.DRAFT_GRAPH_SCHEMA_VERSION).toBeTypeOf('string');
    expect(contracts.validateDraftGraphSnapshot).toBeTypeOf('function');

    const validation = contracts.validateDraftGraphSnapshot({
      schemaVersion: contracts.DRAFT_GRAPH_SCHEMA_VERSION,
      snapshotVersion: 3,
      selectedNodeId: 'bookmark-1',
      nodesById: {
        'folder-1': {
          internalId: 'folder-1',
          sourceType: 'browser',
          nodeType: 'folder',
          title: 'Root Folder',
          url: null,
          parentId: null,
          childIds: ['bookmark-1'],
          pathTokens: ['Root Folder'],
        },
        'bookmark-1': {
          internalId: 'bookmark-1',
          sourceType: 'browser',
          nodeType: 'bookmark',
          title: 'Example',
          url: 'https://example.com',
          parentId: 'folder-1',
          childIds: [],
          pathTokens: ['Root Folder', 'Example'],
        },
      },
      rootIds: ['folder-1'],
    });

    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value).toEqual(
        expect.objectContaining({
          schemaVersion: contracts.DRAFT_GRAPH_SCHEMA_VERSION,
          snapshotVersion: 3,
          rootIds: ['folder-1'],
          selectedNodeId: 'bookmark-1',
        }),
      );
      expect(validation.value).not.toHaveProperty('expandedStateById');
      expect(validation.value).not.toHaveProperty('nodePositionsById');
      expect(validation.value).not.toHaveProperty('duplicateUrlIndex');
    }
  });

  test('rejects node snapshots that violate folder or bookmark url invariants', async () => {
    const contracts = await import('./contracts');

    const folderWithUrl = contracts.validateDraftGraphSnapshot({
      schemaVersion: contracts.DRAFT_GRAPH_SCHEMA_VERSION,
      snapshotVersion: 1,
      selectedNodeId: null,
      nodesById: {
        'folder-1': {
          internalId: 'folder-1',
          sourceType: 'browser',
          nodeType: 'folder',
          title: 'Broken Folder',
          url: 'https://should-not-exist.example',
          parentId: null,
          childIds: [],
          pathTokens: ['Broken Folder'],
        },
      },
      rootIds: ['folder-1'],
    });

    const bookmarkWithoutUrl = contracts.validateDraftGraphSnapshot({
      schemaVersion: contracts.DRAFT_GRAPH_SCHEMA_VERSION,
      snapshotVersion: 1,
      selectedNodeId: null,
      nodesById: {
        'bookmark-1': {
          internalId: 'bookmark-1',
          sourceType: 'draft',
          nodeType: 'bookmark',
          title: 'Broken Bookmark',
          url: '',
          parentId: null,
          childIds: [],
          pathTokens: ['Broken Bookmark'],
        },
      },
      rootIds: ['bookmark-1'],
    });

    expect(folderWithUrl.ok).toBe(false);
    expect(bookmarkWithoutUrl.ok).toBe(false);
  });

  test('rejects node snapshots whose non-root parentId points to a missing node', async () => {
    const contracts = await import('./contracts');

    const validation = contracts.validateDraftGraphSnapshot({
      schemaVersion: contracts.DRAFT_GRAPH_SCHEMA_VERSION,
      snapshotVersion: 1,
      selectedNodeId: null,
      nodesById: {
        'bookmark-1': {
          internalId: 'bookmark-1',
          sourceType: 'draft',
          nodeType: 'bookmark',
          title: 'Orphan Bookmark',
          url: 'https://example.com',
          parentId: 'missing-parent',
          childIds: [],
          pathTokens: ['Orphan Bookmark'],
        },
      },
      rootIds: ['bookmark-1'],
    });

    expect(validation.ok).toBe(false);
  });

  test('defines patch-only undo entries and the frozen semantic mutation set', async () => {
    const contracts = await import('./contracts');

    expect(contracts.DRAFT_UNDO_MUTATION_TYPES).toEqual([
      'create-node',
      'move-node',
      'rename-node',
      'delete-subtree',
      'edit-bookmark-url',
    ]);
    expect(contracts.validateUndoEntry).toBeTypeOf('function');

    const validUndoEntry = contracts.validateUndoEntry({
      timestamp: '2026-04-05T12:00:00.000Z',
      mutationType: 'move-node',
      affectedNodeIds: ['bookmark-1'],
      beforeStatePayload: {
        parentId: 'folder-1',
        childIds: ['bookmark-1'],
      },
      afterStatePayload: {
        parentId: 'folder-2',
        childIds: ['bookmark-1'],
      },
      storageMode: 'patch',
    });

    const invalidUndoEntry = contracts.validateUndoEntry({
      timestamp: '2026-04-05T12:00:00.000Z',
      mutationType: {
        unexpected: 'move-node',
      },
      affectedNodeIds: ['bookmark-1'],
      beforeStatePayload: {
        parentId: 'folder-1',
      },
      afterStatePayload: {
        parentId: 'folder-2',
      },
      storageMode: 'snapshot',
    });

    expect(validUndoEntry.ok).toBe(true);
    expect(invalidUndoEntry.ok).toBe(false);
  });

  test('validates draft checkpoint metadata boundaries independently', async () => {
    const contracts = await import('./contracts');

    expect(contracts.validateDraftCheckpoint).toBeTypeOf('function');

    const validCheckpoint = contracts.validateDraftCheckpoint({
      createdAt: '2026-04-05T12:00:00.000Z',
      snapshotVersion: 4,
      storageKey: 'draft-checkpoints/4',
      sizeBytes: 1024,
    });

    const invalidCheckpoint = contracts.validateDraftCheckpoint({
      createdAt: '',
      snapshotVersion: -1,
      storageKey: '',
      sizeBytes: -8,
    });

    expect(validCheckpoint.ok).toBe(true);
    expect(invalidCheckpoint.ok).toBe(false);
  });
});
