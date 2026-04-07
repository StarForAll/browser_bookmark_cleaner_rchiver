import { describe, expect, test } from 'vitest';
import type { DraftGraphSnapshot } from './contracts';
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

type MoveDraftNodeInput = {
  nodeId: string;
  targetParentId: string | null;
  targetIndex?: number;
};

type MoveDraftNodeResult =
  | {
      ok: true;
      snapshot: DraftGraphSnapshot;
    }
  | {
      ok: false;
      error: string;
    };

type EditingModuleWithMove = typeof import('./editing') & {
  moveDraftNode?: (snapshot: DraftGraphSnapshot, input: MoveDraftNodeInput) => MoveDraftNodeResult;
};

function createMultiRootDraftGraphFixture(): DraftGraphSnapshot {
  const snapshot = createDraftGraphFixture();

  return {
    ...snapshot,
    nodesById: {
      ...snapshot.nodesById,
      'folder-personal': {
        internalId: 'folder-personal',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '个人收藏',
        url: null,
        parentId: null,
        childIds: ['bookmark-start'],
        pathTokens: ['个人收藏'],
      },
      'bookmark-start': {
        internalId: 'bookmark-start',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '起始页',
        url: 'https://start.example.com',
        parentId: 'folder-personal',
        childIds: [],
        pathTokens: ['个人收藏', '起始页'],
      },
    },
    rootIds: ['folder-root', 'folder-personal'],
  };
}

