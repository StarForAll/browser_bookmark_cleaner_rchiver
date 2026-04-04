# Implement WebDAV Browser Restore

## Goal
Restore a selected WebDAV browser snapshot back into browser bookmarks with explicit confirmation and local backup protection.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T12B`
- 依赖任务：`T11`, `T09B`
- 主要设计输入：`design/ODD.md`, `design/specs/webdav-sync.md`, `design/specs/history-and-recovery.md`, `design/pages/restore-version.md`

## In Scope
- Restore selected browser snapshot to browser bookmarks
- Pre-restore local backup
- Browser restore confirmation flow

## Out Of Scope
- No draft restore in this task

## Start Conditions
- `T11` cloud snapshot semantics exist
- `T09B` local backup and undo-overwrite boundary exists

## Waiting Conditions
- Wait for both cloud versioning and browser-risk local backup boundary

## Requirements
- Browser restore must be treated as a high-risk overwrite action
- Restore target and confirmation text must remain explicit

## Acceptance Criteria
- [ ] Browser snapshot can be restored with explicit confirmation
- [ ] Local backup is taken before browser restore

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - restore-to-browser tests
  - manual browser restore walkthrough

## Technical Notes
- This task has higher blast radius than draft restore and must stay separate
