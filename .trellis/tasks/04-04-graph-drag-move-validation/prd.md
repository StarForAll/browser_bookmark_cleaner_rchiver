# Implement Graph Drag Move Validation

## Goal
Add drag-move interaction and folder drop validation for the draft graph.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T07A`
- 功能依赖任务：`T06`
- 串行前序任务：`T06`
- 主要设计输入：`design/AID.md`, `design/specs/bookmark-graph.md`

## In Scope
- Drag-move interaction
- Folder-only drop validation
- Structural invalid-move prevention

## Out Of Scope
- No undo history
- No browser writeback

## Start Conditions
- `T06` basic editing is stable
- `T06` has completed `test-first -> implement -> check` closeout
- `T07A` is explicitly selected as the next and only execution task

## Waiting Conditions
- Wait for base graph interaction and selection model to settle
- Wait until `T06` is closed out in the frozen serial chain

## Requirements
- Move validation must preserve graph invariants
- Invalid moves must be blocked before mutating draft state

## Acceptance Criteria
- [ ] Valid drag moves update draft structure correctly
- [ ] Invalid drops are blocked with consistent feedback

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - interaction tests for valid and invalid moves
  - manual drag-drop walkthrough

## Technical Notes
- This task focuses on structure validation rather than history semantics