describe('T07A draft graph drag-move domain gate', () => {
  test('moves a top-level root node into another folder and removes it from rootIds', async () => {
    const editing = (await import('./editing')) as EditingModuleWithMove;
    const moveDraftNode = editing.moveDraftNode;
    const initialSnapshot = createMultiRootDraftGraphFixture();

    expect(moveDraftNode).toBeTypeOf('function');
    if (!moveDraftNode) {
      return;
    }

    const moveResult = moveDraftNode(initialSnapshot, {
      nodeId: 'folder-personal',
      targetParentId: 'folder-root',
      targetIndex: 1,
    });

    expect(moveResult.ok).toBe(true);
    if (moveResult.ok) {
      expect(moveResult.snapshot.rootIds).toEqual(['folder-root']);
      expect(moveResult.snapshot.nodesById['folder-root']?.childIds).toEqual([
        'bookmark-docs',
        'folder-personal',
        'folder-archive',
      ]);
      expect(moveResult.snapshot.nodesById['folder-personal']).toEqual(
        expect.objectContaining({
          parentId: 'folder-root',
          pathTokens: ['工作资料', '个人收藏'],
        }),
      );
      expect(moveResult.snapshot.nodesById['bookmark-start']?.pathTokens).toEqual([
        '工作资料',
        '个人收藏',
        '起始页',
      ]);
    }
  });

  test('moves a nested node to the top level and adds it into rootIds', async () => {
    const editing = (await import('./editing')) as EditingModuleWithMove;
    const moveDraftNode = editing.moveDraftNode;
    const initialSnapshot = createDraftGraphFixture();

    expect(moveDraftNode).toBeTypeOf('function');
    if (!moveDraftNode) {
      return;
    }

    const moveResult = moveDraftNode(initialSnapshot, {
      nodeId: 'bookmark-docs',
      targetParentId: null,
      targetIndex: 0,
    });

    expect(moveResult.ok).toBe(true);
    if (moveResult.ok) {
      expect(moveResult.snapshot.rootIds).toEqual(['bookmark-docs', 'folder-root']);
      expect(moveResult.snapshot.nodesById['folder-root']?.childIds).toEqual(['folder-archive']);
      expect(moveResult.snapshot.nodesById['bookmark-docs']).toEqual(
        expect.objectContaining({
          parentId: null,
          pathTokens: ['产品文档'],
        }),
      );
    }
  });

  test('reorders sibling nodes inside the same parent without changing the parent relationship', async () => {
    const editing = (await import('./editing')) as EditingModuleWithMove;
    const moveDraftNode = editing.moveDraftNode;
    const initialSnapshot = createDraftGraphFixture();

    expect(moveDraftNode).toBeTypeOf('function');
    if (!moveDraftNode) {
      return;
    }

    const moveResult = moveDraftNode(initialSnapshot, {
      nodeId: 'folder-archive',
      targetParentId: 'folder-root',
      targetIndex: 0,
    });

    expect(moveResult.ok).toBe(true);
    if (moveResult.ok) {
      expect(moveResult.snapshot.nodesById['folder-root']?.childIds).toEqual(['folder-archive', 'bookmark-docs']);
      expect(moveResult.snapshot.nodesById['folder-archive']).toEqual(
        expect.objectContaining({
          parentId: 'folder-root',
          pathTokens: ['工作资料', '归档'],
        }),
      );
    }
  });

  test('moves a bookmark into a folder while preserving normalized draft invariants', async () => {
    const editing = (await import('./editing')) as EditingModuleWithMove;
    const moveDraftNode = editing.moveDraftNode;
    const initialSnapshot = createDraftGraphFixture();

    expect(moveDraftNode).toBeTypeOf('function');
    if (!moveDraftNode) {
      return;
    }

    const moveResult = moveDraftNode(initialSnapshot, {
      nodeId: 'bookmark-docs',
      targetParentId: 'folder-archive',
      targetIndex: 0,
    });

    expect(moveResult.ok).toBe(true);
    if (moveResult.ok) {
      expect(moveResult.snapshot.nodesById['bookmark-docs']).toEqual(
        expect.objectContaining({
          parentId: 'folder-archive',
          pathTokens: ['工作资料', '归档', '产品文档'],
        }),
      );
      expect(moveResult.snapshot.nodesById['folder-root']?.childIds).toEqual(['folder-archive']);
      expect(moveResult.snapshot.nodesById['folder-archive']?.childIds).toEqual([
        'bookmark-docs',
        'bookmark-legacy',
      ]);
    }
  });

  test('rejects non-folder drop targets before mutating the draft snapshot', async () => {
    const editing = (await import('./editing')) as EditingModuleWithMove;
    const moveDraftNode = editing.moveDraftNode;
    const initialSnapshot = createDraftGraphFixture();

    expect(moveDraftNode).toBeTypeOf('function');
    if (!moveDraftNode) {
      return;
    }

    const moveResult = moveDraftNode(initialSnapshot, {
      nodeId: 'folder-archive',
      targetParentId: 'bookmark-docs',
    });

    expect(moveResult.ok).toBe(false);
    if (!moveResult.ok) {
      expect(moveResult.error.trim().length).toBeGreaterThan(0);
    }
    expect(initialSnapshot.nodesById['folder-root']?.childIds).toEqual(['bookmark-docs', 'folder-archive']);
    expect(initialSnapshot.nodesById['folder-archive']?.parentId).toBe('folder-root');
  });

  test('rejects moves that would place a folder inside its own descendant subtree', async () => {
    const editing = (await import('./editing')) as EditingModuleWithMove;
    const moveDraftNode = editing.moveDraftNode;
    const initialSnapshot = createDraftGraphFixture();

    expect(moveDraftNode).toBeTypeOf('function');
    if (!moveDraftNode) {
      return;
    }

    const moveResult = moveDraftNode(initialSnapshot, {
      nodeId: 'folder-root',
      targetParentId: 'folder-archive',
    });

    expect(moveResult.ok).toBe(false);
    if (!moveResult.ok) {
      expect(moveResult.error.trim().length).toBeGreaterThan(0);
    }
    expect(initialSnapshot.rootIds).toEqual(['folder-root']);
    expect(initialSnapshot.nodesById['folder-archive']?.parentId).toBe('folder-root');
  });
});
