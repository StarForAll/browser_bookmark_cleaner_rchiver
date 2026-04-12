import {
  type DraftCheckpoint,
  validateDraftCheckpoint,
  validateDraftGraphSnapshot,
  validateUndoEntry,
  type DraftGraphSnapshot,
  type DraftUndoEntry,
} from '@/domain/draft-graph/contracts';
import {
  isBooleanRecord,
  isFiniteNumber,
  isNonEmptyString,
  isRecord,
  isOptionalString,
  validationFailure,
  validationSuccess,
  type ValidationResult,
} from '@/shared/contracts/validation';

export const LOCAL_PERSISTENCE_SCHEMA_VERSION = 'local-persistence/v1';

export const LOCAL_PERSISTENCE_KEYS = {
  workspace: {
    draftSnapshot: 'draft-snapshot',
    expandedStateById: 'expanded-state-by-id',
    nodePositionsById: 'node-positions-by-id',
  },
  sensitive: {
    webdavProfile: 'webdav-profile',
    webdavPermissionState: 'webdav-permission-state',
  },
  assets: {
    undoHistory: 'draft-undo-history',
    draftCheckpoints: 'draft-checkpoints',
    latestDraftBackup: 'latest-draft-backup',
    latestBrowserBackup: 'latest-browser-backup',
  },
} as const;

const LOCAL_BACKUP_SOURCE_ORIGINS = [
  'webdav-bookmark-version',
  'webdav-draft-version',
  'draft-sync',
  'browser-current-tree',
] as const;

const ALLOWED_BACKUP_SOURCE_COMBINATIONS = [
  {
    artifactType: 'draft-restore-backup',
    sourceOrigin: 'webdav-draft-version',
    sourceObjectType: 'draft',
  },
  {
    artifactType: 'draft-restore-backup',
    sourceOrigin: 'browser-current-tree',
    sourceObjectType: 'browser',
  },
  {
    artifactType: 'browser-restore-backup',
    sourceOrigin: 'webdav-bookmark-version',
    sourceObjectType: 'browser',
  },
  {
    artifactType: 'browser-restore-backup',
    sourceOrigin: 'draft-sync',
    sourceObjectType: 'draft',
  },
] as const;

type LocalBackupSourceOrigin = (typeof LOCAL_BACKUP_SOURCE_ORIGINS)[number];

const WEBDAV_TEST_STATUSES = ['untested', 'success', 'error'] as const;

export type WebdavTestStatus = (typeof WEBDAV_TEST_STATUSES)[number];

export type WebdavProfile = {
  endpointUrl: string;
  username: string;
  password: string;
  lastTestedAt: string | null;
  lastTestStatus: WebdavTestStatus;
};

export type WebdavPermissionState = {
  origin: string;
  granted: boolean;
};

type NodePosition = {
  x: number;
  y: number;
};

export type PersistedDraftSession = {
  schemaVersion: typeof LOCAL_PERSISTENCE_SCHEMA_VERSION;
  draftSnapshot: DraftGraphSnapshot;
  expandedStateById: Record<string, boolean>;
  nodePositionsById: Record<string, NodePosition>;
  undoHistory: DraftUndoEntry[];
  checkpoints: DraftCheckpoint[];
};

export type LocalBackupMetadata = {
  artifactId: string;
  artifactType: 'browser-restore-backup' | 'draft-restore-backup';
  schemaVersion: typeof LOCAL_PERSISTENCE_SCHEMA_VERSION;
  createdAt: string;
  payloadFormat: string;
  storageKey: string;
  sizeBytes: number;
  sourceObjectType: 'browser' | 'draft';
  targetObjectType: 'browser' | 'draft';
  triggerAction: string;
  sourceOrigin: LocalBackupSourceOrigin;
  sourceVersionId: string | null;
  sourceVersionLabel: string | null;
};

function isNodePositionRecord(value: unknown): value is Record<string, NodePosition> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((position) => {
    if (!isRecord(position)) {
      return false;
    }

    return isFiniteNumber(position.x) && isFiniteNumber(position.y);
  });
}

