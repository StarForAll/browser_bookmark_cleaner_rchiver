# Implement Search And Duplicate Focus

## Goal
Enable search and duplicate URL focus flows over the current draft graph.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T08A`
- 依赖任务：`T07A`, `T07B`
- 主要设计输入：`design/specs/search-and-focus.md`, `design/pages/workspace.md`

## In Scope
- Title and URL search
- Duplicate-only mode
- Duplicate focus and hover info

## Out Of Scope
- No status history panel
- No cloud disabled-state explanation

## Start Conditions
- `T07A` and `T07B` are stable enough that search does not fight shared state boundaries

## Waiting Conditions
- Wait for core graph mutation and history semantics to settle

## Requirements
- Duplicate detection must use exact URL equality
- Search and duplicate filters must compose predictably

## Acceptance Criteria
- [ ] Users can locate nodes by title or URL
- [ ] Duplicate URL focus is clear and accurate

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - search state tests
  - duplicate detection tests
  - manual focus walkthrough

## Technical Notes
- This task should remain focused on discovery rather than global action feedback
