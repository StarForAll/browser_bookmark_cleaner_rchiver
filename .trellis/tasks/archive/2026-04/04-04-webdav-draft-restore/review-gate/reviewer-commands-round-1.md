# Reviewer Commands Round 1

## Task Summary

- Task: `T12A` / `webdav-draft-restore`
- Goal: review WebDAV draft restore execution, backup-before-restore safety, and shared app-shell gating changes
- Out of scope: browser-bookmark restore execution, multi-profile WebDAV management, acceptance closeout

## Review Focus

- restore ordering and fail-closed behavior
- WebDAV draft-only restore boundary and newest-first list rendering
- persisted backup artifact safety and status-history correctness
- scope discipline for `T12A`

## Target Paths

- `src/features/webdav/application/restoreVersionedSnapshot.ts`
- `src/features/webdav/application/restoreVersionedSnapshot.test.ts`
- `src/app/App.tsx`
- `src/app/App.webdavDraftRestoreFlow.test.tsx`
- `src/app/App.webdavAvailabilityGate.test.tsx`
- `src/app/app.css`
- `src/shared/copy/appShell.ts`
- `src/adapters/local-persistence/localBackupArtifacts.ts`
- `.trellis/tasks/04-04-webdav-draft-restore/check.md`
- `.trellis/tasks/04-04-webdav-draft-restore/test-first.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/webdav-sync.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/restore-version.md`

## Copy-Paste Reviewer Command

```text
/multi-cli-review "Review T12A WebDAV draft restore execution, backup-before-restore ordering, newest-first restore list rendering, shared app-shell gating changes, and scope boundaries for correctness and regression risk. Do not modify code." src/features/webdav/application/restoreVersionedSnapshot.ts src/features/webdav/application/restoreVersionedSnapshot.test.ts src/app/App.tsx src/app/App.webdavDraftRestoreFlow.test.tsx src/app/App.webdavAvailabilityGate.test.tsx src/app/app.css src/shared/copy/appShell.ts src/adapters/local-persistence/localBackupArtifacts.ts .trellis/tasks/04-04-webdav-draft-restore/check.md .trellis/tasks/04-04-webdav-draft-restore/test-first.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/webdav-sync.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/restore-version.md --task-dir tmp/multi-cli-review/webdav-draft-restore --reviewer-id reviewer-a --round 1 --review-focus "restore ordering, webdav boundary, persisted backup safety, T12A scope discipline"
```
