# Create Extension Shell And Page Entry

## Goal
Create the manifest, page entry, and app assembly shell needed to host later bookmark-cleaner functionality.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T03`
- 功能依赖任务：`T01`
- 串行前序任务：`T02`
- 主要设计输入：`design/TAD.md`, `design/pages/workspace.md`

## In Scope
- Create MV3 extension shell and standalone page entry
- Create application root and top-level directory boundaries

## Out Of Scope
- No bookmark API integration
- No graph editing
- No sync or restore flows

## Start Conditions
- `T01` baseline is completed
- `T02` has completed `test-first -> implement -> check` closeout
- `T03` is explicitly selected as the next and only execution task
- The human has explicitly approved starting `T03` in the current round

## Waiting Conditions
- Wait for engineering baseline to exist as the real project foundation
- Wait until `T02` is closed out in the frozen serial chain
- Even if `T02` is closed out, `T03` must remain waiting until the human explicitly authorizes it in the current round

## Requirements
- Shell must match selected runtime topology
- Entry structure must support later feature tasks without rework

## Acceptance Criteria
- [ ] Extension page can be loaded from the extension shell
- [ ] App root and module boundaries are stable

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - `pnpm build`
  - manual Chrome load test

## Technical Notes
- This task creates runtime host boundaries only
- Shared copy and entry boundaries should be fixed here
