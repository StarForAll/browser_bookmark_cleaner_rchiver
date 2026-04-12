# T09B Test-First Gate

## Goal

Freeze the executable local-backup and undo-overwrite gate for `T09B` before implementation.

## Scope

- Pre-overwrite local backup generation for both browser-risk overwrite actions
- Unified `撤销覆盖操作` entry availability
- Target-specific chooser for draft and browser recovery
- Dedicated recovery confirmation boundary for browser-risk restore

## Out Of Scope In This Gate

- WebDAV upload or restore execution
- Generic draft-history `Ctrl+Z` behavior
- Multi-version backup retention beyond the newest single slot per target type

These boundaries belong to later WebDAV tasks or to already completed draft-history tasks.

## Planned Contract

App-level recovery behavior must distinguish at least:

```ts
type LocalBackupSlotKey =
  | 'latest-draft-backup'
  | 'latest-browser-backup';

type UndoOverwriteTarget =
  | 'draft'
  | 'browser';
```

Expected behavior:

- confirming `overwrite-draft-from-browser`
  - writes `latest-draft-backup` before the browser read starts
  - blocks the overwrite if backup generation fails
- confirming `sync-draft-to-browser`
  - writes `latest-browser-backup` before browser mutation starts
  - blocks the overwrite if backup generation fails
- `撤销覆盖操作`
  - stays disabled when neither valid backup slot exists
  - becomes enabled once at least one valid backup slot exists
  - opens one chooser with separate browser and draft recovery targets
- chooser targets
  - stay independently enabled or disabled based on their matching slot validity
  - use object-specific Chinese disabled copy when unavailable
- browser-target recovery
  - uses a dedicated recovery confirmation prompt
  - keeps the `Ctrl+Z` warning explicit
  - does not reuse the shared overwrite-confirmation wording from `T09A`

## Gate Cases

### App interaction gate

1. Good: confirming browser-to-draft overwrite writes `latest-draft-backup` before browser read begins
2. Good: confirming draft-to-browser sync writes `latest-browser-backup` before browser mutation begins
3. Good: at least one valid backup slot enables `撤销覆盖操作` and opens one chooser with both target rows
4. Base: when only one target has a valid backup, the missing target stays disabled with object-specific Chinese copy
5. Bad boundary: browser-target recovery uses a dedicated confirmation prompt with explicit `Ctrl+Z` warning instead of reusing the shared overwrite dialog

### Deferred boundary

1. Deferred to implementation follow-up inside `T09B`: readable error plus expandable technical detail on backup-write failure
2. Deferred to later WebDAV tasks: remote-version restore recovery variants
3. Deferred to later verification/closeout tasks: real Chrome runtime manual overwrite-and-recovery walkthrough

## Planned Automated Gate

- `src/app/App.localBackupRecovery.test.tsx`
- Command: `pnpm test -- --run src/app/App.localBackupRecovery.test.tsx`

## Verification

- Automated gate command: `pnpm test -- --run src/app/App.localBackupRecovery.test.tsx`
- Expected current phase result after writing tests only: `fail`
- Manual Chrome extension verification remains deferred until implementation exists
