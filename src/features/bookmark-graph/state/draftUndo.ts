import {
  validateDraftGraphSnapshot,
  type DraftGraphNode,
  type DraftGraphSnapshot,
  type DraftUndoEntry,
  type DraftUndoMutationType,
} from '@/domain/draft-graph/contracts';
import {
  isNonEmptyString,
  isNonNegativeInteger,
  isOptionalString,
  isRecord,
  isStringArray,
} from '@/shared/contracts/validation';

type DraftSnapshotPatchPayload = {
  snapshotVersion: number;
  selectedNodeId: string | null;
  nodeMap: Record<string, DraftGraphNode>;
  removedNodeIds: string[];
  rootNodeIds?: string[];
};

type CreateDraftUndoEntryInput = {
  previousSnapshot: DraftGraphSnapshot;
  nextSnapshot: DraftGraphSnapshot;
  mutationType: DraftUndoMutationType;
  affectedNodeIds: string[];
  timestamp: string;
};

type ApplyLatestDraftUndoInput = {
  currentSnapshot: DraftGraphSnapshot;
  undoHistory: DraftUndoEntry[];
};

type ApplyLatestDraftUndoSuccess = {
  ok: true;
  snapshot: DraftGraphSnapshot;
  undoHistory: DraftUndoEntry[];
};

type ApplyLatestDraftUndoFailure = {
  ok: false;
  reason: 'empty-history' | 'invalid-entry';
};

export type ApplyLatestDraftUndoResult = ApplyLatestDraftUndoSuccess | ApplyLatestDraftUndoFailure;

function cloneNode(node: DraftGraphNode): DraftGraphNode {
  return {
    ...node,
    childIds: [...node.childIds],
    pathTokens: [...node.pathTokens],
  };
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function areNodesEqual(left: DraftGraphNode | undefined, right: DraftGraphNode | undefined): boolean {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.internalId === right.internalId &&
    left.sourceType === right.sourceType &&
    left.nodeType === right.nodeType &&
    left.title === right.title &&
    left.url === right.url &&
    left.parentId === right.parentId &&
    areStringArraysEqual(left.childIds, right.childIds) &&
    areStringArraysEqual(left.pathTokens, right.pathTokens)
  );
}

function collectChangedNodeIds(
  previousSnapshot: DraftGraphSnapshot,
  nextSnapshot: DraftGraphSnapshot,
): string[] {
  const allNodeIds = new Set([
    ...Object.keys(previousSnapshot.nodesById),
    ...Object.keys(nextSnapshot.nodesById),
  ]);

  return [...allNodeIds]
    .filter((nodeId) => !areNodesEqual(previousSnapshot.nodesById[nodeId], nextSnapshot.nodesById[nodeId]))
    .sort();
}

function buildPatchPayload(
  snapshot: DraftGraphSnapshot,
  changedNodeIds: string[],
  includeRootNodeIds: boolean,
): DraftSnapshotPatchPayload {
  const nodeMap: Record<string, DraftGraphNode> = {};
  const removedNodeIds: string[] = [];

  for (const nodeId of changedNodeIds) {
    const node = snapshot.nodesById[nodeId];
    if (!node) {
      removedNodeIds.push(nodeId);
      continue;
    }

    nodeMap[nodeId] = cloneNode(node);
  }

  return {
    snapshotVersion: snapshot.snapshotVersion,
    selectedNodeId: snapshot.selectedNodeId,
    nodeMap,
    removedNodeIds,
    ...(includeRootNodeIds ? { rootNodeIds: [...snapshot.rootIds] } : {}),
  };
}

function isDraftNodeLike(value: unknown): value is DraftGraphNode {
  if (!isRecord(value)) {
    return false;
  }

  const {
    internalId,
    sourceType,
    nodeType,
    title,
    url,
    parentId,
    childIds,
    pathTokens,
  } = value;

  if (!isNonEmptyString(internalId)) {
    return false;
  }

  if (sourceType !== 'browser' && sourceType !== 'draft') {
    return false;
  }

  if (nodeType !== 'folder' && nodeType !== 'bookmark') {
    return false;
  }

  if (typeof title !== 'string' || !isOptionalString(parentId) || !isStringArray(childIds) || !isStringArray(pathTokens)) {
    return false;
  }

  if (nodeType === 'folder') {
    return url === null;
  }

  return isNonEmptyString(url);
}

