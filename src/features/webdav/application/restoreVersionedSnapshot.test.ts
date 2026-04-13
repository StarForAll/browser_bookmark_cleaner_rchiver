import { describe, expect, test, vi } from 'vitest';
import type { BrowserBookmarkTreeNode } from '@/adapters/browser-bookmarks/contracts';
import type { WebdavProfile } from '@/adapters/local-persistence/contracts';
import type { ReadWebdavJsonDocumentResult } from '@/adapters/webdav/jsonDocument';
import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import type { RestoreVersionedSnapshotInput } from './restoreVersionedSnapshot';

const WEBDAV_DATA_ROOT = '/bookmark-extension-data';

type StoredVersionDescriptor = {
  artifactType: 'draft-snapshot';
  createdAt: string;
  snapshotLabel: string | null;
  source: 'draft';
  versionId: string;
};

type StoredBrowserVersionDescriptor = {
  artifactType: 'bookmark-snapshot';
  createdAt: string;
  snapshotLabel: string | null;
  source: 'browser';
  versionId: string;
};

function createWebdavProfile(): WebdavProfile {
  return {
    endpointUrl: 'https://dav.example.com/collection/',
    username: 'alice',
    password: 'secret-pass',
    lastTestedAt: '2026-04-12T11:00:00.000Z',
    lastTestStatus: 'success',
  };
}

function createRestoredDraftSnapshot(): DraftGraphSnapshot {
  return {
    schemaVersion: 'draft-graph/v1',
    snapshotVersion: 1,
    selectedNodeId: null,
    nodesById: {
      'folder-restored': {
        internalId: 'folder-restored',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '恢复后的目录',
        url: null,
        parentId: null,
        childIds: ['bookmark-restored'],
        pathTokens: ['恢复后的目录'],
      },
      'bookmark-restored': {
        internalId: 'bookmark-restored',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: 'Recovered Docs',
        url: 'https://recovered.example.com',
        parentId: 'folder-restored',
        childIds: [],
        pathTokens: ['恢复后的目录', 'Recovered Docs'],
      },
    },
    rootIds: ['folder-restored'],
  };
}

function createVersionIndex(versions: StoredVersionDescriptor[]) {
  return {
    schemaVersion: 'webdav-index/v1',
    versions,
  };
}

function createBrowserVersionIndex(
  versions: StoredBrowserVersionDescriptor[],
) {
  return {
    schemaVersion: 'webdav-index/v1',
    versions,
  };
}

function createDraftEnvelope(
  version: StoredVersionDescriptor,
  payload: DraftGraphSnapshot,
) {
  return {
    schemaVersion: 'webdav-snapshot/v1',
    artifactType: 'draft-snapshot' as const,
    createdAt: version.createdAt,
    versionId: version.versionId,
    source: 'draft' as const,
    originAction: 'upload-draft-to-webdav' as const,
    snapshotLabel: version.snapshotLabel,
    payloadFormat: 'draft-graph-snapshot' as const,
    payload,
  };
}

function createRestoredBrowserTree(): BrowserBookmarkTreeNode[] {
  return [
    {
      id: '0',
      parentId: null,
      title: '',
      children: [
        {
          id: '1',
          parentId: '0',
          title: 'Bookmarks Bar',
          children: [
            {
              id: '11',
              parentId: '1',
              title: 'Recovered Docs',
              url: 'https://recovered.example.com',
            },
          ],
        },
      ],
    },
  ];
}

function createBrowserEnvelope(
  version: StoredBrowserVersionDescriptor,
  payload: BrowserBookmarkTreeNode[],
) {
  return {
    schemaVersion: 'webdav-snapshot/v1',
    artifactType: 'bookmark-snapshot' as const,
    createdAt: version.createdAt,
    versionId: version.versionId,
    source: 'browser' as const,
    originAction: 'upload-browser-to-webdav' as const,
    snapshotLabel: version.snapshotLabel,
    payloadFormat: 'browser-bookmark-tree' as const,
    payload,
  };
}

async function callRestoreVersionedSnapshot(
  input: RestoreVersionedSnapshotInput,
  dependencies: {
    readJson: (path: string, profile: WebdavProfile) => Promise<ReadWebdavJsonDocumentResult>;
  },
) {
  const restoreModule = await import('./restoreVersionedSnapshot');
  const restoreVersionedSnapshot = Reflect.get(restoreModule, 'restoreVersionedSnapshot');

  if (typeof restoreVersionedSnapshot !== 'function') {
    throw new Error('restoreVersionedSnapshot export is unavailable.');
  }

  return restoreVersionedSnapshot(input, dependencies);
}

