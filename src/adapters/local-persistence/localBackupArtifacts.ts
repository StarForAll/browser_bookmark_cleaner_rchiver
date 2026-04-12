import { validateBrowserBookmarkTree, type BrowserBookmarkTreeNode } from '@/adapters/browser-bookmarks/contracts';
import { validateDraftGraphSnapshot, type DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import {
  LOCAL_PERSISTENCE_KEYS,
  LOCAL_PERSISTENCE_SCHEMA_VERSION,
  validateLocalBackupMetadata,
  type LocalBackupMetadata,
} from './contracts';

type ChromeStorageArea = {
  get?: (keys: string[]) => Promise<Record<string, unknown>>;
  set?: (items: Record<string, unknown>) => Promise<void>;
};

type ChromeRuntime = {
  storage?: {
    local?: ChromeStorageArea;
  };
};

export type LocalBackupAvailability =
  | {
      availability: 'available';
      artifact: LocalBackupArtifact;
    }
  | {
      availability: 'missing';
      artifact: null;
      reason: null;
    }
  | {
      availability: 'invalid';
      artifact: null;
      reason: string;
    };

export type DraftLocalBackupArtifact = LocalBackupMetadata & {
  artifactType: 'draft-restore-backup';
  payload: DraftGraphSnapshot;
};

export type BrowserLocalBackupArtifact = LocalBackupMetadata & {
  artifactType: 'browser-restore-backup';
  payload: BrowserBookmarkTreeNode[];
};

export type LocalBackupArtifact = DraftLocalBackupArtifact | BrowserLocalBackupArtifact;

export type ReadLocalBackupArtifactsResult =
  | {
      kind: 'loaded';
      draft: LocalBackupAvailability;
      browser: LocalBackupAvailability;
    }
  | {
      kind: 'unavailable';
    }
  | {
      kind: 'error';
      error: string;
    };

export type WriteLocalBackupArtifactResult =
  | {
      kind: 'saved';
      artifact: LocalBackupArtifact;
    }
  | {
      kind: 'unavailable';
    }
  | {
      kind: 'error';
      error: string;
    };

type CreateDraftLocalBackupArtifactInput = {
  createdAt?: string;
  payload: DraftGraphSnapshot;
  sourceOrigin: 'browser-current-tree' | 'webdav-draft-version';
  sourceVersionId?: string | null;
  sourceVersionLabel?: string | null;
  triggerAction: string;
};

type CreateBrowserLocalBackupArtifactInput = {
  createdAt?: string;
  payload: BrowserBookmarkTreeNode[];
  sourceOrigin: 'draft-sync' | 'webdav-bookmark-version';
  sourceVersionId?: string | null;
  sourceVersionLabel?: string | null;
  triggerAction: string;
};

const LOCAL_BACKUP_STORAGE_KEYS = [
  LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup,
  LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup,
] as const;

function resolveStorageArea(storageArea?: ChromeStorageArea): ChromeStorageArea | null {
  return storageArea ?? (globalThis as typeof globalThis & { chrome?: ChromeRuntime }).chrome?.storage?.local ?? null;
}

function measurePayloadSize(payload: unknown): number {
  return JSON.stringify(payload).length;
}

function validateDraftLocalBackupArtifact(value: unknown): DraftLocalBackupArtifact | null {
  const metadataValidation = validateLocalBackupMetadata(value);
  if (!metadataValidation.ok || metadataValidation.value.artifactType !== 'draft-restore-backup') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const payloadValidation = validateDraftGraphSnapshot(candidate.payload);
  if (!payloadValidation.ok) {
    return null;
  }

  return {
    ...metadataValidation.value,
    artifactType: 'draft-restore-backup',
    payload: payloadValidation.value,
  };
}

function validateBrowserLocalBackupArtifact(value: unknown): BrowserLocalBackupArtifact | null {
  const metadataValidation = validateLocalBackupMetadata(value);
  if (!metadataValidation.ok || metadataValidation.value.artifactType !== 'browser-restore-backup') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const payloadValidation = validateBrowserBookmarkTree(candidate.payload);
  if (!payloadValidation.ok) {
    return null;
  }

  return {
    ...metadataValidation.value,
    artifactType: 'browser-restore-backup',
    payload: payloadValidation.value,
  };
}

function resolveDraftAvailability(value: unknown): LocalBackupAvailability {
  if (value === undefined) {
    return {
      availability: 'missing',
      artifact: null,
      reason: null,
    };
  }

  const artifact = validateDraftLocalBackupArtifact(value);
  if (!artifact) {
    return {
      availability: 'invalid',
      artifact: null,
      reason: 'Stored draft backup is invalid.',
    };
  }

  return {
    availability: 'available',
    artifact,
  };
}

function resolveBrowserAvailability(value: unknown): LocalBackupAvailability {
  if (value === undefined) {
    return {
      availability: 'missing',
      artifact: null,
      reason: null,
    };
  }

  const artifact = validateBrowserLocalBackupArtifact(value);
  if (!artifact) {
    return {
      availability: 'invalid',
      artifact: null,
      reason: 'Stored browser backup is invalid.',
    };
  }

  return {
    availability: 'available',
    artifact,
  };
}

export function createDraftLocalBackupArtifact(
  input: CreateDraftLocalBackupArtifactInput,
): DraftLocalBackupArtifact {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    artifactId: `draft-backup-${createdAt}`,
    artifactType: 'draft-restore-backup',
    schemaVersion: LOCAL_PERSISTENCE_SCHEMA_VERSION,
    createdAt,
    payloadFormat: 'draft-graph-snapshot',
    storageKey: LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup,
    sizeBytes: measurePayloadSize(input.payload),
    sourceObjectType: input.sourceOrigin === 'browser-current-tree' ? 'browser' : 'draft',
    targetObjectType: 'draft',
    triggerAction: input.triggerAction,
    sourceOrigin: input.sourceOrigin,
    sourceVersionId: input.sourceVersionId ?? null,
    sourceVersionLabel: input.sourceVersionLabel ?? null,
    payload: input.payload,
  };
}

