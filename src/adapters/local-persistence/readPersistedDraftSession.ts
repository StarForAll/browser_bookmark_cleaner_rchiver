import {
  LOCAL_PERSISTENCE_KEYS,
  LOCAL_PERSISTENCE_SCHEMA_VERSION,
  validatePersistedDraftSession,
  type PersistedDraftSession,
} from './contracts';

type ChromeStorageArea = {
  get: (keys: string[]) => Promise<Record<string, unknown>>;
};

type ChromeRuntime = {
  storage?: {
    local?: ChromeStorageArea;
  };
};

export type ReadPersistedDraftSessionResult =
  | {
      kind: 'restored';
      session: PersistedDraftSession;
    }
  | {
      kind: 'empty';
    }
  | {
      kind: 'unavailable';
    }
  | {
      kind: 'error';
      error: string;
    };

const SESSION_STORAGE_KEYS = [
  LOCAL_PERSISTENCE_KEYS.workspace.draftSnapshot,
  LOCAL_PERSISTENCE_KEYS.workspace.expandedStateById,
  LOCAL_PERSISTENCE_KEYS.workspace.nodePositionsById,
  LOCAL_PERSISTENCE_KEYS.assets.undoHistory,
  LOCAL_PERSISTENCE_KEYS.assets.draftCheckpoints,
] as const;

export async function readPersistedDraftSession(
  storageArea?: ChromeStorageArea,
): Promise<ReadPersistedDraftSessionResult> {
  const runtimeStorageArea =
    storageArea ?? (globalThis as typeof globalThis & { chrome?: ChromeRuntime }).chrome?.storage?.local;

  if (!runtimeStorageArea?.get) {
    return {
      kind: 'unavailable',
    };
  }

  try {
    const persisted = await runtimeStorageArea.get([...SESSION_STORAGE_KEYS]);
    const draftSnapshot = persisted[LOCAL_PERSISTENCE_KEYS.workspace.draftSnapshot];

    if (draftSnapshot === undefined) {
      return {
        kind: 'empty',
      };
    }

    const validation = validatePersistedDraftSession({
      schemaVersion: LOCAL_PERSISTENCE_SCHEMA_VERSION,
      draftSnapshot,
      expandedStateById:
        persisted[LOCAL_PERSISTENCE_KEYS.workspace.expandedStateById] ?? {},
      nodePositionsById:
        persisted[LOCAL_PERSISTENCE_KEYS.workspace.nodePositionsById] ?? {},
      undoHistory: persisted[LOCAL_PERSISTENCE_KEYS.assets.undoHistory] ?? [],
      checkpoints: persisted[LOCAL_PERSISTENCE_KEYS.assets.draftCheckpoints] ?? [],
    });

    if (!validation.ok) {
      return {
        kind: 'error',
        error: validation.error,
      };
    }

    return {
      kind: 'restored',
      session: validation.value,
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'Failed to read persisted draft session.',
    };
  }
}
