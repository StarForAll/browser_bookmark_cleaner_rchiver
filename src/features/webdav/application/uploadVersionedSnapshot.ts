import type { BrowserBookmarkTreeNode } from '@/adapters/browser-bookmarks/contracts';
import {
  validateWebdavProfile,
  type WebdavProfile,
} from '@/adapters/local-persistence/contracts';
import {
  deleteWebdavFile,
  readWebdavJsonDocument,
  writeWebdavJsonDocument,
  type DeleteWebdavFileResult,
  type ReadWebdavJsonDocumentResult,
  type WriteWebdavJsonDocumentResult,
} from '@/adapters/webdav/jsonDocument';
import {
  validateDraftGraphSnapshot,
  type DraftGraphSnapshot,
} from '@/domain/draft-graph/contracts';
import {
  isNonEmptyString,
  isRecord,
  validationFailure,
  validationSuccess,
  type ValidationResult,
} from '@/shared/contracts/validation';

const WEBDAV_INDEX_SCHEMA_VERSION = 'webdav-index/v1';
const WEBDAV_SNAPSHOT_SCHEMA_VERSION = 'webdav-snapshot/v1';
const MAX_RETAINED_VERSIONS = 5;
const WEBDAV_DATA_ROOT_DIR_NAME = 'bookmark-extension-data';

type UploadKind = 'browser' | 'draft';
type SnapshotArtifactType = 'bookmark-snapshot' | 'draft-snapshot';
type SnapshotOriginAction = 'upload-browser-to-webdav' | 'upload-draft-to-webdav';
type SnapshotPayloadFormat = 'browser-bookmark-tree' | 'draft-graph-snapshot';
type SnapshotSource = 'browser' | 'draft';

type UploadCategoryConfig = {
  artifactType: SnapshotArtifactType;
  basePathSuffix: '/bookmarks' | '/drafts';
  originAction: SnapshotOriginAction;
  payloadFormat: SnapshotPayloadFormat;
  source: SnapshotSource;
};

export type WebdavVersionDescriptor = {
  artifactType: SnapshotArtifactType;
  createdAt: string;
  snapshotLabel: string | null;
  source: SnapshotSource;
  versionId: string;
};

export type WebdavVersionIndex = {
  schemaVersion: typeof WEBDAV_INDEX_SCHEMA_VERSION;
  versions: WebdavVersionDescriptor[];
};

export type WebdavSnapshotEnvelope<TPayload> = {
  artifactType: SnapshotArtifactType;
  createdAt: string;
  originAction: SnapshotOriginAction;
  payload: TPayload;
  payloadFormat: SnapshotPayloadFormat;
  schemaVersion: typeof WEBDAV_SNAPSHOT_SCHEMA_VERSION;
  snapshotLabel: string | null;
  source: SnapshotSource;
  versionId: string;
};

export type UploadVersionedSnapshotInput =
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

export type UploadVersionedSnapshotResult =
  | {
      kind: 'blocked';
      reason: string;
    }
  | {
      error: string;
      kind: 'error';
    }
  | {
      cleanupError: string;
      kind: 'partial-success';
      prunedVersionIds: string[];
      versionId: string;
    }
  | {
      kind: 'success';
      prunedVersionIds: string[];
      versionId: string;
    };

export type UploadVersionedSnapshotDependencies = {
  deleteFile: (path: string, profile: WebdavProfile) => Promise<DeleteWebdavFileResult>;
  readJson: (path: string, profile: WebdavProfile) => Promise<ReadWebdavJsonDocumentResult>;
  writeJson: (path: string, value: unknown, profile: WebdavProfile) => Promise<WriteWebdavJsonDocumentResult>;
};

const UPLOAD_CATEGORY_BY_KIND: Record<UploadKind, UploadCategoryConfig> = {
  browser: {
    artifactType: 'bookmark-snapshot',
    basePathSuffix: '/bookmarks',
    originAction: 'upload-browser-to-webdav',
    payloadFormat: 'browser-bookmark-tree',
    source: 'browser',
  },
  draft: {
    artifactType: 'draft-snapshot',
    basePathSuffix: '/drafts',
    originAction: 'upload-draft-to-webdav',
    payloadFormat: 'draft-graph-snapshot',
    source: 'draft',
  },
};

function resolveWebdavDataRootPrefix(profile: WebdavProfile): string {
  try {
    const pathname = new URL(profile.endpointUrl).pathname.replace(/\/+$/, '');
    if (pathname.endsWith(`/${WEBDAV_DATA_ROOT_DIR_NAME}`)) {
      return '';
    }
  } catch {
    return `/${WEBDAV_DATA_ROOT_DIR_NAME}`;
  }

  return `/${WEBDAV_DATA_ROOT_DIR_NAME}`;
}

