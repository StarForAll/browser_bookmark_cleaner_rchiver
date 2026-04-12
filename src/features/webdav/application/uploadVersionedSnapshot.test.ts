import { describe, expect, test, vi } from 'vitest';
import type { BrowserBookmarkTreeNode } from '@/adapters/browser-bookmarks/contracts';
import { exportDraftToBrowserTree } from '@/adapters/browser-bookmarks/exportDraftToBrowserTree';
import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import type { WebdavProfile } from '@/adapters/local-persistence/contracts';
import { createDraftGraphFixture } from '../../../../test/fixtures/draftGraph';

type SnapshotArtifactType = 'bookmark-snapshot' | 'draft-snapshot';
type SnapshotSource = 'browser' | 'draft';

type StoredVersionDescriptor = {
  artifactType: SnapshotArtifactType;
  createdAt: string;
  snapshotLabel: string | null;
  source: SnapshotSource;
  versionId: string;
};

type StoredVersionIndex = {
  schemaVersion: 'webdav-index/v1';
  versions: StoredVersionDescriptor[];
};

type StoredSnapshotEnvelope<TPayload> = {
  artifactType: SnapshotArtifactType;
  createdAt: string;
  originAction: 'upload-browser-to-webdav' | 'upload-draft-to-webdav';
  payload: TPayload;
  payloadFormat: string;
  schemaVersion: string;
  snapshotLabel: string | null;
  source: SnapshotSource;
  versionId: string;
};

type UploadVersionedSnapshotInput =
  | {
      createdAt: string;
      draftSnapshot: DraftGraphSnapshot;
      kind: 'draft';
      profile: WebdavProfile;
      snapshotLabel?: string | null;
    }
  | {
      browserTree: BrowserBookmarkTreeNode[];
      createdAt: string;
      kind: 'browser';
      profile: WebdavProfile;
      snapshotLabel?: string | null;
    };

type UploadVersionedSnapshotResult =
  | {
      kind: 'blocked';
      reason: string;
    }
  | {
      error: string;
      kind: 'error';
    }
  | {
      kind: 'partial-success';
      cleanupError: string;
      prunedVersionIds: string[];
      versionId: string;
    }
  | {
      kind: 'success';
      prunedVersionIds: string[];
      versionId: string;
    };

type ReadJsonResult =
  | {
      kind: 'loaded';
      value: unknown;
    }
  | {
      kind: 'missing';
    }
  | {
      error: string;
      kind: 'error';
    };

type WriteJsonResult =
  | {
      kind: 'saved';
    }
  | {
      error: string;
      kind: 'error';
    };

type DeleteFileResult =
  | {
      kind: 'deleted';
    }
  | {
      error: string;
      kind: 'error';
    };

type UploadVersionedSnapshotDependencies = {
  deleteFile: (path: string, profile: WebdavProfile) => Promise<DeleteFileResult>;
  readJson: (path: string, profile: WebdavProfile) => Promise<ReadJsonResult>;
  writeJson: (path: string, value: unknown, profile: WebdavProfile) => Promise<WriteJsonResult>;
};

type UploadModule = {
  uploadVersionedSnapshot: (
    input: UploadVersionedSnapshotInput,
    dependencies: UploadVersionedSnapshotDependencies,
  ) => Promise<UploadVersionedSnapshotResult>;
};

const WEBDAV_DATA_ROOT = '/bookmark-extension-data';

function createWebdavProfile(): WebdavProfile {
  return {
    endpointUrl: 'https://dav.example.com/collection/',
    username: 'alice',
    password: 'secret-pass',
    lastTestedAt: '2026-04-12T11:00:00.000Z',
    lastTestStatus: 'success',
  };
}

function createVersionIndex(
  artifactType: SnapshotArtifactType,
  source: SnapshotSource,
  versionIds: string[],
): StoredVersionIndex {
  return {
    schemaVersion: 'webdav-index/v1',
    versions: versionIds.map((versionId) => ({
      artifactType,
      createdAt: versionId,
      snapshotLabel: null,
      source,
      versionId,
    })),
  };
}

