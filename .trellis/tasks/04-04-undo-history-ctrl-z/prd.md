# Implement Undo History And Ctrl Z

## Goal
Implement draft-only undo history and keyboard undo semantics for local editing actions.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T07B`
- 功能依赖任务：`T06`
- 串行前序任务：`T07A`
- 主要设计输入：`design/ODD.md`, `design/specs/history-and-recovery.md`

## In Scope
- Draft history recording
- Ctrl+Z behavior
- Alignment with operation-hint semantics

## Out Of Scope
- No browser overwrite undo
- No WebDAV restore
- No full sync rollback

## Start Conditions
- `T06` editing actions are stable enough to define history events
- `T07A` has completed `test-first -> implement -> check` closeout
- `T07B` is explicitly selected as the next and only execution task

## Waiting Conditions
- Wait for basic editing action model to stabilize
- Wait until `T07A` is closed out in the frozen serial chain

## Requirements
- Undo must affect draft state only
- Undo storage must align with the frozen hybrid checkpoint strategy

## Acceptance Criteria
- [ ] Ctrl+Z restores prior draft states consistently
- [ ] Undo does not cross the boundary into browser or cloud state

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - history reducer tests
  - keyboard interaction tests

## Technical Notes
- Keep undo semantics separate from overwrite or restore semantics
