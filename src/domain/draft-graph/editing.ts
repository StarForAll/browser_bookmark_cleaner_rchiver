import {
  validateDraftGraphSnapshot,
  type DraftGraphNode,
  type DraftGraphSnapshot,
} from './contracts';

type EditDraftNodeInput = {
  nodeId: string;
  title: string;
  url?: string;
};

type CreateDraftChildNodeInput = {
  parentId: string;
  nodeType: 'folder' | 'bookmark';
  title: string;
  url?: string;
};

type EditResult =
  | {
      ok: true;
      snapshot: DraftGraphSnapshot;
    }
  | {
      ok: false;
      error: string;
    };

type CreateChildResult =
  | {
      ok: true;
      snapshot: DraftGraphSnapshot;
      createdNodeId: string;
    }
  | {
      ok: false;
      error: string;
    };

type DeleteResult =
  | {
      ok: true;
      snapshot: DraftGraphSnapshot;
      deletedNodeIds: string[];
    }
  | {
      ok: false;
      error: string;
    };

function withValidatedSnapshot(snapshot: DraftGraphSnapshot): EditResult {
  const validation = validateDraftGraphSnapshot(snapshot);
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.error,
    };
  }

  return {
    ok: true,
    snapshot: validation.value,
  };
}

function cloneNode(node: DraftGraphNode): DraftGraphNode {
  return {
    ...node,
    childIds: [...node.childIds],
    pathTokens: [...node.pathTokens],
  };
}

function updateNodePathTokens(
  nodesById: DraftGraphSnapshot['nodesById'],
  nodeId: string,
  parentTokens: string[],
): void {
  const node = nodesById[nodeId];
  if (!node) {
    return;
  }

  node.pathTokens = [...parentTokens, node.title];
  for (const childId of node.childIds) {
    updateNodePathTokens(nodesById, childId, node.pathTokens);
  }
}

function nextSnapshotVersion(snapshot: DraftGraphSnapshot): number {
  return snapshot.snapshotVersion + 1;
}

function nextDraftNodeId(snapshot: DraftGraphSnapshot): string {
  let counter = nextSnapshotVersion(snapshot);
  let candidate = `draft-${counter}`;
  while (snapshot.nodesById[candidate]) {
    counter += 1;
    candidate = `draft-${counter}`;
  }
  return candidate;
}

export function selectDraftNode(
  snapshot: DraftGraphSnapshot,
  nodeId: string | null,
): DraftGraphSnapshot {
  if (nodeId !== null && !snapshot.nodesById[nodeId]) {
    return snapshot;
  }

  return {
    ...snapshot,
    selectedNodeId: nodeId,
  };
}

export function editDraftNode(
  snapshot: DraftGraphSnapshot,
  input: EditDraftNodeInput,
): EditResult {
  const targetNode = snapshot.nodesById[input.nodeId];
  if (!targetNode) {
    return {
      ok: false,
      error: '目标节点不存在。',
    };
  }

  const normalizedTitle = input.title.trim();
  if (normalizedTitle.length === 0) {
    return {
      ok: false,
      error: '标题必填。',
    };
  }

  if (targetNode.nodeType === 'folder' && (input.url ?? '').trim().length > 0) {
    return {
      ok: false,
      error: '目录节点不能设置 URL。',
    };
  }

  if (targetNode.nodeType === 'bookmark') {
    const normalizedUrl = (input.url ?? '').trim();
    if (normalizedUrl.length === 0) {
      return {
        ok: false,
        error: '书签 URL 必填。',
      };
    }
  }

  const nodesById = Object.fromEntries(
    Object.entries(snapshot.nodesById).map(([id, node]) => [id, cloneNode(node)]),
  );
  const editableNode = nodesById[input.nodeId];
  editableNode.title = normalizedTitle;
  if (editableNode.nodeType === 'bookmark') {
    editableNode.url = (input.url ?? '').trim();
  } else {
    editableNode.url = null;
  }

  const parentTokens =
    editableNode.parentId === null ? [] : (nodesById[editableNode.parentId]?.pathTokens ?? []);
  updateNodePathTokens(nodesById, editableNode.internalId, parentTokens);

  return withValidatedSnapshot({
    ...snapshot,
    snapshotVersion: nextSnapshotVersion(snapshot),
    nodesById,
  });
}

