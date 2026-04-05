import {
  readBrowserBookmarkTree,
  type ReadBrowserBookmarkTreeResult,
} from '@/adapters/browser-bookmarks/readBookmarkTree';
import { importBrowserTreeToDraftGraph } from '@/adapters/browser-bookmarks/importToDraft';
import {
  readPersistedDraftSession,
  type ReadPersistedDraftSessionResult,
} from '@/adapters/local-persistence/readPersistedDraftSession';
import {
  writePersistedDraftSession,
  type WritePersistedDraftSessionResult,
} from '@/adapters/local-persistence/writePersistedDraftSession';
import {
  LOCAL_PERSISTENCE_SCHEMA_VERSION,
  type PersistedDraftSession,
} from '@/adapters/local-persistence/contracts';
import { type DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { resolveStartupImportPolicy, type StartupImportPolicy } from './resolveStartupImportPolicy';

export type WorkspaceStartupStatusKey =
  | 'restored-local-draft'
  | 'imported-browser-tree'
  | 'imported-browser-tree-unsaved'
  | 'await-browser-import'
  | 'restore-error'
  | 'browser-read-error';

export type WorkspaceBootstrapResult = {
  policy: StartupImportPolicy;
  draftSnapshot: DraftGraphSnapshot | null;
  statusKey: WorkspaceStartupStatusKey;
  errorDetail?: string;
};

type BootstrapWorkspaceDependencies = {
  readPersistedDraftSession?: () => Promise<ReadPersistedDraftSessionResult>;
  readBrowserBookmarkTree?: () => Promise<ReadBrowserBookmarkTreeResult>;
  writePersistedDraftSession?: (
    session: PersistedDraftSession,
  ) => Promise<WritePersistedDraftSessionResult>;
};

export async function bootstrapWorkspace(
  dependencies: BootstrapWorkspaceDependencies = {},
): Promise<WorkspaceBootstrapResult> {
  const loadPersistedDraftSession =
    dependencies.readPersistedDraftSession ?? readPersistedDraftSession;
  const loadBrowserBookmarkTree =
    dependencies.readBrowserBookmarkTree ?? readBrowserBookmarkTree;
  const persistDraftSession =
    dependencies.writePersistedDraftSession ?? writePersistedDraftSession;

  const persistedDraftSession = await loadPersistedDraftSession();
  const hasPersistedDraftSession = persistedDraftSession.kind === 'restored';

  if (persistedDraftSession.kind === 'error') {
    return {
      policy: {
        action: 'await-browser-import',
        reason: 'persisted-draft-corrupted',
      },
      draftSnapshot: null,
      statusKey: 'restore-error',
      errorDetail: persistedDraftSession.error,
    };
  }

  let browserTreeResult: ReadBrowserBookmarkTreeResult = {
    kind: 'unavailable',
  };

  if (!hasPersistedDraftSession) {
    browserTreeResult = await loadBrowserBookmarkTree();
  }

  const policy = resolveStartupImportPolicy({
    hasPersistedDraftSession,
    hasBrowserPermission: browserTreeResult.kind === 'loaded',
    hasReadableBrowserTree: browserTreeResult.kind === 'loaded',
  });

  if (policy.action === 'restore-local-draft' && persistedDraftSession.kind === 'restored') {
    return {
      policy,
      draftSnapshot: persistedDraftSession.session.draftSnapshot,
      statusKey: 'restored-local-draft',
    };
  }

  if (policy.action === 'import-browser-tree' && browserTreeResult.kind === 'loaded') {
    const draftSnapshot = importBrowserTreeToDraftGraph({
      source: 'browser',
      tree: browserTreeResult.tree,
    });

    const persistResult = await persistDraftSession({
      schemaVersion: LOCAL_PERSISTENCE_SCHEMA_VERSION,
      draftSnapshot,
      expandedStateById: {},
      nodePositionsById: {},
      undoHistory: [],
      checkpoints: [],
    });

    if (persistResult.kind !== 'saved') {
      return {
        policy,
        draftSnapshot,
        statusKey: 'imported-browser-tree-unsaved',
        errorDetail:
          persistResult.kind === 'error'
            ? persistResult.error
            : '本地存储不可用，草稿尚未保存。',
      };
    }

    return {
      policy,
      draftSnapshot,
      statusKey: 'imported-browser-tree',
    };
  }

  if (browserTreeResult.kind === 'error') {
    return {
      policy: {
        action: 'await-browser-import',
        reason: 'browser-bookmark-read-failed',
      },
      draftSnapshot: null,
      statusKey: 'browser-read-error',
      errorDetail: browserTreeResult.error,
    };
  }

  return {
    policy,
    draftSnapshot: null,
    statusKey: 'await-browser-import',
  };
}
