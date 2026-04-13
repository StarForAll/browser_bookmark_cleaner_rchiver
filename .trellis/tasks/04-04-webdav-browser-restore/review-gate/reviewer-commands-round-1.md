# Reviewer Commands Round 1

## Task Summary

- Task: `T12B` / `webdav-browser-restore`
- Goal: review WebDAV browser-restore execution, browser-backup-before-overwrite safety, shared browser-writer reorder semantics, and recent bug-fix regression risk
- Out of scope: draft restore execution, acceptance closeout, multi-profile WebDAV management

## Review Focus

- browser restore overwrite safety and fail-closed behavior
- top-level bookmark order restoration correctness
- stale-id handling after remove / recreate inside the managed browser writer
- regression risk to draft-to-browser sync and local browser-backup recovery
- task boundary discipline for `T12B`

## Target Paths

- `src/adapters/browser-bookmarks/writeManagedBrowserTree.ts`
- `src/adapters/browser-bookmarks/writeManagedBrowserTree.test.ts`
- `src/features/webdav/application/restoreVersionedSnapshot.ts`
- `src/features/webdav/application/restoreVersionedSnapshot.test.ts`
- `src/app/App.tsx`
- `src/app/App.webdavBrowserRestoreFlow.test.tsx`
- `src/app/App.webdavAvailabilityGate.test.tsx`
- `src/app/App.localBackupRecovery.test.tsx`
- `src/shared/copy/appShell.ts`
- `.trellis/tasks/04-04-webdav-browser-restore/check.md`
- `.trellis/tasks/04-04-webdav-browser-restore/test-first.md`
- `.trellis/tasks/04-04-webdav-browser-restore/prd.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/webdav-sync.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/restore-version.md`

## Copy-Paste Reviewer Command

```text
/multi-cli-review "Review T12B WebDAV browser restore for correctness, regression risk, and scope discipline. Focus on backup-before-browser-overwrite ordering, restore-to-browser type-boundary enforcement, top-level bookmark reorder restoration, stale-id handling inside the managed browser writer, and whether the shared writer changes can regress sync-to-browser or local browser-backup recovery. Report findings only; do not modify code." src/adapters/browser-bookmarks/writeManagedBrowserTree.ts src/adapters/browser-bookmarks/writeManagedBrowserTree.test.ts src/features/webdav/application/restoreVersionedSnapshot.ts src/features/webdav/application/restoreVersionedSnapshot.test.ts src/app/App.tsx src/app/App.webdavBrowserRestoreFlow.test.tsx src/app/App.webdavAvailabilityGate.test.tsx src/app/App.localBackupRecovery.test.tsx src/shared/copy/appShell.ts .trellis/tasks/04-04-webdav-browser-restore/check.md .trellis/tasks/04-04-webdav-browser-restore/test-first.md .trellis/tasks/04-04-webdav-browser-restore/prd.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/webdav-sync.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/restore-version.md --task-dir tmp/multi-cli-review/webdav-browser-restore --reviewer-id reviewer-a --round 1 --review-focus "browser overwrite safety, reorder semantics, stale-id handling, shared writer regression risk, T12B scope discipline"
```
