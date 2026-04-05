type ResolveStartupImportPolicyInput = {
  hasPersistedDraftSession: boolean;
  hasBrowserPermission: boolean;
  hasReadableBrowserTree: boolean;
};

export type StartupImportPolicy =
  | {
      action: 'restore-local-draft';
      reason: 'persisted-draft-session-exists';
    }
  | {
      action: 'import-browser-tree';
      reason: 'no-persisted-draft-session';
    }
  | {
      action: 'await-browser-import';
      reason:
        | 'browser-bookmarks-unavailable'
        | 'persisted-draft-corrupted'
        | 'browser-bookmark-read-failed';
    };

export function resolveStartupImportPolicy(
  input: ResolveStartupImportPolicyInput,
): StartupImportPolicy {
  if (input.hasPersistedDraftSession) {
    return {
      action: 'restore-local-draft',
      reason: 'persisted-draft-session-exists',
    };
  }

  if (input.hasBrowserPermission && input.hasReadableBrowserTree) {
    return {
      action: 'import-browser-tree',
      reason: 'no-persisted-draft-session',
    };
  }

  return {
    action: 'await-browser-import',
    reason: 'browser-bookmarks-unavailable',
  };
}
