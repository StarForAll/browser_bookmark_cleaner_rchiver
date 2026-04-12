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

export async function ensureWebdavHostPermission(
  endpointUrl: string,
  permissionsApi?: ChromePermissionsApi,
): Promise<EnsureWebdavHostPermissionResult> {
  const runtimePermissionsApi =
    permissionsApi ?? (globalThis as typeof globalThis & { chrome?: ChromeRuntime }).chrome?.permissions;

  if (!runtimePermissionsApi?.contains || !runtimePermissionsApi?.request) {
    return {
      kind: 'unavailable',
    };
  }

  const origin = deriveWebdavOriginPattern(endpointUrl);
  if (!origin) {
    return {
      kind: 'invalid-origin',
      error: 'WebDAV URL 无效，无法申请 host 权限。',
    };
  }

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
