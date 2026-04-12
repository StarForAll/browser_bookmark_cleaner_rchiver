import { deriveWebdavOriginPattern } from '@/features/webdav/application/availability';

type ChromePermissionsApi = {
  contains: (permissions: { origins?: string[]; permissions?: string[] }) => Promise<boolean>;
  request: (permissions: { origins?: string[]; permissions?: string[] }) => Promise<boolean>;
};

type ChromeRuntime = {
  permissions?: ChromePermissionsApi;
};

export type EnsureWebdavHostPermissionResult =
  | {
      kind: 'granted';
      origin: string;
    }
  | {
      kind: 'denied';
      origin: string;
    }
  | {
      kind: 'invalid-origin';
      error: string;
    }
  | {
      kind: 'unavailable';
    }
  | {
      kind: 'error';
      error: string;
    };

export type InspectWebdavHostPermissionResult =
  | {
      kind: 'granted';
      origin: string;
    }
  | {
      kind: 'denied';
      origin: string;
    }
  | {
      kind: 'invalid-origin';
      error: string;
    }
  | {
      kind: 'unavailable';
    }
  | {
      kind: 'error';
      error: string;
    };

function resolvePermissionsApi(
  permissionsApi?: ChromePermissionsApi,
): ChromePermissionsApi | undefined {
  return permissionsApi ?? (globalThis as typeof globalThis & { chrome?: ChromeRuntime }).chrome?.permissions;
}

function resolveWebdavOrigin(
  endpointUrl: string,
): { ok: true; origin: string } | { ok: false; error: string } {
  const origin = deriveWebdavOriginPattern(endpointUrl);
  if (!origin) {
    return {
      ok: false,
      error: 'WebDAV URL 无效，无法申请 host 权限。',
    };
  }

  return {
    ok: true,
    origin,
  };
}

export async function inspectWebdavHostPermission(
  endpointUrl: string,
  permissionsApi?: ChromePermissionsApi,
): Promise<InspectWebdavHostPermissionResult> {
  const runtimePermissionsApi = resolvePermissionsApi(permissionsApi);

  if (!runtimePermissionsApi?.contains) {
    return {
      kind: 'unavailable',
    };
  }

  const originResult = resolveWebdavOrigin(endpointUrl);
  if (!originResult.ok) {
    return {
      kind: 'invalid-origin',
      error: originResult.error,
    };
  }

  try {
    const granted = await runtimePermissionsApi.contains({
      origins: [originResult.origin],
    });
    return granted
      ? {
          kind: 'granted',
          origin: originResult.origin,
        }
      : {
          kind: 'denied',
          origin: originResult.origin,
        };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'Failed to inspect WebDAV host permission.',
    };
  }
}

export async function ensureWebdavHostPermission(
  endpointUrl: string,
  permissionsApi?: ChromePermissionsApi,
): Promise<EnsureWebdavHostPermissionResult> {
  const runtimePermissionsApi = resolvePermissionsApi(permissionsApi);

  if (!runtimePermissionsApi?.contains || !runtimePermissionsApi?.request) {
    return {
      kind: 'unavailable',
    };
  }

  const originResult = resolveWebdavOrigin(endpointUrl);
  if (!originResult.ok) {
    return {
      kind: 'invalid-origin',
      error: originResult.error,
    };
  }
  const origin = originResult.origin;

  try {
    const alreadyGranted = await runtimePermissionsApi.contains({
      origins: [origin],
    });
    if (alreadyGranted) {
      return {
        kind: 'granted',
        origin,
      };
    }
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'Failed to inspect WebDAV host permission.',
    };
  }

  try {
    const granted = await runtimePermissionsApi.request({
      origins: [origin],
    });
    return granted
      ? {
          kind: 'granted',
          origin,
        }
      : {
          kind: 'denied',
          origin,
        };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'Failed to request WebDAV host permission.',
    };
  }
}