function parsePatchPayload(payload: Record<string, unknown>): DraftSnapshotPatchPayload | null {
  const { snapshotVersion, selectedNodeId, nodeMap, removedNodeIds, rootNodeIds } = payload;

  if (!isNonNegativeInteger(snapshotVersion) || !isOptionalString(selectedNodeId) || !isRecord(nodeMap) || !isStringArray(removedNodeIds)) {
    return null;
  }

  if (rootNodeIds !== undefined && !isStringArray(rootNodeIds)) {
    return null;
  }

  const normalizedNodeMap: Record<string, DraftGraphNode> = {};
  for (const [nodeId, nodeValue] of Object.entries(nodeMap)) {
    if (!isDraftNodeLike(nodeValue) || nodeValue.internalId !== nodeId) {
      return null;
    }

    normalizedNodeMap[nodeId] = cloneNode(nodeValue);
  }

  return {
    snapshotVersion,
    selectedNodeId,
    nodeMap: normalizedNodeMap,
    removedNodeIds: [...removedNodeIds],
    ...(rootNodeIds ? { rootNodeIds: [...rootNodeIds] } : {}),
  };
}

function applySnapshotPatch(
  currentSnapshot: DraftGraphSnapshot,
  patchPayload: DraftSnapshotPatchPayload,
): DraftGraphSnapshot | null {
  const nextNodesById = Object.fromEntries(
    Object.entries(currentSnapshot.nodesById).map(([nodeId, node]) => [nodeId, cloneNode(node)]),
  );

  for (const removedNodeId of patchPayload.removedNodeIds) {
    delete nextNodesById[removedNodeId];
  }

  for (const [nodeId, node] of Object.entries(patchPayload.nodeMap)) {
    nextNodesById[nodeId] = cloneNode(node);
  }

  const validation = validateDraftGraphSnapshot({
    schemaVersion: currentSnapshot.schemaVersion,
    snapshotVersion: patchPayload.snapshotVersion,
    selectedNodeId: patchPayload.selectedNodeId,
    nodesById: nextNodesById,
    rootIds: patchPayload.rootNodeIds ?? currentSnapshot.rootIds,
  });

  return validation.ok ? validation.value : null;
}

export function createDraftUndoEntry({
  previousSnapshot,
  nextSnapshot,
  mutationType,
  affectedNodeIds,
  timestamp,
}: CreateDraftUndoEntryInput): DraftUndoEntry {
  const changedNodeIds = collectChangedNodeIds(previousSnapshot, nextSnapshot);
  const includeRootNodeIds = !areStringArraysEqual(previousSnapshot.rootIds, nextSnapshot.rootIds);

  return {
    timestamp,
    mutationType,
    affectedNodeIds: [...affectedNodeIds],
    beforeStatePayload: buildPatchPayload(previousSnapshot, changedNodeIds, includeRootNodeIds),
    afterStatePayload: buildPatchPayload(nextSnapshot, changedNodeIds, includeRootNodeIds),
    storageMode: 'patch',
  };
}

export function applyLatestDraftUndo({
  currentSnapshot,
  undoHistory,
}: ApplyLatestDraftUndoInput): ApplyLatestDraftUndoResult {
  const latestUndoEntry = undoHistory[undoHistory.length - 1];

  if (!latestUndoEntry) {
    return {
      ok: false,
      reason: 'empty-history',
    };
  }

  const patchPayload = parsePatchPayload(latestUndoEntry.beforeStatePayload);
  if (!patchPayload) {
    return {
      ok: false,
      reason: 'invalid-entry',
    };
  }

  const restoredSnapshot = applySnapshotPatch(currentSnapshot, patchPayload);
  if (!restoredSnapshot) {
    return {
      ok: false,
      reason: 'invalid-entry',
    };
  }

  return {
    ok: true,
    snapshot: restoredSnapshot,
    undoHistory: undoHistory.slice(0, -1),
  };
}