async function loadUploadModule(): Promise<UploadModule> {
  const uploadModulePath = './uploadVersionedSnapshot';
  return await import(uploadModulePath) as UploadModule;
}

describe('T11 WebDAV versioned upload orchestration', () => {
  test('writes a new draft version, updates latest and index, and prunes the category back to the newest five versions', async () => {
    const uploadModule = await loadUploadModule();
    const profile = createWebdavProfile();
    const existingIndex = createVersionIndex('draft-snapshot', 'draft', [
      '2026-04-11T12:00:00.000Z',
      '2026-04-10T12:00:00.000Z',
      '2026-04-09T12:00:00.000Z',
      '2026-04-08T12:00:00.000Z',
      '2026-04-07T12:00:00.000Z',
    ]);
    const readJson = vi.fn(async (...args: [string, WebdavProfile]) => {
      const [path] = args;
      if (path === `${WEBDAV_DATA_ROOT}/drafts/index.json`) {
        return {
          kind: 'loaded',
          value: existingIndex,
        } satisfies ReadJsonResult;
      }

      return {
        kind: 'missing',
      } satisfies ReadJsonResult;
    });
    const writeJson = vi.fn(async (...args: [string, unknown, WebdavProfile]) => {
      void args;
      return {
        kind: 'saved',
      } satisfies WriteJsonResult;
    });
    const deleteFile = vi.fn(async (...args: [string, WebdavProfile]) => {
      void args;
      return {
        kind: 'deleted',
      } satisfies DeleteFileResult;
    });

    const result = await uploadModule.uploadVersionedSnapshot(
      {
        createdAt: '2026-04-12T12:00:00.000Z',
        draftSnapshot: createDraftGraphFixture(),
        kind: 'draft',
        profile,
      },
      {
        deleteFile,
        readJson,
        writeJson,
      },
    );

    expect(result).toEqual({
      kind: 'success',
      prunedVersionIds: ['2026-04-07T12:00:00.000Z'],
      versionId: '2026-04-12T12-00-00.000Z',
    });
    expect(readJson).toHaveBeenCalledWith(`${WEBDAV_DATA_ROOT}/drafts/index.json`, profile);
    expect(writeJson.mock.calls.map(([path]) => path)).toEqual([
      `${WEBDAV_DATA_ROOT}/drafts/versions/2026-04-12T12-00-00.000Z.json`,
      `${WEBDAV_DATA_ROOT}/drafts/index.json`,
      `${WEBDAV_DATA_ROOT}/drafts/latest.json`,
    ]);

    const versionWriteCall = writeJson.mock.calls[0];
    if (!versionWriteCall) {
      throw new Error('Expected the draft version write call to exist.');
    }
    const versionEnvelope = versionWriteCall[1] as StoredSnapshotEnvelope<DraftGraphSnapshot>;
    expect(versionEnvelope).toMatchObject({
      artifactType: 'draft-snapshot',
      createdAt: '2026-04-12T12:00:00.000Z',
      originAction: 'upload-draft-to-webdav',
      payload: createDraftGraphFixture(),
      payloadFormat: 'draft-graph-snapshot',
      snapshotLabel: null,
      source: 'draft',
      versionId: '2026-04-12T12-00-00.000Z',
    });

    const indexWriteCall = writeJson.mock.calls[1];
    if (!indexWriteCall) {
      throw new Error('Expected the draft index write call to exist.');
    }
    const nextIndex = indexWriteCall[1] as StoredVersionIndex;
    expect(nextIndex.versions.map((version) => version.versionId)).toEqual([
      '2026-04-12T12-00-00.000Z',
      '2026-04-11T12:00:00.000Z',
      '2026-04-10T12:00:00.000Z',
      '2026-04-09T12:00:00.000Z',
      '2026-04-08T12:00:00.000Z',
    ]);

    const latestWriteCall = writeJson.mock.calls[2];
    if (!latestWriteCall) {
      throw new Error('Expected the latest draft write call to exist.');
    }
    const latestEnvelope = latestWriteCall[1] as StoredSnapshotEnvelope<DraftGraphSnapshot>;
    expect(latestEnvelope).toEqual(versionEnvelope);
    expect(deleteFile).toHaveBeenCalledWith(`${WEBDAV_DATA_ROOT}/drafts/versions/2026-04-07T12:00:00.000Z.json`, profile);
  });

  test('rolls back the just-written draft version and manifest entry when latest.json update fails', async () => {
    const uploadModule = await loadUploadModule();
    const profile = createWebdavProfile();
    const existingIndex = createVersionIndex('draft-snapshot', 'draft', [
      '2026-04-11T12:00:00.000Z',
      '2026-04-10T12:00:00.000Z',
    ]);
    const readJson = vi.fn(async (...args: [string, WebdavProfile]) => {
      void args;
      return {
        kind: 'loaded',
        value: existingIndex,
      } satisfies ReadJsonResult;
    });
    const writeJson = vi.fn(async (...args: [string, unknown, WebdavProfile]) => {
      const [path] = args;
      if (path === `${WEBDAV_DATA_ROOT}/drafts/latest.json`) {
        return {
          error: 'Failed to update latest pointer.',
          kind: 'error',
        } satisfies WriteJsonResult;
      }

      return {
        kind: 'saved',
      } satisfies WriteJsonResult;
    });
    const deleteFile = vi.fn(async (...args: [string, WebdavProfile]) => {
      void args;
      return {
        kind: 'deleted',
      } satisfies DeleteFileResult;
    });

    const result = await uploadModule.uploadVersionedSnapshot(
      {
        createdAt: '2026-04-12T12:30:00.000Z',
        draftSnapshot: createDraftGraphFixture(),
        kind: 'draft',
        profile,
      },
      {
        deleteFile,
        readJson,
        writeJson,
      },
    );

    expect(result).toEqual({
      error: 'Failed to update latest pointer.',
      kind: 'error',
    });
    expect(deleteFile).toHaveBeenCalledWith(`${WEBDAV_DATA_ROOT}/drafts/versions/2026-04-12T12-30-00.000Z.json`, profile);

    const indexWrites = writeJson.mock.calls
      .filter(([path]) => path === `${WEBDAV_DATA_ROOT}/drafts/index.json`)
      .map((call) => call[1] as StoredVersionIndex);
    expect(indexWrites).toHaveLength(2);
    expect(indexWrites[0]?.versions.map((version) => version.versionId)).toEqual([
      '2026-04-12T12-30-00.000Z',
      '2026-04-11T12:00:00.000Z',
      '2026-04-10T12:00:00.000Z',
    ]);
    expect(indexWrites[1]).toEqual(existingIndex);
  });

  test('returns partial-success for browser uploads when stale-version cleanup fails and keeps bookmark paths separated from draft paths', async () => {
    const uploadModule = await loadUploadModule();
    const profile = createWebdavProfile();
    const browserTree = exportDraftToBrowserTree(createDraftGraphFixture());
    const readJson = vi.fn(async (...args: [string, WebdavProfile]) => {
      const [path] = args;
      if (path === `${WEBDAV_DATA_ROOT}/bookmarks/index.json`) {
        return {
          kind: 'loaded',
          value: createVersionIndex('bookmark-snapshot', 'browser', [
            '2026-04-11T12:00:00.000Z',
            '2026-04-10T12:00:00.000Z',
            '2026-04-09T12:00:00.000Z',
            '2026-04-08T12:00:00.000Z',
            '2026-04-07T12:00:00.000Z',
          ]),
        } satisfies ReadJsonResult;
      }

      return {
        kind: 'missing',
      } satisfies ReadJsonResult;
    });
    const writeJson = vi.fn(async (...args: [string, unknown, WebdavProfile]) => {
      void args;
      return {
        kind: 'saved',
      } satisfies WriteJsonResult;
    });
    const deleteFile = vi.fn(async (...args: [string, WebdavProfile]) => {
      const [path] = args;
      if (path === `${WEBDAV_DATA_ROOT}/bookmarks/versions/2026-04-07T12:00:00.000Z.json`) {
        return {
          error: 'Failed to delete stale browser version.',
          kind: 'error',
        } satisfies DeleteFileResult;
      }

      return {
        kind: 'deleted',
      } satisfies DeleteFileResult;
    });

    const result = await uploadModule.uploadVersionedSnapshot(
      {
        browserTree,
        createdAt: '2026-04-12T13:00:00.000Z',
        kind: 'browser',
        profile,
      },
      {
        deleteFile,
        readJson,
        writeJson,
      },
    );

    expect(result).toEqual({
      cleanupError: 'Failed to delete stale browser version.',
      kind: 'partial-success',
      prunedVersionIds: ['2026-04-07T12:00:00.000Z'],
      versionId: '2026-04-12T13-00-00.000Z',
    });

    const writtenPaths = writeJson.mock.calls.map(([path]) => path);
    expect(writtenPaths).toEqual([
      `${WEBDAV_DATA_ROOT}/bookmarks/versions/2026-04-12T13-00-00.000Z.json`,
      `${WEBDAV_DATA_ROOT}/bookmarks/index.json`,
      `${WEBDAV_DATA_ROOT}/bookmarks/latest.json`,
    ]);
    expect(writtenPaths.every((path) => path.startsWith(`${WEBDAV_DATA_ROOT}/bookmarks/`))).toBe(true);
    expect(writtenPaths.some((path) => path.startsWith(`${WEBDAV_DATA_ROOT}/drafts/`))).toBe(false);

    const browserLatestWriteCall = writeJson.mock.calls[2];
    if (!browserLatestWriteCall) {
      throw new Error('Expected the latest browser write call to exist.');
    }
    const latestEnvelope = browserLatestWriteCall[1] as StoredSnapshotEnvelope<BrowserBookmarkTreeNode[]>;
    expect(latestEnvelope).toMatchObject({
      artifactType: 'bookmark-snapshot',
      originAction: 'upload-browser-to-webdav',
      payload: browserTree,
      payloadFormat: 'browser-bookmark-tree',
      source: 'browser',
      versionId: '2026-04-12T13-00-00.000Z',
    });
  });

  test('does not duplicate the fixed data-root directory when the configured WebDAV URL already points at bookmark-extension-data', async () => {
    const uploadModule = await loadUploadModule();
    const profile: WebdavProfile = {
      endpointUrl: 'https://dav.example.com/collection/bookmark-extension-data/',
      username: 'alice',
      password: 'secret-pass',
      lastTestedAt: '2026-04-12T11:00:00.000Z',
      lastTestStatus: 'success',
    };
    const readJson = vi.fn(async () => {
      return {
        kind: 'missing',
      } satisfies ReadJsonResult;
    });
    const writeJson = vi.fn(async (...args: [string, unknown, WebdavProfile]) => {
      void args;
      return {
        kind: 'saved',
      } satisfies WriteJsonResult;
    });
    const deleteFile = vi.fn(async (...args: [string, WebdavProfile]) => {
      void args;
      return {
        kind: 'deleted',
      } satisfies DeleteFileResult;
    });

    const result = await uploadModule.uploadVersionedSnapshot(
      {
        createdAt: '2026-04-12T14:00:00.000Z',
        draftSnapshot: createDraftGraphFixture(),
        kind: 'draft',
        profile,
      },
      {
        deleteFile,
        readJson,
        writeJson,
      },
    );

    expect(result).toEqual({
      kind: 'success',
      prunedVersionIds: [],
      versionId: '2026-04-12T14-00-00.000Z',
    });
    expect(writeJson.mock.calls.map(([path]) => path)).toEqual([
      '/drafts/versions/2026-04-12T14-00-00.000Z.json',
      '/drafts/index.json',
      '/drafts/latest.json',
    ]);
  });
});
