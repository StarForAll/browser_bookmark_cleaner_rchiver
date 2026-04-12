# Reviewer Commands Round 1

## Task Summary

- Task: `T11` / `webdav-upload-versioning`
- Goal: review WebDAV upload/version-retention execution plus runtime permission refresh after external revocation
- Out of scope: restore list loading, restore execution, multi-profile management

## Review Focus

- runtime permission refresh correctness
- WebDAV collection probe/create and endpoint normalization safety
- sensitive persisted config / permission-state synchronization
- scope discipline for `T11`

## Target Paths

- `src/adapters/webdav/jsonDocument.ts`
- `src/adapters/webdav/jsonDocument.test.ts`
- `src/adapters/webdav/requestHostPermission.ts`
- `src/adapters/webdav/requestHostPermission.test.ts`
- `src/features/webdav/application/uploadVersionedSnapshot.ts`
- `src/features/webdav/application/uploadVersionedSnapshot.test.ts`
- `src/app/App.tsx`
- `src/app/App.webdavAvailabilityGate.test.tsx`
- `src/app/App.webdavUploadFlow.test.tsx`
- `src/shared/copy/appShell.ts`
- `.trellis/tasks/04-04-webdav-upload-versioning/check.md`
- `.trellis/tasks/04-04-webdav-upload-versioning/test-first.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/webdav-sync.md`

## Copy-Paste Reviewer Command

```text
/multi-cli-review "Review T11 WebDAV upload execution, provider-compatibility handling, runtime permission refresh after external revocation, and scope boundaries for correctness and regression risk. Do not modify code." src/adapters/webdav/jsonDocument.ts src/adapters/webdav/jsonDocument.test.ts src/adapters/webdav/requestHostPermission.ts src/adapters/webdav/requestHostPermission.test.ts src/features/webdav/application/uploadVersionedSnapshot.ts src/features/webdav/application/uploadVersionedSnapshot.test.ts src/app/App.tsx src/app/App.webdavAvailabilityGate.test.tsx src/app/App.webdavUploadFlow.test.tsx src/shared/copy/appShell.ts .trellis/tasks/04-04-webdav-upload-versioning/check.md .trellis/tasks/04-04-webdav-upload-versioning/test-first.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/webdav-sync.md --task-dir tmp/multi-cli-review/webdav-upload-versioning --reviewer-id reviewer-a --round 1 --review-focus "permissions, webdav provider behavior, persisted state sync, T11 scope boundaries"
```