function isLocalBackupSourceOrigin(value: unknown): value is LocalBackupSourceOrigin {
  return (LOCAL_BACKUP_SOURCE_ORIGINS as readonly string[]).includes(String(value));
}

function isWebdavTestStatus(value: unknown): value is WebdavTestStatus {
  return (WEBDAV_TEST_STATUSES as readonly string[]).includes(String(value));
}

function isValidWebdavEndpointUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.username.length === 0 &&
      parsed.password.length === 0
    );
  } catch {
    return false;
  }
}

export function validatePersistedDraftSession(value: unknown): ValidationResult<PersistedDraftSession> {
  if (!isRecord(value)) {
    return validationFailure('Persisted draft session must be an object.');
  }

  const {
    schemaVersion,
    draftSnapshot,
    expandedStateById,
    nodePositionsById,
    undoHistory,
    checkpoints,
  } = value;

  if (schemaVersion !== LOCAL_PERSISTENCE_SCHEMA_VERSION) {
    return validationFailure('Persisted draft session schemaVersion is invalid.');
  }

  const draftSnapshotValidation = validateDraftGraphSnapshot(draftSnapshot);
  if (!draftSnapshotValidation.ok) {
    return draftSnapshotValidation;
  }

  if (!isBooleanRecord(expandedStateById)) {
    return validationFailure('Persisted draft session expandedStateById must be a boolean map.');
  }

  if (!isNodePositionRecord(nodePositionsById)) {
    return validationFailure('Persisted draft session nodePositionsById must be a position map.');
  }

  if (!Array.isArray(undoHistory)) {
    return validationFailure('Persisted draft session undoHistory must be an array.');
  }

  const normalizedUndoHistory: DraftUndoEntry[] = [];
  for (const entry of undoHistory) {
    const undoEntryValidation = validateUndoEntry(entry);
    if (!undoEntryValidation.ok) {
      return undoEntryValidation;
    }
    normalizedUndoHistory.push(undoEntryValidation.value);
  }

  if (!Array.isArray(checkpoints)) {
    return validationFailure('Persisted draft session checkpoints must be an array.');
  }

  const normalizedCheckpoints: PersistedDraftSession['checkpoints'] = [];
  for (const checkpoint of checkpoints) {
    const checkpointValidation = validateDraftCheckpoint(checkpoint);
    if (!checkpointValidation.ok) {
      return checkpointValidation;
    }
    normalizedCheckpoints.push(checkpointValidation.value);
  }

  return validationSuccess({
    schemaVersion: LOCAL_PERSISTENCE_SCHEMA_VERSION,
    draftSnapshot: draftSnapshotValidation.value,
    expandedStateById,
    nodePositionsById,
    undoHistory: normalizedUndoHistory,
    checkpoints: normalizedCheckpoints,
  });
}

export function validateWebdavProfile(value: unknown): ValidationResult<WebdavProfile> {
  if (!isRecord(value)) {
    return validationFailure('WebDAV profile must be an object.');
  }

  const {
    endpointUrl,
    username,
    password,
    lastTestedAt,
    lastTestStatus,
  } = value;

  if (!isNonEmptyString(endpointUrl) || !isValidWebdavEndpointUrl(endpointUrl.trim())) {
    return validationFailure('WebDAV profile endpointUrl must be a valid http(s) URL without embedded credentials.');
  }

  if (!isNonEmptyString(username)) {
    return validationFailure('WebDAV profile username must be non-empty.');
  }

  if (!isNonEmptyString(password)) {
    return validationFailure('WebDAV profile password must be non-empty.');
  }

  if (!isOptionalString(lastTestedAt)) {
    return validationFailure('WebDAV profile lastTestedAt must be a string or null.');
  }

  if (!isWebdavTestStatus(lastTestStatus)) {
    return validationFailure('WebDAV profile lastTestStatus is invalid.');
  }

  return validationSuccess({
    endpointUrl: endpointUrl.trim(),
    username: username.trim(),
    password,
    lastTestedAt,
    lastTestStatus,
  });
}

