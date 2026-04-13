# T12B Test-First Gate

## Goal

Freeze the executable WebDAV browser-restore gate for `T12B` before implementation.

## Scope

- Load only bookmark-category remote versions from `/bookmark-extension-data/bookmarks/index.json`
- Open a browser-only restore picker from `恢复 WebDAV 书签到浏览器书签`
- Continue into the shared overwrite-confirmation dialog with restore-to-browser wording
- Write `latest-browser-backup` with `sourceOrigin = webdav-bookmark-version` before browser mutation begins
- Download only `/bookmark-extension-data/bookmarks/versions/<versionId>.json`
- Apply the selected remote bookmark tree to browser bookmarks through the managed browser writer
- Keep the current draft unchanged during browser restore

## Out Of Scope In This Gate

- Any WebDAV draft restore execution
- Multi-profile WebDAV management
- Background or startup-time remote version preloading
- Real Chrome extension runtime and real WebDAV provider smoke verification

These boundaries belong to `T12A` or later verification / closeout work.

## Planned Contract

Application restore orchestration must distinguish at least:

```ts
type RestoreVersionedSnapshotResult =
  | { kind: 'success'; snapshot: DraftGraphSnapshot; version: WebdavVersionDescriptor }
  | { kind: 'success'; tree: BrowserBookmarkTreeNode[]; version: WebdavVersionDescriptor }
  | { kind: 'blocked'; reason: string }
  | { kind: 'error'; error: string };
```

Expected behavior:

- `restoreVersionedSnapshot({ kind: 'browser', profile, versionId })`
  - reads only `/bookmark-extension-data/bookmarks/index.json`
  - downloads only `/bookmark-extension-data/bookmarks/versions/<versionId>.json`
  - validates `artifactType = 'bookmark-snapshot'`
  - validates `source = 'browser'`
  - validates `payloadFormat = 'browser-bookmark-tree'`
  - returns the validated browser tree plus the selected version descriptor
- app-shell browser restore flow
  - keeps the browser restore action separate from draft restore
  - shows only bookmark-version choices in the picker
  - opens the shared overwrite-confirmation structure after one version is selected
  - writes `latest-browser-backup` before the first browser mutation
  - applies the restored browser tree through the managed browser writer
  - keeps the current draft unchanged on success and on failure
  - records restore status through the shell history

## Gate Cases

### Application gate

1. Good: restoring one selected bookmark version reads the bookmark index first, then loads the selected bookmark version file, and returns the validated browser tree plus its descriptor
2. Bad boundary: if the selected remote envelope is not a `bookmark-snapshot`, the result is `error` and no cross-type restore is accepted

### App interaction gate

1. Good: when WebDAV readiness is satisfied, clicking `恢复 WebDAV 书签到浏览器书签` opens a browser-only version picker, continues into the shared confirmation dialog, writes `latest-browser-backup` before browser mutation begins, restores browser bookmarks, and records a completed status entry while keeping the current draft unchanged
2. Bad boundary: if the selected remote payload is invalid for browser restore, the current draft remains unchanged, browser bookmarks are not mutated, and the status history records a restore failure

### Deferred boundary

1. Deferred to `T13`: real Chrome extension runtime walkthrough with a real WebDAV provider

## Planned Automated Gate

- `src/features/webdav/application/restoreVersionedSnapshot.test.ts`
- `src/app/App.webdavBrowserRestoreFlow.test.tsx`
- `src/app/App.webdavAvailabilityGate.test.tsx`
- Command: `pnpm exec vitest run src/features/webdav/application/restoreVersionedSnapshot.test.ts src/app/App.webdavBrowserRestoreFlow.test.tsx src/app/App.webdavAvailabilityGate.test.tsx`

## Verification

- Automated gate command: `pnpm exec vitest run src/features/webdav/application/restoreVersionedSnapshot.test.ts src/app/App.webdavBrowserRestoreFlow.test.tsx src/app/App.webdavAvailabilityGate.test.tsx`
- Expected current phase result after writing tests only: `fail`
- Manual Chrome extension verification remains deferred until implementation exists
