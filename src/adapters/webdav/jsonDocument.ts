import {
  validateWebdavProfile,
  type WebdavProfile,
} from '@/adapters/local-persistence/contracts';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type ReadWebdavJsonDocumentResult =
  | {
      kind: 'loaded';
      value: unknown;
    }
  | {
      kind: 'missing';
    }
  | {
      kind: 'error';
      error: string;
    };

export type WriteWebdavJsonDocumentResult =
  | {
      kind: 'saved';
    }
  | {
      kind: 'error';
      error: string;
    };

export type DeleteWebdavFileResult =
  | {
      kind: 'deleted';
    }
  | {
      kind: 'error';
      error: string;
    };

function encodeBasicAuth(value: string): string {
  if (typeof btoa === 'function') {
    return btoa(value);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64');
  }

  throw new Error('Base64 encoding is unavailable in this runtime.');
}

function resolveFetch(fetchImpl?: FetchLike): FetchLike | null {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch === 'function') {
    return fetch.bind(globalThis) as FetchLike;
  }

  return null;
}

function buildWebdavUrl(logicalPath: string, endpointUrl: string): string {
  const normalizedPath = logicalPath.replace(/^\/+/, '');
  const normalizedEndpointUrl = endpointUrl.endsWith('/') ? endpointUrl : `${endpointUrl}/`;
  return new URL(normalizedPath, normalizedEndpointUrl).toString();
}

function buildAuthorizedHeaders(profile: WebdavProfile): HeadersInit {
  return {
    Authorization: `Basic ${encodeBasicAuth(`${profile.username}:${profile.password}`)}`,
  };
}

function deriveParentCollectionPaths(logicalPath: string): string[] {
  const normalizedPath = logicalPath.replace(/^\/+/, '');
  const segments = normalizedPath.split('/').filter((segment) => segment.length > 0);
  if (segments.length <= 1) {
    return [];
  }

  const parentSegments = segments.slice(0, -1);
  const collectionPaths: string[] = [];
  for (let index = 0; index < parentSegments.length; index += 1) {
    collectionPaths.push(`/${parentSegments.slice(0, index + 1).join('/')}/`);
  }

  return collectionPaths;
}

function normalizeCollectionCreatePath(logicalCollectionPath: string): string {
  if (logicalCollectionPath === '/') {
    return logicalCollectionPath;
  }

  return logicalCollectionPath.replace(/\/+$/, '');
}

type ProbeWebdavCollectionResult =
  | {
      kind: 'exists';
    }
  | {
      kind: 'missing';
    }
  | {
      kind: 'error';
      error: string;
    };

async function probeWebdavCollection(
  logicalCollectionPath: string,
  profile: WebdavProfile,
  fetchImpl: FetchLike,
): Promise<ProbeWebdavCollectionResult> {
  try {
    const response = await fetchImpl(
      buildWebdavUrl(normalizeCollectionCreatePath(logicalCollectionPath), profile.endpointUrl),
      {
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          ...buildAuthorizedHeaders(profile),
          Depth: '0',
        },
        method: 'PROPFIND',
        redirect: 'manual',
      },
    );

    if (response.ok || response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
      return {
        kind: 'exists',
      };
    }

    if (response.status === 404 || response.status === 409) {
      return {
        kind: 'missing',
      };
    }

    return {
      kind: 'error',
      error: `WebDAV collection probe failed with HTTP ${response.status} for ${logicalCollectionPath}.`,
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'WebDAV collection probe failed.',
    };
  }
}

async function ensureWebdavCollection(
  logicalCollectionPath: string,
  profile: WebdavProfile,
  fetchImpl: FetchLike,
): Promise<WriteWebdavJsonDocumentResult> {
  try {
    const probeResult = await probeWebdavCollection(logicalCollectionPath, profile, fetchImpl);
    if (probeResult.kind === 'exists') {
      return {
        kind: 'saved',
      };
    }

    if (probeResult.kind === 'error') {
      return {
        kind: 'error',
        error: probeResult.error,
      };
    }

    const response = await fetchImpl(
      buildWebdavUrl(normalizeCollectionCreatePath(logicalCollectionPath), profile.endpointUrl),
      {
        cache: 'no-store',
        credentials: 'omit',
        headers: buildAuthorizedHeaders(profile),
        method: 'MKCOL',
        redirect: 'manual',
      },
    );

    if (response.ok || response.status === 405) {
      return {
        kind: 'saved',
      };
    }

    if (response.status === 400 || response.status === 409) {
      const recheckResult = await probeWebdavCollection(logicalCollectionPath, profile, fetchImpl);
      if (recheckResult.kind === 'exists') {
        return {
          kind: 'saved',
        };
      }

      if (recheckResult.kind === 'error') {
        return {
          kind: 'error',
          error: recheckResult.error,
        };
      }
    }

    return {
      kind: 'error',
      error: `WebDAV collection create failed with HTTP ${response.status} for ${logicalCollectionPath}.`,
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'WebDAV collection create failed.',
    };
  }
}

