import { describe, expect, test } from 'vitest';
import { createDraftGraphFixture } from '../../../test/fixtures/draftGraph';

describe('T06 draft graph editing domain gate', () => {
  test('updates selectedNodeId only within the current draft snapshot', async () => {
    const editing = await import('./editing');
    const initialSnapshot = createDraftGraphFixture();

    const selectedSnapshot = editing.selectDraftNode(initialSnapshot, 'folder-archive');
    const clearedSnapshot = editing.selectDraftNode(selectedSnapshot, null);

    expect(selectedSnapshot.selectedNodeId).toBe('folder-archive');
    expect(clearedSnapshot.selectedNodeId).toBeNull();
    expect(clearedSnapshot.nodesById).toEqual(initialSnapshot.nodesById);
  });

  test('edits bookmark fields while preserving folder and bookmark invariants', async () => {
    const editing = await import('./editing');
    const initialSnapshot = createDraftGraphFixture();

    const bookmarkEdit = editing.editDraftNode(initialSnapshot, {
      nodeId: 'bookmark-docs',
      title: '产品文档（已整理）',
      url: 'https://docs.example.com/guide',
    });
    const invalidFolderEdit = editing.editDraftNode(initialSnapshot, {
      nodeId: 'folder-root',
      title: '工作资料',
      url: 'https://should-not-exist.example.com',
    });

    expect(bookmarkEdit.ok).toBe(true);
    if (bookmarkEdit.ok) {
      expect(bookmarkEdit.snapshot.nodesById['bookmark-docs']).toEqual(
        expect.objectContaining({
          title: '产品文档（已整理）',
          url: 'https://docs.example.com/guide',
          nodeType: 'bookmark',
        }),
      );
      expect(bookmarkEdit.snapshot.nodesById['folder-root']).toEqual(
        expect.objectContaining({
          url: null,
          nodeType: 'folder',
        }),
      );
    }

    expect(invalidFolderEdit.ok).toBe(false);
  });

  test('creates folder and bookmark children without violating parent-child constraints', async () => {
    const editing = await import('./editing');
    const initialSnapshot = createDraftGraphFixture();

    const createdChild = editing.createDraftChildNode(initialSnapshot, {
      parentId: 'folder-root',
      nodeType: 'bookmark',
      title: '设计稿',
      url: 'https://figma.example.com',
    });
    const invalidChild = editing.createDraftChildNode(initialSnapshot, {
      parentId: 'bookmark-docs',
      nodeType: 'folder',
      title: '不合法子目录',
    });

    expect(createdChild.ok).toBe(true);
    if (createdChild.ok) {
      const newNode = createdChild.snapshot.nodesById[createdChild.createdNodeId];
      expect(newNode).toEqual(
        expect.objectContaining({
          parentId: 'folder-root',
          nodeType: 'bookmark',
          title: '设计稿',
          url: 'https://figma.example.com',
          pathTokens: ['工作资料', '设计稿'],
        }),
      );
      expect(createdChild.snapshot.nodesById['folder-root']?.childIds).toContain(createdChild.createdNodeId);
    }

    expect(invalidChild.ok).toBe(false);
  });

  test('creates sibling nodes under the same parent, including top-level roots without a visible virtual root control', async () => {
    const editing = await import('./editing');
    const initialSnapshot = createDraftGraphFixture();

    const createdRootSibling = editing.createDraftSiblingNode(initialSnapshot, {
      referenceNodeId: 'folder-root',
      nodeType: 'folder',
      title: '个人资料',
    });
    const createdNestedSibling = editing.createDraftSiblingNode(initialSnapshot, {
      referenceNodeId: 'bookmark-docs',
      nodeType: 'bookmark',
      title: '设计规范',
      url: 'https://design.example.com',
    });

    expect(createdRootSibling.ok).toBe(true);
    if (createdRootSibling.ok) {
      const newRootNode = createdRootSibling.snapshot.nodesById[createdRootSibling.createdNodeId];
      expect(createdRootSibling.snapshot.rootIds).toEqual(['folder-root', createdRootSibling.createdNodeId]);
      expect(newRootNode).toEqual(
        expect.objectContaining({
          parentId: null,
          nodeType: 'folder',
          title: '个人资料',
          pathTokens: ['个人资料'],
        }),
      );
    }

    expect(createdNestedSibling.ok).toBe(true);
    if (createdNestedSibling.ok) {
      const newSiblingNode = createdNestedSibling.snapshot.nodesById[createdNestedSibling.createdNodeId];
      expect(createdNestedSibling.snapshot.nodesById['folder-root']?.childIds).toEqual([
        'bookmark-docs',
        createdNestedSibling.createdNodeId,
        'folder-archive',
      ]);
      expect(newSiblingNode).toEqual(
        expect.objectContaining({
          parentId: 'folder-root',
          nodeType: 'bookmark',
          title: '设计规范',
          url: 'https://design.example.com',
          pathTokens: ['工作资料', '设计规范'],
        }),
      );
    }
  });

  test('deletes a selected subtree and clears selection when the removed node was selected', async () => {
    const editing = await import('./editing');
    const initialSnapshot = {
      ...createDraftGraphFixture(),
      selectedNodeId: 'folder-archive',
    };

    const deletionResult = editing.deleteDraftNodeSubtree(initialSnapshot, 'folder-archive');

    expect(deletionResult.ok).toBe(true);
    if (deletionResult.ok) {
      expect(deletionResult.deletedNodeIds).toEqual(['folder-archive', 'bookmark-legacy']);
      expect(deletionResult.snapshot.selectedNodeId).toBeNull();
      expect(deletionResult.snapshot.nodesById['folder-archive']).toBeUndefined();
      expect(deletionResult.snapshot.nodesById['bookmark-legacy']).toBeUndefined();
      expect(deletionResult.snapshot.nodesById['folder-root']?.childIds).toEqual(['bookmark-docs']);
    }
  });
});
