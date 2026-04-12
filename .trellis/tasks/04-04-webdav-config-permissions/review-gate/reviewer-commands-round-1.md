# Reviewer Commands Round 1

## Task Summary

- Task: `T10` / `webdav-config-permissions`
- Goal: review WebDAV configuration, host-permission handling, and availability gating only
- Out of scope: upload execution, restore list loading, restore execution, version retention

## Review Focus

- runtime permission request correctness
- sensitive config persistence safety
- repeated failure history ordering and display semantics
- boundary discipline for `T10`

## Target Paths

- `public/manifest.json`
- `src/adapters/local-persistence/contracts.ts`
- `src/adapters/local-persistence/webdavConfig.ts`
- `src/adapters/webdav/requestHostPermission.ts`
- `src/adapters/webdav/testAvailability.ts`
- `src/features/webdav/application/availability.ts`
- `src/app/App.tsx`
- `src/shared/copy/appShell.ts`
- `src/app/App.webdavAvailabilityGate.test.tsx`
- `.trellis/tasks/04-04-webdav-config-permissions/check.md`

## Copy-Paste Reviewer Command

```text
/multi-cli-review "Review T10 WebDAV configuration, runtime host permission, sensitive config persistence, and status-history ordering for correctness, scope drift, and security issues. Do not modify code." public/manifest.json src/adapters/local-persistence/contracts.ts src/adapters/local-persistence/webdavConfig.ts src/adapters/webdav/requestHostPermission.ts src/adapters/webdav/testAvailability.ts src/features/webdav/application/availability.ts src/app/App.tsx src/shared/copy/appShell.ts src/app/App.webdavAvailabilityGate.test.tsx .trellis/tasks/04-04-webdav-config-permissions/check.md --task-dir tmp/multi-cli-review/webdav-config-permissions --reviewer-id reviewer-a --round 1 --review-focus "permissions, sensitive config, status history, task-scope boundaries"
```

## Expected Output

- reviewer report path: `tmp/multi-cli-review/webdav-config-permissions/review-round-1/reviewer-a.md`