export function createBrowserLocalBackupArtifact(
  input: CreateBrowserLocalBackupArtifactInput,
): BrowserLocalBackupArtifact {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    artifactId: `browser-backup-${createdAt}`,
    artifactType: 'browser-restore-backup',
    schemaVersion: LOCAL_PERSISTENCE_SCHEMA_VERSION,
    createdAt,
    payloadFormat: 'browser-bookmark-tree',
    storageKey: LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup,
    sizeBytes: measurePayloadSize(input.payload),
    sourceObjectType: input.sourceOrigin === 'draft-sync' ? 'draft' : 'browser',
    targetObjectType: 'browser',
    triggerAction: input.triggerAction,
    sourceOrigin: input.sourceOrigin,
    sourceVersionId: input.sourceVersionId ?? null,
    sourceVersionLabel: input.sourceVersionLabel ?? null,
    payload: input.payload,
  };
}

export async function readLocalBackupArtifacts(
  storageArea?: ChromeStorageArea,
): Promise<ReadLocalBackupArtifactsResult> {
  const runtimeStorageArea = resolveStorageArea(storageArea);
  if (!runtimeStorageArea?.get) {
    return {
      kind: 'unavailable',
    };
  }

  try {
    const persisted = await runtimeStorageArea.get([...LOCAL_BACKUP_STORAGE_KEYS]);

    return {
      kind: 'loaded',
      draft: resolveDraftAvailability(persisted[LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup]),
      browser: resolveBrowserAvailability(persisted[LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup]),
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'Failed to read local backup artifacts.',
    };
  }
}

export async function writeLocalBackupArtifact(
  artifact: LocalBackupArtifact,
  storageArea?: ChromeStorageArea,
): Promise<WriteLocalBackupArtifactResult> {
  const runtimeStorageArea = resolveStorageArea(storageArea);
  if (!runtimeStorageArea?.set) {
    return {
      kind: 'unavailable',
    };
  }

  const validation =
    artifact.artifactType === 'draft-restore-backup'
      ? validateDraftLocalBackupArtifact(artifact)
      : validateBrowserLocalBackupArtifact(artifact);

  if (!validation) {
    return {
      kind: 'error',
      error: 'Local backup artifact is invalid.',
    };
  }

  try {
    await runtimeStorageArea.set({
      [artifact.storageKey]: validation,
    });

    return {
      kind: 'saved',
      artifact: validation,
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'Failed to persist local backup artifact.',
    };
  }
}
