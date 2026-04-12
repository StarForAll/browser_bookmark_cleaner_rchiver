import {
  validateWebdavProfile,
  type WebdavProfile,
} from '@/adapters/local-persistence/contracts';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type TestWebdavAvailabilityResult =
  | {
      kind: 'success';
    }
  | {
      kind: 'unavailable';
    }
  | {
      kind: 'error';
      error: string;
    };

function encodeBasicAuth(value: string): string {
  if (typeof btoa === 'function') {
    return btoa(value);
  }

  throw new Error('Base64 encoding is unavailable in this runtime.');
}

export async function testWebdavAvailability(
  profile: WebdavProfile,
  fetchImpl?: FetchLike,
): Promise<TestWebdavAvailabilityResult> {
  // Callers must ensure the matching WebDAV host permission is already granted
  // before this transport probe runs.
  const validation = validateWebdavProfile(profile);
  if (!validation.ok) {
    return {
      kind: 'error',
      error: validation.error,
    };
  }

  const runtimeFetch =
    fetchImpl ?? ((typeof fetch === 'function' ? fetch.bind(globalThis) : undefined) as FetchLike | undefined);

  if (!runtimeFetch) {
    return {
      kind: 'unavailable',
    };
  }

  try {
    const response = await runtimeFetch(validation.value.endpointUrl, {
      method: 'OPTIONS',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'manual',
      headers: {
        Authorization: `Basic ${encodeBasicAuth(
          `${validation.value.username}:${validation.value.password}`,
        )}`,
      },
    });

    if (!response.ok) {
      return {
        kind: 'error',
        error: `WebDAV availability check failed with HTTP ${response.status}.`,
      };
    }

    return {
      kind: 'success',
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'WebDAV availability check failed.',
    };
  }
}
