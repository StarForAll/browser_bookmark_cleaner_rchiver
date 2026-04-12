# T12A Test-First Gate

## Goal

Freeze the executable WebDAV draft-restore gate for `T12A` before implementation.

## Scope

- Load only draft-category remote versions from `/bookmark-extension-data/drafts/index.json`
- Open a draft-only restore picker from `恢复 WebDAV 草稿到当前草稿`
- Continue into the shared overwrite-confirmation dialog with restore-to-draft wording
- Write `latest-draft-backup` with `sourceOrigin = webdav-draft-version` before downloading the selected remote version
- Download only `/bookmark-extension-data/drafts/versions/<versionId>.json`
- Replace the current draft and record restore status through the shell history

## Out Of Scope In This Gate

- Any WebDAV browser-bookmark restore execution
- Multi-profile WebDAV management
- Background or startup-time remote version preloading
- Real Chrome extension runtime and real WebDAV provider smoke verification

These boundaries belong to `T12B` or later verification / closeout work.

## Planned Contract

Application restore orchestration must distinguish at least:

```ts
type RestoreVersionedSnapshotResult =
  | { kind: 'success'; snapshot: DraftGraphSnapshot; version: WebdavVersionDescriptor }
  | { kind: 'blocked'; reason: string }
  | { kind: 'error'; error: string };
```

Expected behavior:

- `restoreVersionedSnapshot({ kind: 'draft', profile, versionId })`
  - reads only `/bookmark-extension-data/drafts/index.json`
  - downloads only `/bookmark-extension-data/drafts/versions/<versionId>.json`
  - validates `artifactType = 'draft-snapshot'`
  - validates `source = 'draft'`
  - validates `payloadFormat = 'draft-graph-snapshot'`
  - returns the validated draft snapshot plus the selected version descriptor
- app-shell draft restore flow
  - keeps the draft restore action separate from browser restore
  - shows only draft-version choices in the picker
  - opens the shared overwrite-confirmation structure after one version is selected
  - writes `latest-draft-backup` before remote version download starts
  - keeps browser bookmarks untouched during draft restore
  - preserves the current draft when remote validation or download fails

## Gate Cases

### Application gate

1. Good: restoring one selected draft version reads the draft index first, then loads the selected draft version file, and returns the validated restored snapshot plus its descriptor
2. Bad boundary: if the selected remote envelope is not a `draft-snapshot`, the result is `error` and no cross-type restore is accepted

### App interaction gate

1. Good: when WebDAV readiness is satisfied, clicking `恢复 WebDAV 草稿到当前草稿` opens a draft-only version picker, continues into the shared confirmation dialog, writes `latest-draft-backup` before remote version download, replaces the current draft, and records a completed status entry
2. Bad boundary: if the selected remote payload is invalid for draft restore, the current draft remains unchanged and the status history records a restore failure

### Deferred boundary

1. Deferred to `T12B`: browser-bookmark restore picker, browser-target backup generation, and browser overwrite behavior
2. Deferred to `T13`: real Chrome extension runtime walkthrough with a real WebDAV provider

## Planned Automated Gate

- `src/features/webdav/application/restoreVersionedSnapshot.test.ts`
- `src/app/App.webdavDraftRestoreFlow.test.tsx`
- Command: `pnpm exec vitest run src/features/webdav/application/restoreVersionedSnapshot.test.ts src/app/App.webdavDraftRestoreFlow.test.tsx`

## Verification

- Automated gate command: `pnpm exec vitest run src/features/webdav/application/restoreVersionedSnapshot.test.ts src/app/App.webdavDraftRestoreFlow.test.tsx`
- Expected current phase result after writing tests only: `fail`
- Manual Chrome extension verification remains deferred until implementation exists
