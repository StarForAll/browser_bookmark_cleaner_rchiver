import {
  validateBrowserBookmarkTree,
  type BrowserBookmarkTreeNode,
} from '@/adapters/browser-bookmarks/contracts';
import {
  validateWebdavProfile,
  type WebdavProfile,
} from '@/adapters/local-persistence/contracts';
import {
  readWebdavJsonDocument,
  type ReadWebdavJsonDocumentResult,
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
import type { WebdavVersionDescriptor, WebdavVersionIndex } from './uploadVersionedSnapshot';

const WEBDAV_INDEX_SCHEMA_VERSION = 'webdav-index/v1';
const WEBDAV_SNAPSHOT_SCHEMA_VERSION = 'webdav-snapshot/v1';
const WEBDAV_DATA_ROOT_DIR_NAME = 'bookmark-extension-data';

type RestoreCategoryConfig =
  | {
      artifactType: 'draft-snapshot';
      basePathSuffix: '/drafts';
      kind: 'draft';
      payloadFormat: 'draft-graph-snapshot';
      source: 'draft';
      targetLabel: 'draft';
    }
  | {
      artifactType: 'bookmark-snapshot';
      basePathSuffix: '/bookmarks';
      kind: 'browser';
      payloadFormat: 'browser-bookmark-tree';
      source: 'browser';
      targetLabel: 'bookmark';
    };

const DRAFT_RESTORE_CATEGORY: RestoreCategoryConfig = {
  artifactType: 'draft-snapshot',
  basePathSuffix: '/drafts',
  kind: 'draft',
  payloadFormat: 'draft-graph-snapshot',
  source: 'draft',
  targetLabel: 'draft',
};

const BROWSER_RESTORE_CATEGORY: RestoreCategoryConfig = {
  artifactType: 'bookmark-snapshot',
  basePathSuffix: '/bookmarks',
  kind: 'browser',
  payloadFormat: 'browser-bookmark-tree',
  source: 'browser',
  targetLabel: 'bookmark',
};

const RESTORE_CATEGORY_BY_KIND = {
  browser: BROWSER_RESTORE_CATEGORY,
  draft: DRAFT_RESTORE_CATEGORY,
} as const;

export type ListRestorableVersionsInput = {
  kind: 'browser' | 'draft';
  profile: WebdavProfile;
};

export type ListRestorableVersionsResult =
  | {
      kind: 'success';
      versions: WebdavVersionDescriptor[];
    }
  | {
      kind: 'blocked';
      reason: string;
    }
  | {
      kind: 'error';
      error: string;
    };

export type RestoreVersionedSnapshotInput = {
  kind: 'browser' | 'draft';
  profile: WebdavProfile;
  version?: WebdavVersionDescriptor;
  versionId: string;
};

export type RestoreVersionedSnapshotResult =
  | {
      kind: 'success';
      snapshot: DraftGraphSnapshot;
      version: WebdavVersionDescriptor;
    }
  | {
      kind: 'success';
      tree: BrowserBookmarkTreeNode[];
      version: WebdavVersionDescriptor;
    }
  | {
      kind: 'blocked';
      reason: string;
    }
  | {
      kind: 'error';
      error: string;
    };

export type RestoreVersionedSnapshotDependencies = {
  readJson: (path: string, profile: WebdavProfile) => Promise<ReadWebdavJsonDocumentResult>;
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
  category: RestoreCategoryConfig,
): string {
  return `${resolveWebdavDataRootPrefix(profile)}${category.basePathSuffix}`;
}

function validateVersionDescriptor(
  value: unknown,
  category: RestoreCategoryConfig,
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
  category: RestoreCategoryConfig,
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

function validateDraftSnapshotEnvelope(
  value: unknown,
  category: RestoreCategoryConfig,
): ValidationResult<DraftGraphSnapshot | BrowserBookmarkTreeNode[]> {
  if (!isRecord(value)) {
    return validationFailure('WebDAV snapshot envelope must be an object.');
  }

  if (value.schemaVersion !== WEBDAV_SNAPSHOT_SCHEMA_VERSION) {
    return validationFailure('WebDAV snapshot schemaVersion is invalid.');
  }

  if (value.artifactType !== category.artifactType) {
    return validationFailure(`WebDAV snapshot artifactType is invalid for ${category.targetLabel} restore.`);
  }

  if (value.source !== category.source) {
    return validationFailure(`WebDAV snapshot source is invalid for ${category.targetLabel} restore.`);
  }

  if (value.payloadFormat !== category.payloadFormat) {
    return validationFailure(`WebDAV snapshot payloadFormat is invalid for ${category.targetLabel} restore.`);
  }

  if (!isNonEmptyString(value.createdAt) || !isNonEmptyString(value.versionId)) {
    return validationFailure('WebDAV snapshot envelope metadata is incomplete.');
  }

  if (category.kind === 'draft') {
    return validateDraftGraphSnapshot(value.payload);
  }

  return validateBrowserBookmarkTree(value.payload);
}

export async function listRestorableVersions(
  input: ListRestorableVersionsInput,
  dependencies: RestoreVersionedSnapshotDependencies = {
    readJson: readWebdavJsonDocument,
  },
): Promise<ListRestorableVersionsResult> {
  const category = RESTORE_CATEGORY_BY_KIND[input.kind];
  const profileValidation = validateWebdavProfile(input.profile);
  if (!profileValidation.ok) {
    return {
      kind: 'blocked',
      reason: profileValidation.error,
    };
  }

  const categoryBasePath = resolveCategoryBasePath(profileValidation.value, category);
  const indexResult = await dependencies.readJson(`${categoryBasePath}/index.json`, profileValidation.value);

  if (indexResult.kind === 'missing') {
    return {
      kind: 'success',
      versions: [],
    };
  }

  if (indexResult.kind === 'error') {
    return {
      kind: 'error',
      error: indexResult.error,
    };
  }

  const validation = validateVersionIndex(indexResult.value, category);
  if (!validation.ok) {
    return {
      kind: 'error',
      error: validation.error,
    };
  }

  return {
    kind: 'success',
    versions: validation.value.versions,
  };
}

export async function restoreVersionedSnapshot(
  input: RestoreVersionedSnapshotInput,
  dependencies: RestoreVersionedSnapshotDependencies = {
    readJson: readWebdavJsonDocument,
  },
): Promise<RestoreVersionedSnapshotResult> {
  const category = RESTORE_CATEGORY_BY_KIND[input.kind];
  const profileValidation = validateWebdavProfile(input.profile);
  if (!profileValidation.ok) {
    return {
      kind: 'blocked',
      reason: profileValidation.error,
    };
  }

  let selectedVersion = input.version ?? null;
  if (!selectedVersion) {
    const versionsResult = await listRestorableVersions(
      {
        kind: input.kind,
        profile: profileValidation.value,
      },
      dependencies,
    );

    if (versionsResult.kind !== 'success') {
      return versionsResult;
    }

    selectedVersion = versionsResult.versions.find((version) => version.versionId === input.versionId) ?? null;
    if (!selectedVersion) {
      return {
        kind: 'blocked',
        reason: `Selected WebDAV ${category.targetLabel} version ${input.versionId} is no longer listed in the remote index.`,
      };
    }
  }

  if (selectedVersion.versionId !== input.versionId) {
    return {
      kind: 'blocked',
      reason: `Selected WebDAV ${category.targetLabel} version metadata does not match the requested version id.`,
    };
  }

  const categoryBasePath = resolveCategoryBasePath(profileValidation.value, category);
  const snapshotResult = await dependencies.readJson(
    `${categoryBasePath}/versions/${selectedVersion.versionId}.json`,
    profileValidation.value,
  );

  if (snapshotResult.kind === 'missing') {
    return {
      kind: 'error',
      error: `WebDAV ${category.targetLabel} version ${selectedVersion.versionId} is missing.`,
    };
  }

  if (snapshotResult.kind === 'error') {
    return {
      kind: 'error',
      error: snapshotResult.error,
    };
  }

  const envelopeValidation = validateDraftSnapshotEnvelope(
    snapshotResult.value,
    category,
  );
  if (!envelopeValidation.ok) {
    return {
      kind: 'error',
      error: envelopeValidation.error,
    };
  }

  if (category.kind === 'browser') {
    return {
      kind: 'success',
      tree: envelopeValidation.value as BrowserBookmarkTreeNode[],
      version: selectedVersion,
    };
  }

  return {
    kind: 'success',
    snapshot: envelopeValidation.value as DraftGraphSnapshot,
    version: selectedVersion,
  };
}