export function validateWebdavPermissionState(
  value: unknown,
): ValidationResult<WebdavPermissionState> {
  if (!isRecord(value)) {
    return validationFailure('WebDAV permission state must be an object.');
  }

  const { origin, granted } = value;

  if (!isNonEmptyString(origin)) {
    return validationFailure('WebDAV permission state origin must be non-empty.');
  }

  if (typeof granted !== 'boolean') {
    return validationFailure('WebDAV permission state granted must be a boolean.');
  }

  return validationSuccess({
    origin,
    granted,
  });
}

export function validateLocalBackupMetadata(value: unknown): ValidationResult<LocalBackupMetadata> {
  if (!isRecord(value)) {
    return validationFailure('Local backup metadata must be an object.');
  }

  const {
    artifactId,
    artifactType,
    schemaVersion,
    createdAt,
    payloadFormat,
    storageKey,
    sizeBytes,
    sourceObjectType,
    targetObjectType,
    triggerAction,
    sourceOrigin,
    sourceVersionId,
    sourceVersionLabel,
  } = value;

  if (!isNonEmptyString(artifactId)) {
    return validationFailure('Local backup metadata artifactId must be non-empty.');
  }

  if (artifactType !== 'browser-restore-backup' && artifactType !== 'draft-restore-backup') {
    return validationFailure('Local backup metadata artifactType is invalid.');
  }

  if (schemaVersion !== LOCAL_PERSISTENCE_SCHEMA_VERSION) {
    return validationFailure('Local backup metadata schemaVersion is invalid.');
  }

  if (!isNonEmptyString(createdAt)) {
    return validationFailure('Local backup metadata createdAt must be non-empty.');
  }

  if (!isNonEmptyString(payloadFormat)) {
    return validationFailure('Local backup metadata payloadFormat must be non-empty.');
  }

  if (!isNonEmptyString(storageKey)) {
    return validationFailure('Local backup metadata storageKey must be non-empty.');
  }

  if (!isFiniteNumber(sizeBytes) || sizeBytes < 0) {
    return validationFailure('Local backup metadata sizeBytes must be non-negative.');
  }

  if (sourceObjectType !== 'browser' && sourceObjectType !== 'draft') {
    return validationFailure('Local backup metadata sourceObjectType is invalid.');
  }

  if (targetObjectType !== 'browser' && targetObjectType !== 'draft') {
    return validationFailure('Local backup metadata targetObjectType is invalid.');
  }

  if (!isNonEmptyString(triggerAction)) {
    return validationFailure('Local backup metadata triggerAction must be non-empty.');
  }

  if (!isLocalBackupSourceOrigin(sourceOrigin)) {
    return validationFailure('Local backup metadata sourceOrigin is invalid.');
  }

  const hasAllowedCombination = ALLOWED_BACKUP_SOURCE_COMBINATIONS.some(
    (combination) =>
      combination.artifactType === artifactType &&
      combination.sourceOrigin === sourceOrigin &&
      combination.sourceObjectType === sourceObjectType,
  );

  if (!hasAllowedCombination) {
    return validationFailure(
      'Local backup metadata artifactType/sourceOrigin/sourceObjectType combination is invalid.',
    );
  }

  if (!isOptionalString(sourceVersionId) || !isOptionalString(sourceVersionLabel)) {
    return validationFailure('Local backup metadata version fields must be string or null.');
  }

  const expectedStorageKey =
    artifactType === 'draft-restore-backup'
      ? LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup
      : LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup;

  if (storageKey !== expectedStorageKey) {
    return validationFailure('Local backup metadata storageKey does not match artifactType.');
  }

  if (artifactType === 'draft-restore-backup' && targetObjectType !== 'draft') {
    return validationFailure('Draft backup metadata must target draft.');
  }

  if (artifactType === 'browser-restore-backup' && targetObjectType !== 'browser') {
    return validationFailure('Browser backup metadata must target browser.');
  }

  return validationSuccess({
    artifactId,
    artifactType,
    schemaVersion: LOCAL_PERSISTENCE_SCHEMA_VERSION,
    createdAt,
    payloadFormat,
    storageKey,
    sizeBytes,
    sourceObjectType,
    targetObjectType,
    triggerAction,
    sourceOrigin,
    sourceVersionId,
    sourceVersionLabel,
  });
}
