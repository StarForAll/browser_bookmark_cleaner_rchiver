# Finish Work Checklist

## 1. Code Quality

- [x] Project verification commands are already frozen for the current architecture
- [x] The frozen verification matrix was executed and results were recorded truthfully as `pass / fail / not run`
- [x] No `console.log` statements
- [x] No non-null assertions (`!`) introduced in task scope
- [x] No `any` types introduced in task scope

Verification status:

- `pass`: `pnpm lint`
- `pass`: `pnpm typecheck`
- `pass`: `pnpm test`
- `pass`: `pnpm build`
- `not run`: `pnpm sonar`

## 1.5. Test Coverage

- [x] New pure function / adapter logic → tests added or updated
- [x] Component / app-shell behavior change → corresponding component tests added or updated
- [x] No logic-only gap left without an explicit reason

Evidence:

- `src/adapters/webdav/jsonDocument.test.ts`
- `src/adapters/webdav/requestHostPermission.test.ts`
- `src/features/webdav/application/uploadVersionedSnapshot.test.ts`
- `src/app/App.webdavAvailabilityGate.test.tsx`
- `src/app/App.webdavUploadFlow.test.tsx`

## 2. Code-Spec Sync

- [x] Relevant frontend / design docs updated for the fixed WebDAV data root and upload contract
- [x] Cross-layer contract docs remain executable rather than principle-only
- [x] No Trellis multi-directory sync required for this task scope

Updated docs:

- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/IDD.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/ODD.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/webdav-sync.md`
- `.trellis/tasks/04-04-webdav-upload-versioning/test-first.md`
- `.trellis/tasks/04-04-webdav-upload-versioning/check.md`

## 2.2. Parent / Child Task Record Sync

- [ ] Parent `task_plan.md` / `task.json` sync is ready for the post-commit closeout round, but not executed yet

Note:

- This command does not archive the child task or update parent frontier records.
- Parent progress sync remains a close-out phase responsibility after human commit.

## 2.5. Code-Spec Hard Block (Infra/Cross-Layer)

- [x] Spec content is executable (real paths / contracts / payloads)
- [x] Includes file paths + contract names + payload structure
- [x] Includes validation and error matrix in design / task docs
- [x] Includes Good / Base / Bad style assertion coverage through tests and docs
- [x] Includes required tests and assertion points

## 3. API Changes

- [x] No API endpoint changes in this task scope

## 4. Database Changes

- [x] No database or migration changes in this task scope

## 5. Cross-Layer Verification

- [x] Data flows correctly across app shell, permission adapter, WebDAV adapter, and upload orchestration
- [x] Error handling remains explicit at each boundary
- [x] Types are consistent across layers
- [x] Loading / running-state gating remains enforced through single external-action lock

## 6. Manual Testing

- [ ] Feature works in real Chrome extension runtime
- [ ] Edge cases tested manually against the latest provider-specific compatibility fixes
- [ ] Error states tested manually after the latest permission-refresh fix
- [ ] Works after page refresh in real runtime

Current manual status:

- `not run`: latest Chrome + real WebDAV manual verification

## Finish-Work Result

- Task-level pre-commit checklist is **ready with manual verification pending**
- No blocking automated-quality issue remains
- Before human commit, recommended next step is one focused manual validation pass for:
  - upload draft
  - upload browser bookmarks
  - revoke host permission externally and verify buttons disable after returning to the page
