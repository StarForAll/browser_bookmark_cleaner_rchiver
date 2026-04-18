# Finish Work Checklist

## 1. Code Quality

- [x] Project verification commands are already frozen for the current architecture
- [x] The frozen verification matrix was executed and results were recorded truthfully as `pass / fail / not run`
- [x] No `console.log` statements introduced in task scope
- [x] No non-null assertions (`!`) introduced in task scope
- [x] No `any` types introduced in task scope

Verification status:

- `pass`: `pnpm lint`
- `pass`: `pnpm typecheck`
- `pass`: `pnpm test`
- `pass`: `pnpm build`
- `not run`: `pnpm sonar`

## 1.5. Test Coverage

- [x] Workspace-entry message-handling logic changes have matching unit tests
- [x] No UI behavior change was left without automated coverage in the touched scope
- [x] Repository-level test-gate drift caused by archived design-doc paths is now covered by the updated `src/uiReferenceConstraints.test.ts`

Evidence:

- `src/features/workspace-entry/application/actionWorkspaceServiceWorker.test.ts`
- `src/features/workspace-entry/application/registerWorkspaceActionTarget.test.ts`
- `src/uiReferenceConstraints.test.ts`

## 2. Code-Spec Sync

- [x] Relevant frontend spec text was updated for the fixed runtime messaging contract
- [x] Cross-layer contract details remain executable rather than principle-only
- [x] No Trellis multi-directory sync is required for this task scope

Updated docs:

- `.trellis/spec/frontend/browser-import-startup.md`
- `.trellis/tasks/04-14-fix-workspace-action-message-channel/check.md`

## 2.2. Parent / Child Task Record Sync

- [x] This task has no parent coordinator task that requires frontier sync

## 2.5. Code-Spec Hard Block (Infra/Cross-Layer)

- [x] Spec content is executable with concrete message type, storage key, and response contract
- [x] Includes file paths, payload fields, and error behavior
- [x] Includes validation and error matrix in the updated frontend spec
- [x] Includes Good / Base / Bad cases through spec plus tests
- [x] Includes required tests and assertion points

## 3. API Changes

- [x] No external API endpoint changes in this task scope

## 4. Database Changes

- [x] No database or migration changes in this task scope

## 5. Cross-Layer Verification

- [x] Data flows correctly across workspace page, runtime messaging, service worker, and `chrome.storage.session`
- [x] Error handling remains explicit at each boundary
- [x] Types are consistent across layers
- [x] Action-click fallback behavior remains covered by existing tests

## 6. Manual Testing

- [ ] Feature works in real Chrome extension runtime
- [ ] Edge cases tested in a fresh Chrome MV3 session
- [ ] Error states tested manually in the extension console/runtime
- [ ] Works after reopening the workspace page in real runtime

Current manual status:

- `not run`: fresh Chrome extension verification for action-icon open/focus and startup message-channel behavior

## Finish-Work Result

- Task-level pre-commit checklist is **ready with manual verification pending**
- No blocking automated-quality issue remains
- Before human commit, recommended manual checks are:
  - click the extension action icon with no workspace tab open and confirm one workspace tab opens
  - click the action icon again with the workspace tab already open and confirm the existing tab is focused instead of duplicated
  - confirm the previous `message channel closed before a response was received` error no longer appears during workspace startup
