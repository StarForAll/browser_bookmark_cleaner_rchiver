# Implement Search And Duplicate Focus

## Goal
Enable search and duplicate URL focus flows over the current draft graph.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T08A`
- 功能依赖任务：`T07A`, `T07B`
- 串行前序任务：`T07B`
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
- `T07B` has completed `test-first -> implement -> check` closeout
- `T08A` is explicitly selected as the next and only execution task

## Waiting Conditions
- Wait for core graph mutation and history semantics to settle
- Wait until `T07B` is closed out in the frozen serial chain

## Requirements
- Duplicate detection must use exact URL equality
- Search and duplicate filters must compose predictably

## Acceptance Criteria
- [x] Users can locate nodes by title or URL
- [x] Duplicate URL focus is clear and accurate

## Verification Plan
- Task-local gates:
  - `pnpm test -- src/app/App.searchFocus.test.tsx` -> `pass`
  - `pnpm test -- src/features/bookmark-graph/state/searchAndFocus.test.ts` -> `pass`
  - `pnpm test -- src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx` -> `pass`
- Repository-level matrix:
  - `pnpm lint` -> `pass`
  - `pnpm typecheck` -> `pass`
  - `pnpm test` -> `pass`
  - `pnpm build` -> `pass`
  - `pnpm sonar` -> `pass`
- Manual search / duplicate focus walkthrough in the real extension page:
  - `pass (human-reported on 2026-04-08)`

## Current Status

- `T08A` implementation is active and automated verification is green
- real extension manual search / duplicate focus walkthrough has been reported complete
- current mixed workspace has been explicitly accepted by the user as the overall closeout boundary for commit
- search title / URL matching now derives from the current draft graph without using path text or internal IDs
- duplicate-only mode now composes with search and switches the workspace to a duplicate-focused presentation
- duplicate hover cards now show duplicate count, the default two human-readable paths, and inline `展开更多`

## Technical Notes
- This task should remain focused on discovery rather than global action feedback
