import {
  isFiniteNumber,
  isNonNegativeInteger,
  isNonEmptyString,
  isOptionalString,
  isRecord,
  isStringArray,
  validationFailure,
  validationSuccess,
  type ValidationResult,
} from '@/shared/contracts/validation';

export const DRAFT_GRAPH_SCHEMA_VERSION = 'draft-graph/v1';

export const DRAFT_UNDO_MUTATION_TYPES = [
  'create-node',
  'move-node',
  'rename-node',
  'delete-subtree',
  'edit-bookmark-url',
] as const;

export type DraftSourceType = 'browser' | 'draft';
export type DraftNodeType = 'folder' | 'bookmark';
export type DraftUndoMutationType = (typeof DRAFT_UNDO_MUTATION_TYPES)[number];

export type DraftGraphNode = {
  internalId: string;
  sourceType: DraftSourceType;
  nodeType: DraftNodeType;
  title: string;
  url: string | null;
  parentId: string | null;
  childIds: string[];
  pathTokens: string[];
};

export type DraftGraphSnapshot = {
  schemaVersion: typeof DRAFT_GRAPH_SCHEMA_VERSION;
  snapshotVersion: number;
  selectedNodeId: string | null;
  nodesById: Record<string, DraftGraphNode>;
  rootIds: string[];
};

export type DraftUndoEntry = {
  timestamp: string;
  mutationType: DraftUndoMutationType;
  affectedNodeIds: string[];
  beforeStatePayload: Record<string, unknown>;
  afterStatePayload: Record<string, unknown>;
  storageMode: 'patch';
};

export type DraftCheckpoint = {
  createdAt: string;
  snapshotVersion: number;
  storageKey: string;
  sizeBytes: number;
};

function isDraftSourceType(value: unknown): value is DraftSourceType {
  return value === 'browser' || value === 'draft';
}

function isDraftNodeType(value: unknown): value is DraftNodeType {
  return value === 'folder' || value === 'bookmark';
}

function validateNode(nodeKey: string, value: unknown): ValidationResult<DraftGraphNode> {
  if (!isRecord(value)) {
    return validationFailure(`Node ${nodeKey} must be an object.`);
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
    return validationFailure(`Node ${nodeKey} must include a non-empty internalId.`);
  }

  if (internalId !== nodeKey) {
    return validationFailure(`Node ${nodeKey} must match its internalId.`);
  }

  if (!isDraftSourceType(sourceType)) {
    return validationFailure(`Node ${nodeKey} has an unsupported sourceType.`);
  }

  if (!isDraftNodeType(nodeType)) {
    return validationFailure(`Node ${nodeKey} has an unsupported nodeType.`);
  }

  if (typeof title !== 'string') {
    return validationFailure(`Node ${nodeKey} must include a title string.`);
  }

  if (!isOptionalString(parentId)) {
    return validationFailure(`Node ${nodeKey} must include parentId as string or null.`);
  }

  if (!isStringArray(childIds)) {
    return validationFailure(`Node ${nodeKey} must include childIds as strings.`);
  }

  if (!isStringArray(pathTokens)) {
    return validationFailure(`Node ${nodeKey} must include pathTokens as strings.`);
  }

  if (nodeType === 'folder') {
    if (url !== null) {
      return validationFailure(`Folder node ${nodeKey} must use url = null.`);
    }

    return validationSuccess({
      internalId,
      sourceType,
      nodeType,
      title,
      url: null,
      parentId,
      childIds,
      pathTokens,
    });
  }

  if (!isNonEmptyString(url)) {
    return validationFailure(`Bookmark node ${nodeKey} must include a non-empty url.`);
  }

  const bookmarkUrl = url;

  return validationSuccess({
    internalId,
    sourceType,
    nodeType,
    title,
    url: bookmarkUrl,
    parentId,
    childIds,
    pathTokens,
  });
}