describe('T12A WebDAV draft restore orchestration', () => {
  test('loads the selected draft version from the draft category and returns the validated draft snapshot plus descriptor', async () => {
    const restoreModule = await import('./restoreVersionedSnapshot');
    const profile = createWebdavProfile();
    const version: StoredVersionDescriptor = {
      artifactType: 'draft-snapshot',
      createdAt: '2026-04-12T12:00:00.000Z',
      snapshotLabel: '午间备份',
      source: 'draft',
      versionId: '2026-04-12T12-00-00.000Z',
    };
    const restoredSnapshot = createRestoredDraftSnapshot();
    const readJson = vi.fn(async (...args: [string, WebdavProfile]) => {
      const [path] = args;

      if (path === `${WEBDAV_DATA_ROOT}/drafts/index.json`) {
        return {
          kind: 'loaded',
          value: createVersionIndex([version]),
        } satisfies ReadWebdavJsonDocumentResult;
      }

      if (path === `${WEBDAV_DATA_ROOT}/drafts/versions/${version.versionId}.json`) {
        return {
          kind: 'loaded',
          value: createDraftEnvelope(version, restoredSnapshot),
        } satisfies ReadWebdavJsonDocumentResult;
      }

      return {
        kind: 'missing',
      } satisfies ReadWebdavJsonDocumentResult;
    });

    const result = await restoreModule.restoreVersionedSnapshot(
      {
        kind: 'draft',
        profile,
        versionId: version.versionId,
      },
      {
        readJson,
      },
    );

    expect(readJson.mock.calls.map(([path]) => path)).toEqual([
      `${WEBDAV_DATA_ROOT}/drafts/index.json`,
      `${WEBDAV_DATA_ROOT}/drafts/versions/${version.versionId}.json`,
    ]);
    expect(result).toMatchObject({
      kind: 'success',
      snapshot: restoredSnapshot,
      version,
    });
  });

  test('returns an error when the selected remote envelope is not a draft snapshot', async () => {
    const restoreModule = await import('./restoreVersionedSnapshot');
    const profile = createWebdavProfile();
    const version: StoredVersionDescriptor = {
      artifactType: 'draft-snapshot',
      createdAt: '2026-04-12T12:00:00.000Z',
      snapshotLabel: '午间备份',
      source: 'draft',
      versionId: '2026-04-12T12-00-00.000Z',
    };
    const readJson = vi.fn(async (...args: [string, WebdavProfile]) => {
      const [path] = args;

      if (path === `${WEBDAV_DATA_ROOT}/drafts/index.json`) {
        return {
          kind: 'loaded',
          value: createVersionIndex([version]),
        } satisfies ReadWebdavJsonDocumentResult;
      }

      if (path === `${WEBDAV_DATA_ROOT}/drafts/versions/${version.versionId}.json`) {
        return {
          kind: 'loaded',
          value: {
            ...createDraftEnvelope(version, createRestoredDraftSnapshot()),
            artifactType: 'bookmark-snapshot',
            payloadFormat: 'browser-bookmark-tree',
            source: 'browser',
            payload: [],
          },
        } satisfies ReadWebdavJsonDocumentResult;
      }

      return {
        kind: 'missing',
      } satisfies ReadWebdavJsonDocumentResult;
    });

    const result = await restoreModule.restoreVersionedSnapshot(
      {
        kind: 'draft',
        profile,
        versionId: version.versionId,
      },
      {
        readJson,
      },
    );

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') {
      throw new Error('Expected restoreVersionedSnapshot to return an error result.');
    }
    expect(result.error).toMatch(/draft|artifactType|source|payload/i);
  });

  test('returns an error when the selected version file is missing on remote', async () => {
    const restoreModule = await import('./restoreVersionedSnapshot');
    const profile = createWebdavProfile();
    const version: StoredVersionDescriptor = {
      artifactType: 'draft-snapshot',
      createdAt: '2026-04-12T12:00:00.000Z',
      snapshotLabel: '午间备份',
      source: 'draft',
      versionId: '2026-04-12T12-00-00.000Z',
    };
    const readJson = vi.fn(async (...args: [string, WebdavProfile]) => {
      const [path] = args;

      if (path === `${WEBDAV_DATA_ROOT}/drafts/index.json`) {
        return {
          kind: 'loaded',
          value: createVersionIndex([version]),
        } satisfies ReadWebdavJsonDocumentResult;
      }

      return {
        kind: 'missing',
      } satisfies ReadWebdavJsonDocumentResult;
    });

    const result = await restoreModule.restoreVersionedSnapshot(
      {
        kind: 'draft',
        profile,
        versionId: version.versionId,
      },
      {
        readJson,
      },
    );

    expect(result).toEqual({
      error: `WebDAV draft version ${version.versionId} is missing.`,
      kind: 'error',
    });
  });

  test('returns an error when reading the selected version file fails', async () => {
    const restoreModule = await import('./restoreVersionedSnapshot');
    const profile = createWebdavProfile();
    const version: StoredVersionDescriptor = {
      artifactType: 'draft-snapshot',
      createdAt: '2026-04-12T12:00:00.000Z',
      snapshotLabel: '午间备份',
      source: 'draft',
      versionId: '2026-04-12T12-00-00.000Z',
    };
    const readJson = vi.fn(async (...args: [string, WebdavProfile]) => {
      const [path] = args;

      if (path === `${WEBDAV_DATA_ROOT}/drafts/index.json`) {
        return {
          kind: 'loaded',
          value: createVersionIndex([version]),
        } satisfies ReadWebdavJsonDocumentResult;
      }

      return {
        error: 'Network unreachable',
        kind: 'error',
      } satisfies ReadWebdavJsonDocumentResult;
    });

    const result = await restoreModule.restoreVersionedSnapshot(
      {
        kind: 'draft',
        profile,
        versionId: version.versionId,
      },
      {
        readJson,
      },
    );

    expect(result).toEqual({
      error: 'Network unreachable',
      kind: 'error',
    });
  });
});