async function ensureWebdavParentCollections(
  logicalPath: string,
  profile: WebdavProfile,
  fetchImpl: FetchLike,
): Promise<WriteWebdavJsonDocumentResult> {
  for (const collectionPath of deriveParentCollectionPaths(logicalPath)) {
    const result = await ensureWebdavCollection(collectionPath, profile, fetchImpl);
    if (result.kind !== 'saved') {
      return result;
    }
  }

  return {
    kind: 'saved',
  };
}

export async function readWebdavJsonDocument(
  logicalPath: string,
  profile: WebdavProfile,
  fetchImpl?: FetchLike,
): Promise<ReadWebdavJsonDocumentResult> {
  const validation = validateWebdavProfile(profile);
  if (!validation.ok) {
    return {
      kind: 'error',
      error: validation.error,
    };
  }

  const runtimeFetch = resolveFetch(fetchImpl);
  if (!runtimeFetch) {
    return {
      kind: 'error',
      error: 'WebDAV transport is unavailable.',
    };
  }

  try {
    const response = await runtimeFetch(buildWebdavUrl(logicalPath, validation.value.endpointUrl), {
      cache: 'no-store',
      credentials: 'omit',
      headers: buildAuthorizedHeaders(validation.value),
      method: 'GET',
      redirect: 'manual',
    });

    if (response.status === 404 || response.status === 409) {
      return {
        kind: 'missing',
      };
    }

    if (!response.ok) {
      return {
        kind: 'error',
        error: `WebDAV JSON read failed with HTTP ${response.status}.`,
      };
    }

    const rawText = await response.text();
    if (rawText.trim().length === 0) {
      return {
        kind: 'error',
        error: `WebDAV JSON document ${logicalPath} is empty.`,
      };
    }

    try {
      return {
        kind: 'loaded',
        value: JSON.parse(rawText) as unknown,
      };
    } catch {
      return {
        kind: 'error',
        error: `WebDAV JSON document ${logicalPath} is invalid.`,
      };
    }
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'WebDAV JSON read failed.',
    };
  }
}

export async function writeWebdavJsonDocument(
  logicalPath: string,
  value: unknown,
  profile: WebdavProfile,
  fetchImpl?: FetchLike,
): Promise<WriteWebdavJsonDocumentResult> {
  const validation = validateWebdavProfile(profile);
  if (!validation.ok) {
    return {
      kind: 'error',
      error: validation.error,
    };
  }

  const runtimeFetch = resolveFetch(fetchImpl);
  if (!runtimeFetch) {
    return {
      kind: 'error',
      error: 'WebDAV transport is unavailable.',
    };
  }

  try {
    const ensureCollectionsResult = await ensureWebdavParentCollections(logicalPath, validation.value, runtimeFetch);
    if (ensureCollectionsResult.kind !== 'saved') {
      return ensureCollectionsResult;
    }

    const response = await runtimeFetch(buildWebdavUrl(logicalPath, validation.value.endpointUrl), {
      body: JSON.stringify(value),
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        ...buildAuthorizedHeaders(validation.value),
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      redirect: 'manual',
    });

    if (!response.ok) {
      return {
        kind: 'error',
        error: `WebDAV JSON write failed with HTTP ${response.status}.`,
      };
    }

    return {
      kind: 'saved',
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'WebDAV JSON write failed.',
    };
  }
}

export async function deleteWebdavFile(
  logicalPath: string,
  profile: WebdavProfile,
  fetchImpl?: FetchLike,
): Promise<DeleteWebdavFileResult> {
  const validation = validateWebdavProfile(profile);
  if (!validation.ok) {
    return {
      kind: 'error',
      error: validation.error,
    };
  }

  const runtimeFetch = resolveFetch(fetchImpl);
  if (!runtimeFetch) {
    return {
      kind: 'error',
      error: 'WebDAV transport is unavailable.',
    };
  }

  try {
    const response = await runtimeFetch(buildWebdavUrl(logicalPath, validation.value.endpointUrl), {
      cache: 'no-store',
      credentials: 'omit',
      headers: buildAuthorizedHeaders(validation.value),
      method: 'DELETE',
      redirect: 'manual',
    });

    if (response.status === 404 || response.ok) {
      return {
        kind: 'deleted',
      };
    }

    return {
      kind: 'error',
      error: `WebDAV delete failed with HTTP ${response.status}.`,
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'WebDAV delete failed.',
    };
  }
}
