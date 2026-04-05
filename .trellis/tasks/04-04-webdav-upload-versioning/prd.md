# Implement WebDAV Upload And Version Retention

## Goal
Implement cloud upload flows and version-retention management for draft and browser snapshots.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T11`
- 功能依赖任务：`T10`, `T05`
- 串行前序任务：`T10`
- 主要设计输入：`design/ODD.md`, `design/specs/webdav-sync.md`

## In Scope
- Draft snapshot upload
- Browser snapshot upload
- Index manifest and retention to latest five versions

## Out Of Scope
- No restore execution
- No multi-profile cloud management

## Start Conditions
- `T10` availability gating is complete
- `T05` stable draft and browser snapshot objects exist
- `T10` has completed `test-first -> implement -> check` closeout
- `T11` is explicitly selected as the next and only execution task

## Waiting Conditions
- Wait for both cloud capability gating and stable snapshot object model
- Wait until `T10` is closed out in the frozen serial chain

## Requirements
- Draft and browser snapshots must remain separated by storage contract
- Version retention must be deterministic and bounded

## Acceptance Criteria
- [ ] Draft and browser uploads are stored under separate retained version sets
- [ ] Retention policy keeps only the latest five versions per object type

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - upload and manifest tests
  - retention pruning tests

## Technical Notes
- This task should not absorb restore semantics
