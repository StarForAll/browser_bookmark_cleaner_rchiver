# T09A Test-First Gate

## Goal

Freeze the executable confirmation gate for `T09A` before implementation.

## Scope

- Shared confirmation dialog for overwrite-risk browser actions
- Browser-to-draft overwrite entry availability and wording
- Draft-to-browser sync entry availability and wording
- Cancel path stays side-effect free

## Out Of Scope In This Gate

- Pre-overwrite local backup generation
- Undo-overwrite recovery entry and target chooser
- WebDAV upload or restore flows

These boundaries belong to downstream tasks, especially `T09B`.

## Planned Contract

App-level confirmation state must distinguish at least:

```ts
type OverwriteConfirmationAction =
  | 'overwrite-draft-from-browser'
  | 'sync-draft-to-browser';
```

Expected behavior:

- `overwrite-draft-from-browser`
  - stays available even when the current draft is empty
  - opens the shared confirmation dialog with browser-to-draft wording
- `sync-draft-to-browser`
  - stays disabled when no editable draft exists
  - becomes available once an editable draft exists
  - opens the shared confirmation dialog with draft-to-browser wording
- cancel closes the dialog without starting browser read or browser write side effects

## Gate Cases

### App interaction gate

1. Good: overwrite-from-browser stays enabled before any draft snapshot exists and opens the shared confirmation dialog
2. Base: sync-to-browser stays disabled while there is no editable draft
3. Good: sync-to-browser becomes enabled after startup restores a draft and opens the same confirmation surface with action-specific wording
4. Bad boundary: cancel on either path closes the dialog and does not trigger browser bookmark read/write calls

### Deferred boundary

1. Deferred to `T09B`: pre-overwrite local backup generation
2. Deferred to `T09B`: undo-overwrite recovery target availability
3. Deferred to later WebDAV tasks: cloud restore confirmation variants

## Verification

- Automated gate command: `pnpm test`
- Expected current phase result after writing tests only: `fail`
- Manual Chrome extension verification remains deferred until implementation exists