describe('T12B WebDAV browser restore orchestration', () => {
  test('loads the selected bookmark version from the bookmark category and returns the validated browser tree plus descriptor', async () => {
    const profile = createWebdavProfile();
    const version: StoredBrowserVersionDescriptor = {
      artifactType: 'bookmark-snapshot',
      createdAt: '2026-04-12T12:00:00.000Z',
      snapshotLabel: '午间书签备份',
      source: 'browser',
      versionId: '2026-04-12T12-00-00.000Z',
    };
    const restoredTree = createRestoredBrowserTree();
    const readJson = vi.fn(async (...args: [string, WebdavProfile]) => {
      const [path] = args;

      if (path === `${WEBDAV_DATA_ROOT}/bookmarks/index.json`) {
        return {
          kind: 'loaded',
          value: createBrowserVersionIndex([version]),
        } satisfies ReadWebdavJsonDocumentResult;
      }

      if (path === `${WEBDAV_DATA_ROOT}/bookmarks/versions/${version.versionId}.json`) {
        return {
          kind: 'loaded',
          value: createBrowserEnvelope(version, restoredTree),
        } satisfies ReadWebdavJsonDocumentResult;
      }

      return {
        kind: 'missing',
      } satisfies ReadWebdavJsonDocumentResult;
    });

    const result = await callRestoreVersionedSnapshot(
      {
        kind: 'browser',
        profile,
        versionId: version.versionId,
      },
      {
        readJson,
      },
    );

    expect(readJson.mock.calls.map(([path]) => path)).toEqual([
      `${WEBDAV_DATA_ROOT}/bookmarks/index.json`,
      `${WEBDAV_DATA_ROOT}/bookmarks/versions/${version.versionId}.json`,
    ]);
    expect(result).toMatchObject({
      kind: 'success',
      tree: restoredTree,
      version,
    });
  });

  test('returns an error when the selected remote envelope is not a bookmark snapshot', async () => {
    const profile = createWebdavProfile();
    const version: StoredBrowserVersionDescriptor = {
      artifactType: 'bookmark-snapshot',
      createdAt: '2026-04-12T12:00:00.000Z',
      snapshotLabel: '午间书签备份',
      source: 'browser',
      versionId: '2026-04-12T12-00-00.000Z',
    };
    const readJson = vi.fn(async (...args: [string, WebdavProfile]) => {
      const [path] = args;

      if (path === `${WEBDAV_DATA_ROOT}/bookmarks/index.json`) {
        return {
          kind: 'loaded',
          value: createBrowserVersionIndex([version]),
        } satisfies ReadWebdavJsonDocumentResult;
      }

      if (path === `${WEBDAV_DATA_ROOT}/bookmarks/versions/${version.versionId}.json`) {
        return {
          kind: 'loaded',
          value: {
            ...createBrowserEnvelope(version, createRestoredBrowserTree()),
            artifactType: 'draft-snapshot',
            payloadFormat: 'draft-graph-snapshot',
            source: 'draft',
            payload: createRestoredDraftSnapshot(),
          },
        } satisfies ReadWebdavJsonDocumentResult;
      }

      return {
        kind: 'missing',
      } satisfies ReadWebdavJsonDocumentResult;
    });

    const result = await callRestoreVersionedSnapshot(
      {
        kind: 'browser',
        profile,
        versionId: version.versionId,
      },
      {
        readJson,
      },
    );

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') {
      throw new Error('Expected restoreVersionedSnapshot to return an error result.');
    }
    expect(result.error).toMatch(/bookmark|browser|artifactType|source|payload/i);
  });
});
