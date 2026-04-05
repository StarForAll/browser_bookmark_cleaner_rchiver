import {
  LOCAL_PERSISTENCE_KEYS,
  validatePersistedDraftSession,
  type PersistedDraftSession,
} from './contracts';

type ChromeStorageArea = {
  set: (items: Record<string, unknown>) => Promise<void>;
};

type ChromeRuntime = {
  storage?: {
    local?: ChromeStorageArea;
  };
};

export type WritePersistedDraftSessionResult =
  | {
      kind: 'saved';
    }
  | {
      kind: 'unavailable';
    }
  | {
      kind: 'error';
      error: string;
    };

export async function writePersistedDraftSession(
  session: PersistedDraftSession,
  storageArea?: ChromeStorageArea,
): Promise<WritePersistedDraftSessionResult> {
  const validation = validatePersistedDraftSession(session);
  if (!validation.ok) {
    return {
      kind: 'error',
      error: validation.error,
    };
  }

  const runtimeStorageArea =
    storageArea ?? (globalThis as typeof globalThis & { chrome?: ChromeRuntime }).chrome?.storage?.local;

  if (!runtimeStorageArea?.set) {
    return {
      kind: 'unavailable',
    };
  }

  try {
    await runtimeStorageArea.set({
      [LOCAL_PERSISTENCE_KEYS.workspace.draftSnapshot]: validation.value.draftSnapshot,
      [LOCAL_PERSISTENCE_KEYS.workspace.expandedStateById]: validation.value.expandedStateById,
      [LOCAL_PERSISTENCE_KEYS.workspace.nodePositionsById]: validation.value.nodePositionsById,
      [LOCAL_PERSISTENCE_KEYS.assets.undoHistory]: validation.value.undoHistory,
      [LOCAL_PERSISTENCE_KEYS.assets.draftCheckpoints]: validation.value.checkpoints,
    });

    return {
      kind: 'saved',
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'Failed to persist the draft session.',
    };
  }
}
