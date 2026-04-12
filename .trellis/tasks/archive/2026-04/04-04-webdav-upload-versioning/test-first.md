# T11 Test-First Gate

## Goal

Freeze the executable WebDAV upload and version-retention gate for `T11` before implementation.

## Scope

- Upload the current draft snapshot to `/bookmark-extension-data/drafts/`
- Upload the current browser bookmark snapshot to `/bookmark-extension-data/bookmarks/`
- Keep `index.json`, `latest.json`, and `versions/<timestamp>.json` consistent per category
- Retain only the newest five versions for the active upload category
- Surface upload results through the top-shell status history

## Out Of Scope In This Gate

- Remote version list loading
- Any restore-to-draft or restore-to-browser execution
- Multi-profile WebDAV management
- Real Chrome extension runtime smoke verification

These boundaries belong to downstream tasks, especially `T12A`, `T12B`, and `T13`.

## Planned Contract

Application upload orchestration must distinguish at least:

```ts
type UploadVersionedSnapshotResult =
  | { kind: 'success'; versionId: string; prunedVersionIds: string[] }
  | { kind: 'partial-success'; versionId: string; prunedVersionIds: string[]; cleanupError: string }
  | { kind: 'blocked'; reason: string }
  | { kind: 'error'; error: string };
```

Expected behavior:

- draft upload
  - writes only `/bookmark-extension-data/drafts/versions/<timestamp>.json`, `/bookmark-extension-data/drafts/index.json`, and `/bookmark-extension-data/drafts/latest.json`
  - stores a full `draft-snapshot` envelope
- browser upload
  - writes only `/bookmark-extension-data/bookmarks/versions/<timestamp>.json`, `/bookmark-extension-data/bookmarks/index.json`, and `/bookmark-extension-data/bookmarks/latest.json`
  - stores a full `bookmark-snapshot` envelope
- upload ordering
  - history version write happens before `index.json`
  - `index.json` update happens before `latest.json`
  - prune runs only after the new version, index, and latest snapshot are valid
- rollback boundary
  - if version write succeeds but `index.json` or `latest.json` update fails, the new history file is deleted
  - any partial `index.json` update for that failed version is rolled back
- prune boundary
  - if the new upload succeeds but stale-version cleanup fails, the result is `partial-success`
  - the user-visible result must state that the upload succeeded but cleanup failed

## Gate Cases

### Application gate

1. Good: draft upload writes a new version, updates `index.json` and `latest.json`, and prunes the category back to the newest five versions
2. Good: browser upload writes only bookmark-category paths and never touches `/bookmark-extension-data/drafts/`
3. Bad boundary: if `index.json` or `latest.json` update fails after the history write, the just-written version is deleted and the manifest is rolled back
4. Bad boundary: if prune fails after a successful upload, the result is `partial-success` instead of downgrading the whole upload to `error`

### App interaction gate

1. Good: when `T10` availability gating is satisfied, clicking `上传当前草稿到 WebDAV` records a completed draft-upload status entry
2. Base: when `T10` gating is satisfied, clicking `上传当前浏览器书签到 WebDAV` can run without an editable draft and records a completed browser-upload status entry

### Deferred boundary

1. Deferred to `T12A` / `T12B`: remote version list loading and restore-target selection
2. Deferred to `T12A` / `T12B`: restore confirmation, local pre-restore backup, and restore execution
3. Deferred to `T13`: Chrome extension runtime upload smoke verification

## Planned Automated Gate

- `src/features/webdav/application/uploadVersionedSnapshot.test.ts`
- `src/app/App.webdavUploadFlow.test.tsx`
- Command: `pnpm test -- --run src/features/webdav/application/uploadVersionedSnapshot.test.ts src/app/App.webdavUploadFlow.test.tsx`

## Verification

- Automated gate command: `pnpm test -- --run src/features/webdav/application/uploadVersionedSnapshot.test.ts src/app/App.webdavUploadFlow.test.tsx`
- Expected current phase result after writing tests only: `fail`
- Manual Chrome extension verification remains deferred until implementation exists
