import { describe, expect, test } from 'vitest';
import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { createDraftGraphFixture } from '../../../../test/fixtures/draftGraph';

function createSelectedDraftGraphFixture(): DraftGraphSnapshot {
  return {
    ...createDraftGraphFixture(),
    selectedNodeId: 'folder-archive',
  };
}

describe('T07B draft undo state gate', () => {
  test('creates patch-based undo entries without duplicating the full draft snapshot', async () => {
    const editing = await import('@/domain/draft-graph/editing');
    const undo = await import('./draftUndo');
    const initialSnapshot = createDraftGraphFixture();
    const createResult = editing.createDraftChildNode(initialSnapshot, {
      parentId: 'folder-root',
      nodeType: 'bookmark',
      title: '设计稿',
      url: 'https://figma.example.com',
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) {
      return;
    }

    const undoEntry = undo.createDraftUndoEntry({
      previousSnapshot: initialSnapshot,
      nextSnapshot: createResult.snapshot,
      mutationType: 'create-node',
      affectedNodeIds: [createResult.createdNodeId],
      timestamp: '2026-04-07T16:00:00.000Z',
    });

    expect(undoEntry).toEqual(
      expect.objectContaining({
        timestamp: '2026-04-07T16:00:00.000Z',
        mutationType: 'create-node',
        affectedNodeIds: [createResult.createdNodeId],
        storageMode: 'patch',
      }),
    );
    expect(undoEntry.beforeStatePayload).not.toHaveProperty('nodesById');
    expect(undoEntry.beforeStatePayload).not.toHaveProperty('rootIds');
    expect(undoEntry.afterStatePayload).not.toHaveProperty('nodesById');
    expect(undoEntry.afterStatePayload).not.toHaveProperty('rootIds');
  });

  test('applies the latest undo entry to restore the previous draft content state and consume one history step', async () => {
    const editing = await import('@/domain/draft-graph/editing');
    const undo = await import('./draftUndo');
    const initialSnapshot = createSelectedDraftGraphFixture();
    const deleteResult = editing.deleteDraftNodeSubtree(initialSnapshot, 'folder-archive');

    expect(deleteResult.ok).toBe(true);
    if (!deleteResult.ok) {
      return;
    }

    const undoEntry = undo.createDraftUndoEntry({
      previousSnapshot: initialSnapshot,
      nextSnapshot: deleteResult.snapshot,
      mutationType: 'delete-subtree',
      affectedNodeIds: deleteResult.deletedNodeIds,
      timestamp: '2026-04-07T16:05:00.000Z',
    });

    const undoResult = undo.applyLatestDraftUndo({
      currentSnapshot: deleteResult.snapshot,
      undoHistory: [undoEntry],
    });

    expect(undoResult.ok).toBe(true);
    if (!undoResult.ok) {
      return;
    }

    expect(undoResult.undoHistory).toEqual([]);
    expect(undoResult.snapshot.selectedNodeId).toBe('folder-archive');
    expect(undoResult.snapshot.nodesById['folder-archive']).toEqual(initialSnapshot.nodesById['folder-archive']);
    expect(undoResult.snapshot.nodesById['bookmark-legacy']).toEqual(initialSnapshot.nodesById['bookmark-legacy']);
    expect(undoResult.snapshot.nodesById['folder-root']?.childIds).toEqual(
      initialSnapshot.nodesById['folder-root']?.childIds,
    );
  });

  test('returns an explicit empty-history result when Ctrl+Z has no draft mutation to revert', async () => {
    const undo = await import('./draftUndo');

    expect(
      undo.applyLatestDraftUndo({
        currentSnapshot: createDraftGraphFixture(),
        undoHistory: [],
      }),
    ).toEqual({
      ok: false,
      reason: 'empty-history',
    });
  });
});
