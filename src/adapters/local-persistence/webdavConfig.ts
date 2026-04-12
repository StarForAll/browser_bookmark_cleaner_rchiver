import {
  LOCAL_PERSISTENCE_KEYS,
  validateWebdavPermissionState,
  validateWebdavProfile,
  type WebdavPermissionState,
  type WebdavProfile,
} from './contracts';

type ReadChromeStorageArea = {
  get: (keys: string[]) => Promise<Record<string, unknown>>;
};

type WriteChromeStorageArea = {
  set: (items: Record<string, unknown>) => Promise<void>;
};

type ChromeRuntime = {
  storage?: {
    local?: ReadChromeStorageArea & WriteChromeStorageArea;
  };
};

export type PersistedWebdavConfigState = {
  profile: WebdavProfile | null;
  permissionState: WebdavPermissionState | null;
};

export type ReadPersistedWebdavConfigResult =
  | {
      kind: 'restored';
      state: PersistedWebdavConfigState;
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

export type WritePersistedWebdavConfigResult =
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

const WEBDAV_CONFIG_STORAGE_KEYS = [
  LOCAL_PERSISTENCE_KEYS.sensitive.webdavProfile,
  LOCAL_PERSISTENCE_KEYS.sensitive.webdavPermissionState,
] as const;

export async function readPersistedWebdavConfig(
  storageArea?: ReadChromeStorageArea,
): Promise<ReadPersistedWebdavConfigResult> {
  const runtimeStorageArea =
    storageArea ?? (globalThis as typeof globalThis & { chrome?: ChromeRuntime }).chrome?.storage?.local;

  if (!runtimeStorageArea?.get) {
    return {
      kind: 'unavailable',
    };
  }

  try {
    const persisted = await runtimeStorageArea.get([...WEBDAV_CONFIG_STORAGE_KEYS]);
    const profileValue = persisted[LOCAL_PERSISTENCE_KEYS.sensitive.webdavProfile];
    const permissionValue = persisted[LOCAL_PERSISTENCE_KEYS.sensitive.webdavPermissionState];

    if (profileValue === undefined && permissionValue === undefined) {
      return {
        kind: 'empty',
      };
    }

    let profile: WebdavProfile | null = null;
    let permissionState: WebdavPermissionState | null = null;

    if (profileValue !== undefined && profileValue !== null) {
      const profileValidation = validateWebdavProfile(profileValue);
      if (!profileValidation.ok) {
        return {
          kind: 'error',
          error: profileValidation.error,
        };
      }
      profile = profileValidation.value;
    }

    if (permissionValue !== undefined && permissionValue !== null) {
      const permissionValidation = validateWebdavPermissionState(permissionValue);
      if (!permissionValidation.ok) {
        return {
          kind: 'error',
          error: permissionValidation.error,
        };
      }
      permissionState = permissionValidation.value;
    }

    return {
      kind: 'restored',
      state: {
        profile,
        permissionState,
      },
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'Failed to read persisted WebDAV config.',
    };
  }
}

export async function writePersistedWebdavConfig(
  state: PersistedWebdavConfigState,
  storageArea?: WriteChromeStorageArea,
): Promise<WritePersistedWebdavConfigResult> {
  const runtimeStorageArea =
    storageArea ?? (globalThis as typeof globalThis & { chrome?: ChromeRuntime }).chrome?.storage?.local;

  if (!runtimeStorageArea?.set) {
    return {
      kind: 'unavailable',
    };
  }

  if (state.profile !== null) {
    const profileValidation = validateWebdavProfile(state.profile);
    if (!profileValidation.ok) {
      return {
        kind: 'error',
        error: profileValidation.error,
      };
    }
  }

  if (state.permissionState !== null) {
    if (state.profile === null) {
      return {
        kind: 'error',
        error: 'WebDAV permission state cannot exist without a persisted profile.',
      };
    }

    const permissionValidation = validateWebdavPermissionState(state.permissionState);
    if (!permissionValidation.ok) {
      return {
        kind: 'error',
        error: permissionValidation.error,
      };
    }
  }

  try {
    await runtimeStorageArea.set({
      [LOCAL_PERSISTENCE_KEYS.sensitive.webdavProfile]: state.profile,
      [LOCAL_PERSISTENCE_KEYS.sensitive.webdavPermissionState]: state.permissionState,
    });

    return {
      kind: 'saved',
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'Failed to persist WebDAV config.',
    };
  }
}