export function createDraftChildNode(
  snapshot: DraftGraphSnapshot,
  input: CreateDraftChildNodeInput,
): CreateChildResult {
  const parent = snapshot.nodesById[input.parentId];
  if (!parent) {
    return {
      ok: false,
      error: '父节点不存在。',
    };
  }

  if (parent.nodeType !== 'folder') {
    return {
      ok: false,
      error: '只有目录节点可以创建子节点。',
    };
  }

  const normalizedTitle = input.title.trim();
  if (normalizedTitle.length === 0) {
    return {
      ok: false,
      error: '标题必填。',
    };
  }

  const normalizedUrl = (input.url ?? '').trim();
  if (input.nodeType === 'bookmark' && normalizedUrl.length === 0) {
    return {
      ok: false,
      error: 'URL 必填。',
    };
  }

  if (input.nodeType === 'folder' && normalizedUrl.length > 0) {
    return {
      ok: false,
      error: '目录节点不能设置 URL。',
    };
  }

  const createdNodeId = nextDraftNodeId(snapshot);
  const nodesById = Object.fromEntries(
    Object.entries(snapshot.nodesById).map(([id, node]) => [id, cloneNode(node)]),
  );

  nodesById[input.parentId].childIds.push(createdNodeId);
  nodesById[createdNodeId] = {
    internalId: createdNodeId,
    sourceType: 'draft',
    nodeType: input.nodeType,
    title: normalizedTitle,
    url: input.nodeType === 'bookmark' ? normalizedUrl : null,
    parentId: input.parentId,
    childIds: [],
    pathTokens: [...nodesById[input.parentId].pathTokens, normalizedTitle],
  };

  const validation = withValidatedSnapshot({
    ...snapshot,
    snapshotVersion: nextSnapshotVersion(snapshot),
    nodesById,
  });

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    snapshot: validation.snapshot,
    createdNodeId,
  };
}

function collectSubtreeIds(
  nodesById: DraftGraphSnapshot['nodesById'],
  nodeId: string,
  output: string[],
): void {
  const node = nodesById[nodeId];
  if (!node) {
    return;
  }
  output.push(nodeId);
  for (const childId of node.childIds) {
    collectSubtreeIds(nodesById, childId, output);
  }
}

export function deleteDraftNodeSubtree(
  snapshot: DraftGraphSnapshot,
  nodeId: string,
): DeleteResult {
  const targetNode = snapshot.nodesById[nodeId];
  if (!targetNode) {
    return {
      ok: false,
      error: '目标节点不存在。',
    };
  }

  const deletedNodeIds: string[] = [];
  collectSubtreeIds(snapshot.nodesById, nodeId, deletedNodeIds);

  const deletedSet = new Set(deletedNodeIds);
  const nodesById = Object.fromEntries(
    Object.entries(snapshot.nodesById)
      .filter(([id]) => !deletedSet.has(id))
      .map(([id, node]) => [id, cloneNode(node)]),
  );

  if (targetNode.parentId !== null && nodesById[targetNode.parentId]) {
    nodesById[targetNode.parentId].childIds = nodesById[targetNode.parentId].childIds.filter(
      (childId) => childId !== nodeId,
    );
  }

  const nextRootIds = snapshot.rootIds.filter((rootId) => rootId !== nodeId);
  const nextSelectedNodeId =
    snapshot.selectedNodeId !== null && deletedSet.has(snapshot.selectedNodeId)
      ? null
      : snapshot.selectedNodeId;

  const validation = withValidatedSnapshot({
    ...snapshot,
    snapshotVersion: nextSnapshotVersion(snapshot),
    selectedNodeId: nextSelectedNodeId,
    nodesById,
    rootIds: nextRootIds,
  });

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    snapshot: validation.snapshot,
    deletedNodeIds,
  };
}