export function validateDraftGraphSnapshot(value: unknown): ValidationResult<DraftGraphSnapshot> {
  if (!isRecord(value)) {
    return validationFailure('Draft graph snapshot must be an object.');
  }

  const { schemaVersion, snapshotVersion, selectedNodeId, nodesById, rootIds } = value;

  if (schemaVersion !== DRAFT_GRAPH_SCHEMA_VERSION) {
    return validationFailure('Draft graph snapshot schemaVersion is invalid.');
  }

  if (!isNonNegativeInteger(snapshotVersion)) {
    return validationFailure('Draft graph snapshotVersion must be a non-negative integer.');
  }

  const normalizedSnapshotVersion = snapshotVersion;

  if (!isOptionalString(selectedNodeId)) {
    return validationFailure('Draft graph selectedNodeId must be a string or null.');
  }

  if (!isRecord(nodesById)) {
    return validationFailure('Draft graph nodesById must be a record.');
  }

  if (!isStringArray(rootIds)) {
    return validationFailure('Draft graph rootIds must be a string array.');
  }

  const normalizedNodesById: Record<string, DraftGraphNode> = {};

  for (const [nodeKey, nodeValue] of Object.entries(nodesById)) {
    const nodeValidation = validateNode(nodeKey, nodeValue);
    if (!nodeValidation.ok) {
      return nodeValidation;
    }
    normalizedNodesById[nodeKey] = nodeValidation.value;
  }

  if (selectedNodeId !== null && !(selectedNodeId in normalizedNodesById)) {
    return validationFailure('Draft graph selectedNodeId must reference an existing node.');
  }

  for (const rootId of rootIds) {
    if (!(rootId in normalizedNodesById)) {
      return validationFailure(`Draft graph rootId ${rootId} must reference an existing node.`);
    }
  }

  for (const [nodeKey, node] of Object.entries(normalizedNodesById)) {
    if (node.parentId !== null && !(node.parentId in normalizedNodesById)) {
      return validationFailure(
        `Draft graph node ${nodeKey} must reference an existing parentId when parentId is not null.`,
      );
    }
  }

  return validationSuccess({
    schemaVersion: DRAFT_GRAPH_SCHEMA_VERSION,
    snapshotVersion: normalizedSnapshotVersion,
    selectedNodeId,
    nodesById: normalizedNodesById,
    rootIds,
  });
}

export function validateUndoEntry(value: unknown): ValidationResult<DraftUndoEntry> {
  if (!isRecord(value)) {
    return validationFailure('Undo entry must be an object.');
  }

  const {
    timestamp,
    mutationType,
    affectedNodeIds,
    beforeStatePayload,
    afterStatePayload,
    storageMode,
  } = value;

  if (!isNonEmptyString(timestamp)) {
    return validationFailure('Undo entry timestamp must be a non-empty string.');
  }

  if (
    typeof mutationType !== 'string' ||
    !(DRAFT_UNDO_MUTATION_TYPES as readonly string[]).includes(mutationType)
  ) {
    return validationFailure('Undo entry mutationType is invalid.');
  }

  if (!isStringArray(affectedNodeIds)) {
    return validationFailure('Undo entry affectedNodeIds must be a string array.');
  }

  if (!isRecord(beforeStatePayload) || !isRecord(afterStatePayload)) {
    return validationFailure('Undo entry payloads must be objects.');
  }

  if (storageMode !== 'patch') {
    return validationFailure('Undo entry storageMode must be patch.');
  }

  return validationSuccess({
    timestamp,
    mutationType: mutationType as DraftUndoMutationType,
    affectedNodeIds,
    beforeStatePayload,
    afterStatePayload,
    storageMode,
  });
}

export function validateDraftCheckpoint(value: unknown): ValidationResult<DraftCheckpoint> {
  if (!isRecord(value)) {
    return validationFailure('Draft checkpoint must be an object.');
  }

  const { createdAt, snapshotVersion, storageKey, sizeBytes } = value;

  if (!isNonEmptyString(createdAt)) {
    return validationFailure('Draft checkpoint createdAt must be a non-empty string.');
  }

  if (!isNonNegativeInteger(snapshotVersion)) {
    return validationFailure('Draft checkpoint snapshotVersion must be a non-negative integer.');
  }

  const normalizedSnapshotVersion = snapshotVersion;

  if (!isNonEmptyString(storageKey)) {
    return validationFailure('Draft checkpoint storageKey must be a non-empty string.');
  }

  if (!isFiniteNumber(sizeBytes) || sizeBytes < 0) {
    return validationFailure('Draft checkpoint sizeBytes must be a non-negative number.');
  }

  return validationSuccess({
    createdAt,
    snapshotVersion: normalizedSnapshotVersion,
    storageKey,
    sizeBytes,
  });
}
