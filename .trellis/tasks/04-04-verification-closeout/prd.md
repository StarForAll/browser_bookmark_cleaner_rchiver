# Run Verification And Prepare Closeout

## Goal
Run the final verification matrix, perform human acceptance, and prepare the task for finish-work and record-session.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T13`
- 依赖任务：`T03` 至 `T12B`
- 主要设计输入：全部主设计文档、后续实现结果、验证结果

## In Scope
- Local automated verification matrix
- Manual Chrome extension acceptance walkthrough
- Required document and spec write-back
- Finish-work and record-session preparation

## Out Of Scope
- No new feature implementation
- No silent scope expansion to hide verification failures

## Start Conditions
- All execution tasks are complete

## Waiting Conditions
- Wait for the full product chain to exist

## Requirements
- All verification results must be recorded truthfully as pass, fail, or not run
- Manual acceptance must cover at least one full main flow

## Acceptance Criteria
- [ ] Verification matrix is recorded truthfully
- [ ] Closeout artifacts are ready for finish-work and record-session

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - manual Chrome acceptance walkthrough

## Technical Notes
- Verification failure should trigger follow-up work rather than silent patching inside closeout
