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

type CreateDraftSiblingNodeInput = {
  referenceNodeId: string;
  nodeType: 'folder' | 'bookmark';
  title: string;
  url?: string;
};

type MoveDraftNodeInput = {
  nodeId: string;
  targetParentId: string | null;
  targetIndex?: number;
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

function validateCreateNodeInput(
  nodeType: 'folder' | 'bookmark',
  title: string,
  url?: string,
): { ok: true; normalizedTitle: string; normalizedUrl: string } | { ok: false; error: string } {
  const normalizedTitle = title.trim();
  if (normalizedTitle.length === 0) {
    return {
      ok: false,
      error: '标题必填。',
    };
  }

  const normalizedUrl = (url ?? '').trim();
  if (nodeType === 'bookmark' && normalizedUrl.length === 0) {
    return {
      ok: false,
      error: 'URL 必填。',
    };
  }

  if (nodeType === 'folder' && normalizedUrl.length > 0) {
    return {
      ok: false,
      error: '目录节点不能设置 URL。',
    };
  }

  return {
    ok: true,
    normalizedTitle,
    normalizedUrl,
  };
}

function buildCreatedNode(
  snapshot: DraftGraphSnapshot,
  parentId: string | null,
  nodeType: 'folder' | 'bookmark',
  normalizedTitle: string,
  normalizedUrl: string,
  createdNodeId: string,
  nodesById: DraftGraphSnapshot['nodesById'],
): DraftGraphNode {
  const parentPathTokens = parentId === null ? [] : (nodesById[parentId]?.pathTokens ?? []);

  return {
    internalId: createdNodeId,
    sourceType: 'draft',
    nodeType,
    title: normalizedTitle,
    url: nodeType === 'bookmark' ? normalizedUrl : null,
    parentId,
    childIds: [],
    pathTokens: [...parentPathTokens, normalizedTitle],
  };
}

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

function collectAncestorIds(
  nodesById: DraftGraphSnapshot['nodesById'],
  nodeId: string,
): Set<string> {
  const ancestorIds = new Set<string>();
  let cursor = nodesById[nodeId]?.parentId ?? null;

  while (cursor !== null) {
    ancestorIds.add(cursor);
    cursor = nodesById[cursor]?.parentId ?? null;
  }

  return ancestorIds;
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
  ) as Record<string, DraftGraphNode>;
  const editableNode = nodesById[input.nodeId];
  if (!editableNode) {
    return {
      ok: false,
      error: '当前节点结构无效，无法编辑。',
    };
  }
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

  const validationInput = validateCreateNodeInput(input.nodeType, input.title, input.url);
  if (!validationInput.ok) {
    return validationInput;
  }

  const createdNodeId = nextDraftNodeId(snapshot);
  const nodesById = Object.fromEntries(
    Object.entries(snapshot.nodesById).map(([id, node]) => [id, cloneNode(node)]),
  ) as Record<string, DraftGraphNode>;

  const clonedParent = nodesById[input.parentId];
  if (!clonedParent) {
    return {
      ok: false,
      error: '当前节点结构无效，无法创建子节点。',
    };
  }

  clonedParent.childIds.push(createdNodeId);
  nodesById[createdNodeId] = buildCreatedNode(
    snapshot,
    input.parentId,
    input.nodeType,
    validationInput.normalizedTitle,
    validationInput.normalizedUrl,
    createdNodeId,
    nodesById,
  );

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

export function createDraftSiblingNode(
  snapshot: DraftGraphSnapshot,
  input: CreateDraftSiblingNodeInput,
): CreateChildResult {
  const referenceNode = snapshot.nodesById[input.referenceNodeId];
  if (!referenceNode) {
    return {
      ok: false,
      error: '参考节点不存在。',
    };
  }

  const validationInput = validateCreateNodeInput(input.nodeType, input.title, input.url);
  if (!validationInput.ok) {
    return validationInput;
  }

  const createdNodeId = nextDraftNodeId(snapshot);
  const nodesById = Object.fromEntries(
    Object.entries(snapshot.nodesById).map(([id, node]) => [id, cloneNode(node)]),
  ) as Record<string, DraftGraphNode>;
  const nextRootIds = [...snapshot.rootIds];
  const parentId = referenceNode.parentId;

  if (parentId === null) {
    const referenceIndex = nextRootIds.indexOf(input.referenceNodeId);
    const insertIndex = referenceIndex >= 0 ? referenceIndex + 1 : nextRootIds.length;
    nextRootIds.splice(insertIndex, 0, createdNodeId);
  } else {
    const clonedParent = nodesById[parentId];
    if (!clonedParent) {
      return {
        ok: false,
        error: '当前节点结构无效，无法创建同级节点。',
      };
    }

    const siblingIds = clonedParent.childIds;
    const referenceIndex = siblingIds.indexOf(input.referenceNodeId);
    const insertIndex = referenceIndex >= 0 ? referenceIndex + 1 : siblingIds.length;
    siblingIds.splice(insertIndex, 0, createdNodeId);
  }

  nodesById[createdNodeId] = buildCreatedNode(
    snapshot,
    parentId,
    input.nodeType,
    validationInput.normalizedTitle,
    validationInput.normalizedUrl,
    createdNodeId,
    nodesById,
  );

  const validation = withValidatedSnapshot({
    ...snapshot,
    snapshotVersion: nextSnapshotVersion(snapshot),
    nodesById,
    rootIds: nextRootIds,
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

export function moveDraftNode(
  snapshot: DraftGraphSnapshot,
  input: MoveDraftNodeInput,
): EditResult {
  const targetNode = snapshot.nodesById[input.nodeId];
  if (!targetNode) {
    return {
      ok: false,
      error: '目标节点不存在。',
    };
  }

  const targetParent = input.targetParentId === null ? null : snapshot.nodesById[input.targetParentId];
  if (input.targetParentId !== null && !targetParent) {
    return {
      ok: false,
      error: '投放目标不存在。',
    };
  }

  if (targetParent && targetParent.nodeType !== 'folder') {
    return {
      ok: false,
      error: '只能投放到目录节点。',
    };
  }

  if (targetParent && targetNode.internalId === targetParent.internalId) {
    return {
      ok: false,
      error: '不能将节点移动到自身之下。',
    };
  }

  if (input.targetParentId !== null) {
    const ancestorIds = collectAncestorIds(snapshot.nodesById, input.targetParentId);
    if (ancestorIds.has(targetNode.internalId)) {
      return {
        ok: false,
        error: '不能将目录移动到自己的子树之下。',
      };
    }
  }

  if (targetNode.parentId === input.targetParentId && input.targetIndex === undefined) {
    return {
      ok: true,
      snapshot,
    };
  }

  const nodesById = Object.fromEntries(
    Object.entries(snapshot.nodesById).map(([id, node]) => [id, cloneNode(node)]),
  ) as Record<string, DraftGraphNode>;
  const movingNode = nodesById[input.nodeId];
  if (!movingNode) {
    return {
      ok: false,
      error: '当前节点结构无效，无法移动。',
    };
  }
  const sourceParentId = movingNode.parentId;
  const nextRootIds = [...snapshot.rootIds];

  const sourceSiblingIds =
    sourceParentId === null
      ? nextRootIds
      : nodesById[sourceParentId]?.childIds;
  const targetSiblingIds =
    input.targetParentId === null
      ? nextRootIds
      : nodesById[input.targetParentId]?.childIds;
  if (!sourceSiblingIds || !targetSiblingIds) {
    return {
      ok: false,
      error: '当前节点结构无效，无法移动。',
    };
  }

  if (sourceParentId === input.targetParentId) {
    const nextSiblingIds = sourceSiblingIds.filter((childId) => childId !== input.nodeId);
    const boundedTargetIndex = Math.max(0, Math.min(input.targetIndex ?? 0, nextSiblingIds.length));
    nextSiblingIds.splice(boundedTargetIndex, 0, input.nodeId);

    if (sourceParentId === null) {
      nextRootIds.splice(0, nextRootIds.length, ...nextSiblingIds);
    } else {
      const sourceParent = nodesById[sourceParentId];
      if (!sourceParent) {
        return {
          ok: false,
          error: '当前节点结构无效，无法移动。',
        };
      }

      sourceParent.childIds = nextSiblingIds;
    }
  } else {
    const nextSourceSiblingIds = sourceSiblingIds.filter((childId) => childId !== input.nodeId);
    const nextTargetSiblingIds = targetSiblingIds.filter((childId) => childId !== input.nodeId);
    const boundedTargetIndex = Math.max(0, Math.min(input.targetIndex ?? 0, nextTargetSiblingIds.length));
    nextTargetSiblingIds.splice(boundedTargetIndex, 0, input.nodeId);

    if (sourceParentId === null) {
      nextRootIds.splice(0, nextRootIds.length, ...nextSourceSiblingIds);
    } else {
      const sourceParent = nodesById[sourceParentId];
      if (!sourceParent) {
        return {
          ok: false,
          error: '当前节点结构无效，无法移动。',
        };
      }

      sourceParent.childIds = nextSourceSiblingIds;
    }

    if (input.targetParentId === null) {
      nextRootIds.splice(0, nextRootIds.length, ...nextTargetSiblingIds);
    } else {
      const targetParentNode = nodesById[input.targetParentId];
      if (!targetParentNode) {
        return {
          ok: false,
          error: '当前节点结构无效，无法移动。',
        };
      }

      targetParentNode.childIds = nextTargetSiblingIds;
    }
  }

  movingNode.parentId = input.targetParentId;
  updateNodePathTokens(nodesById, movingNode.internalId, targetParent?.pathTokens ?? []);

  return withValidatedSnapshot({
    ...snapshot,
    snapshotVersion: nextSnapshotVersion(snapshot),
    nodesById,
    rootIds: nextRootIds,
  });
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
  ) as Record<string, DraftGraphNode>;

  if (targetNode.parentId !== null) {
    const parentNode = nodesById[targetNode.parentId];
    if (parentNode) {
      parentNode.childIds = parentNode.childIds.filter((childId) => childId !== nodeId);
    }
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
