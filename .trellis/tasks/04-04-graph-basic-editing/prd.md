# Implement Graph Basic Editing

## Goal
Enable baseline draft editing interactions including selection, editing, child creation, and deletion.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T06`
- 依赖任务：`T05`
- 主要设计输入：`design/AID.md`, `design/pages/node-editor.md`, `design/specs/bookmark-graph.md`

## In Scope
- Selection state
- Double-click edit flow
- Create-child flow
- Delete node and subtree flow

## Out Of Scope
- No drag move
- No undo history
- No browser writeback

## Start Conditions
- `T05` import-to-draft flow is stable

## Waiting Conditions
- Wait for an editable draft graph to exist

## Requirements
- All edits must target draft state only
- Node-type and parent-child constraints must remain valid

## Acceptance Criteria
- [ ] Basic draft editing flow is complete
- [ ] No edit action directly touches browser bookmark state

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - component and interaction tests
  - manual graph editing walkthrough

## Technical Notes
- This task intentionally excludes high-complexity state history concerns
- Prompt area semantics should remain compatible with later tasks
