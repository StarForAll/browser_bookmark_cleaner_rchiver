# Create Extension Shell And Page Entry

## Goal
Create the manifest, page entry, and app assembly shell needed to host later bookmark-cleaner functionality.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T03`
- 依赖任务：`T01`
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

## Waiting Conditions
- Wait for engineering baseline to exist as the real project foundation

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