function resolveCategoryBasePath(
  profile: WebdavProfile,
  category: UploadCategoryConfig,
): string {
  return `${resolveWebdavDataRootPrefix(profile)}${category.basePathSuffix}`;
}

function validateBrowserTree(value: unknown): ValidationResult<BrowserBookmarkTreeNode[]> {
  if (!Array.isArray(value)) {
    return validationFailure('Browser snapshot payload must be an array.');
  }

  for (const [index, node] of value.entries()) {
    if (!isRecord(node)) {
      return validationFailure(`Browser snapshot payload node ${index} must be an object.`);
    }
  }

  return validationSuccess(value as BrowserBookmarkTreeNode[]);
}

function validateVersionDescriptor(
  value: unknown,
  category: UploadCategoryConfig,
  path: string,
): ValidationResult<WebdavVersionDescriptor> {
  if (!isRecord(value)) {
    return validationFailure(`${path} must be an object.`);
  }

  const {
    artifactType,
    createdAt,
    snapshotLabel,
    source,
    versionId,
  } = value;

  if (artifactType !== category.artifactType) {
    return validationFailure(`${path}.artifactType is invalid for this category.`);
  }

  if (!isNonEmptyString(createdAt)) {
    return validationFailure(`${path}.createdAt must be a non-empty string.`);
  }

  if (snapshotLabel !== null && snapshotLabel !== undefined && typeof snapshotLabel !== 'string') {
    return validationFailure(`${path}.snapshotLabel must be a string or null.`);
  }

  if (source !== category.source) {
    return validationFailure(`${path}.source is invalid for this category.`);
  }

  if (!isNonEmptyString(versionId)) {
    return validationFailure(`${path}.versionId must be a non-empty string.`);
  }

  return validationSuccess({
    artifactType: category.artifactType,
    createdAt,
    snapshotLabel: snapshotLabel ?? null,
    source: category.source,
    versionId,
  });
}

function validateVersionIndex(
  value: unknown,
  category: UploadCategoryConfig,
): ValidationResult<WebdavVersionIndex> {
  if (!isRecord(value)) {
    return validationFailure('WebDAV version index must be an object.');
  }

  if (value.schemaVersion !== WEBDAV_INDEX_SCHEMA_VERSION) {
    return validationFailure('WebDAV version index schemaVersion is invalid.');
  }

  if (!Array.isArray(value.versions)) {
    return validationFailure('WebDAV version index versions must be an array.');
  }

  const versions: WebdavVersionDescriptor[] = [];
  for (const [index, entry] of value.versions.entries()) {
    const validation = validateVersionDescriptor(entry, category, `versions[${index}]`);
    if (!validation.ok) {
      return validation;
    }
    versions.push(validation.value);
  }

  return validationSuccess({
    schemaVersion: WEBDAV_INDEX_SCHEMA_VERSION,
    versions,
  });
}

function createEmptyVersionIndex(): WebdavVersionIndex {
  return {
    schemaVersion: WEBDAV_INDEX_SCHEMA_VERSION,
    versions: [],
  };
}

function buildSafeVersionId(createdAt: string): string {
  return createdAt
    .trim()
    .replace(/:/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '-');
}

function buildVersionDescriptor<TPayload>(
  envelope: WebdavSnapshotEnvelope<TPayload>,
): WebdavVersionDescriptor {
  return {
    artifactType: envelope.artifactType,
    createdAt: envelope.createdAt,
    snapshotLabel: envelope.snapshotLabel,
    source: envelope.source,
    versionId: envelope.versionId,
  };
}

function buildSnapshotEnvelope(
  input: UploadVersionedSnapshotInput,
  category: UploadCategoryConfig,
): WebdavSnapshotEnvelope<BrowserBookmarkTreeNode[] | DraftGraphSnapshot> {
  return {
    artifactType: category.artifactType,
    createdAt: input.createdAt,
    originAction: category.originAction,
    payload: input.kind === 'draft' ? input.draftSnapshot : input.browserTree,
    payloadFormat: category.payloadFormat,
    schemaVersion: WEBDAV_SNAPSHOT_SCHEMA_VERSION,
    snapshotLabel: input.snapshotLabel ?? null,
    source: category.source,
    versionId: buildSafeVersionId(input.createdAt),
  };
}

