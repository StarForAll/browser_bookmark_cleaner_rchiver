# Implement Browser Bookmark Import To Draft

## Goal
Read the browser bookmark tree and map it into the normalized local draft graph.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T05`
- 功能依赖任务：`T04`
- 串行前序任务：`T04`
- 主要设计输入：`design/IDD.md`, `design/specs/bookmark-graph.md`, `design/specs/draft-browser-sync.md`

## In Scope
- Implement Chrome bookmark adapter
- Convert browser tree to normalized draft graph
- Define startup import and restore decision flow

## Out Of Scope
- No editing interactions
- No browser overwrite or sync-back
- No WebDAV upload or restore

## Start Conditions
- `T04` contracts and persistence boundaries are stable
- `T04` has completed `test-first -> implement -> check` closeout
- `T05` is explicitly selected as the next and only execution task

## Waiting Conditions
- Wait for the normalized graph truth to exist
- Wait until `T04` is closed out in the frozen serial chain

## Requirements
- Import must preserve bookmark tree semantics while normalizing into draft truth
- Startup flow must separate first import from later draft restore

## Acceptance Criteria
- [ ] Browser bookmarks can be converted into editable draft truth
- [ ] Refresh and startup restore policy is deterministic

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - adapter tests
  - normalization tests
  - manual import smoke test

## Technical Notes
- Browser data remains input-only in this task
- Browser and draft objects must stay clearly separated
