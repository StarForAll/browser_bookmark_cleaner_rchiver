# Implement WebDAV Configuration And Permissions

## Goal
Implement WebDAV settings, host permission handling, and capability gating for cloud actions.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T10`
- 功能依赖任务：`T08B`
- 串行前序任务：`T09B`
- 主要设计输入：`design/IDD.md`, `design/specs/webdav-sync.md`, `design/pages/webdav-settings.md`

## In Scope
- WebDAV configuration storage
- Host permission request and status
- Connectivity test and capability gating

## Out Of Scope
- No upload versioning
- No restore execution

## Start Conditions
- `T08B` disabled-state explanation infrastructure exists
- `T09B` has completed `test-first -> implement -> check` closeout
- `T10` is explicitly selected as the next and only execution task

## Waiting Conditions
- Wait for global disabled-state explanation channel to exist
- Wait until `T09B` is closed out in the frozen serial chain

## Requirements
- Host permission should be requested on demand
- Cloud actions must remain globally disabled when config or permission is invalid

## Acceptance Criteria
- [ ] WebDAV availability can be determined explicitly
- [ ] Cloud actions remain gated behind valid config and permission

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - settings and permission tests
  - connectivity smoke test

## Technical Notes
- This task defines cloud availability boundaries before transport actions
