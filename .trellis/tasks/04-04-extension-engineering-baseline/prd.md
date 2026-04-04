# Create Extension Engineering Baseline

## Goal
Freeze the real extension engineering baseline, command matrix, and verification entry points for later implementation tasks.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T01`
- 依赖任务：无
- 主要设计输入：`design/TAD.md`, `PLAN-01.md`

## In Scope
- Freeze package manager, build tool, directory skeleton, and command conventions
- Freeze lint, typecheck, test, and build command expectations
- Align workflow-facing verification assumptions with the selected stack

## Out Of Scope
- No bookmark import logic
- No graph editing logic
- No WebDAV behavior

## Start Conditions
- Parent task remains in pure plan or later receives explicit execution approval for `T01`
- Stack selection is already frozen in design documents

## Waiting Conditions
- Cannot execute while current stage is still pure plan without explicit authorization

## Requirements
- Engineering baseline must be single-source and auditable
- Verification commands must be concrete rather than placeholder wording

## Acceptance Criteria
- [ ] Baseline files and command contracts are clearly defined
- [ ] Later tasks can reference one stable engineering baseline

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

## Technical Notes
- This task establishes infra boundaries only
- This task must not leak into business feature implementation
