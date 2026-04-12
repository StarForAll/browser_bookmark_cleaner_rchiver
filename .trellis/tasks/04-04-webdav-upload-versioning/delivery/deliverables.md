# T11 Deliverables

## Code

- WebDAV JSON document adapter with collection probe/create handling
- WebDAV upload/version-retention orchestration
- app-shell upload execution and status-history integration
- runtime host-permission inspection and refresh after external revocation
- updated WebDAV data-root resolution for `bookmark-extension-data`

## Tests

- `src/adapters/webdav/jsonDocument.test.ts`
- `src/adapters/webdav/requestHostPermission.test.ts`
- `src/features/webdav/application/uploadVersionedSnapshot.test.ts`
- `src/app/App.webdavAvailabilityGate.test.tsx`
- `src/app/App.webdavUploadFlow.test.tsx`

## Task Artifacts

- `test-first.md`
- `check.md`
- `finish-work-checklist.md`
- `review-gate/review-gate-round-1.md`
- `review-gate/reviewer-commands-round-1.md`
- `delivery/test-report.md`
- `delivery/acceptance.md`
- `delivery/deliverables.md`
- `delivery/transfer-checklist.md`
- `delivery/retrospective.md`
- `tmp/multi-cli-review/webdav-upload-versioning/summary-round-1.md`
- `tmp/multi-cli-review/webdav-upload-versioning/action.md`

## Commit

- human commit: `not yet available` in this delivery round

## Residual Risks

- `pnpm sonar` not executed in this round
- provider compatibility is validated against the currently tested provider behavior set, not the full WebDAV ecosystem
- runtime permission refresh still relies on startup / focus / visibility triggers rather than browser-pushed permission change events
