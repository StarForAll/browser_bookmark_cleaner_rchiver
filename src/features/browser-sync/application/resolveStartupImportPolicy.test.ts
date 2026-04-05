import { describe, expect, test } from 'vitest';

describe('T05 startup import policy', () => {
  test('restores the persisted draft session when local draft data already exists', async () => {
    const policy = await import('./resolveStartupImportPolicy');

    expect(
      policy.resolveStartupImportPolicy({
        hasPersistedDraftSession: true,
        hasBrowserPermission: true,
        hasReadableBrowserTree: true,
      }),
    ).toEqual({
      action: 'restore-local-draft',
      reason: 'persisted-draft-session-exists',
    });
  });

  test('imports from browser bookmarks on first startup when no local draft session exists', async () => {
    const policy = await import('./resolveStartupImportPolicy');

    expect(
      policy.resolveStartupImportPolicy({
        hasPersistedDraftSession: false,
        hasBrowserPermission: true,
        hasReadableBrowserTree: true,
      }),
    ).toEqual({
      action: 'import-browser-tree',
      reason: 'no-persisted-draft-session',
    });
  });

  test('stays blocked when first startup cannot read browser bookmarks', async () => {
    const policy = await import('./resolveStartupImportPolicy');

    expect(
      policy.resolveStartupImportPolicy({
        hasPersistedDraftSession: false,
        hasBrowserPermission: false,
        hasReadableBrowserTree: false,
      }),
    ).toEqual({
      action: 'await-browser-import',
      reason: 'browser-bookmarks-unavailable',
    });
  });
});