async function rollbackFailedUpload(input: {
  categoryBasePath: string;
  currentIndex: WebdavVersionIndex;
  dependencies: UploadVersionedSnapshotDependencies;
  profile: WebdavProfile;
  versionPath: string;
}): Promise<void> {
  await input.dependencies.deleteFile(input.versionPath, input.profile);
  await input.dependencies.writeJson(`${input.categoryBasePath}/index.json`, input.currentIndex, input.profile);
}

export async function uploadVersionedSnapshot(
  input: UploadVersionedSnapshotInput,
  dependencies: UploadVersionedSnapshotDependencies = {
    deleteFile: deleteWebdavFile,
    readJson: readWebdavJsonDocument,
    writeJson: writeWebdavJsonDocument,
  },
): Promise<UploadVersionedSnapshotResult> {
  const profileValidation = validateWebdavProfile(input.profile);
  if (!profileValidation.ok) {
    return {
      kind: 'blocked',
      reason: profileValidation.error,
    };
  }

  const payloadValidation =
    input.kind === 'draft'
      ? validateDraftGraphSnapshot(input.draftSnapshot)
      : validateBrowserTree(input.browserTree);
  if (!payloadValidation.ok) {
    return {
      error: payloadValidation.error,
      kind: 'error',
    };
  }

  const category = UPLOAD_CATEGORY_BY_KIND[input.kind];
  const categoryBasePath = resolveCategoryBasePath(profileValidation.value, category);
  const currentIndexResult = await dependencies.readJson(`${categoryBasePath}/index.json`, profileValidation.value);

  let currentIndex = createEmptyVersionIndex();
  if (currentIndexResult.kind === 'error') {
    return {
      error: currentIndexResult.error,
      kind: 'error',
    };
  }

  if (currentIndexResult.kind === 'loaded') {
    const indexValidation = validateVersionIndex(currentIndexResult.value, category);
    if (!indexValidation.ok) {
      return {
        error: indexValidation.error,
        kind: 'error',
      };
    }
    currentIndex = indexValidation.value;
  }

  const snapshotEnvelope = buildSnapshotEnvelope(input, category);
  const nextVersions = [
    buildVersionDescriptor(snapshotEnvelope),
    ...currentIndex.versions.filter((version) => version.versionId !== snapshotEnvelope.versionId),
  ];
  const retainedVersions = nextVersions.slice(0, MAX_RETAINED_VERSIONS);
  const prunedVersionIds = nextVersions.slice(MAX_RETAINED_VERSIONS).map((version) => version.versionId);
  const nextIndex: WebdavVersionIndex = {
    schemaVersion: WEBDAV_INDEX_SCHEMA_VERSION,
    versions: retainedVersions,
  };
  const versionPath = `${categoryBasePath}/versions/${snapshotEnvelope.versionId}.json`;

  const historyWriteResult = await dependencies.writeJson(versionPath, snapshotEnvelope, profileValidation.value);
  if (historyWriteResult.kind !== 'saved') {
    return {
      error: historyWriteResult.error,
      kind: 'error',
    };
  }

  const indexWriteResult = await dependencies.writeJson(
    `${categoryBasePath}/index.json`,
    nextIndex,
    profileValidation.value,
  );
  if (indexWriteResult.kind !== 'saved') {
    await rollbackFailedUpload({
      categoryBasePath,
      currentIndex,
      dependencies,
      profile: profileValidation.value,
      versionPath,
    });
    return {
      error: indexWriteResult.error,
      kind: 'error',
    };
  }

    const latestWriteResult = await dependencies.writeJson(
    `${categoryBasePath}/latest.json`,
    snapshotEnvelope,
    profileValidation.value,
  );
  if (latestWriteResult.kind !== 'saved') {
    await rollbackFailedUpload({
      categoryBasePath,
      currentIndex,
      dependencies,
      profile: profileValidation.value,
      versionPath,
    });
    return {
      error: latestWriteResult.error,
      kind: 'error',
    };
  }

  let cleanupError: string | null = null;
  for (const versionId of prunedVersionIds) {
      const deleteResult = await dependencies.deleteFile(
      `${categoryBasePath}/versions/${versionId}.json`,
      profileValidation.value,
    );
    if (deleteResult.kind !== 'deleted' && cleanupError === null) {
      cleanupError = deleteResult.error;
    }
  }

  if (cleanupError) {
    return {
      cleanupError,
      kind: 'partial-success',
      prunedVersionIds,
      versionId: snapshotEnvelope.versionId,
    };
  }

  return {
    kind: 'success',
    prunedVersionIds,
    versionId: snapshotEnvelope.versionId,
  };
}
