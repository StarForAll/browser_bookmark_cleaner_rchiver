# Implement Browser Overwrite And Sync Confirmation

## Goal
Implement explicit confirmation-driven browser overwrite and sync flows across draft and browser bookmark state.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T09A`
- 功能依赖任务：`T08B`
- 串行前序任务：`T08B`
- 主要设计输入：`design/specs/draft-browser-sync.md`, `design/specs/browser-draft-overwrite.md`, `design/pages/overwrite-confirmation.md`

## In Scope
- Confirm-before-overwrite flow
- Draft-to-browser sync flow
- Browser-to-draft overwrite flow

## Out Of Scope
- No local backup undo entry
- No WebDAV restore or upload

## Start Conditions
- `T08B` feedback and disabled-state infrastructure is stable
- `T08B` has completed `test-first -> implement -> check` closeout
- `T09A` is explicitly selected as the next and only execution task

## Waiting Conditions
- Wait for system action feedback semantics to exist
- Wait until `T08B` is closed out in the frozen serial chain

## Requirements
- All overwrite-risk actions must pass through one shared confirmation pattern
- Browser mutations must remain explicit rather than incidental

## Acceptance Criteria
- [ ] Browser-risk actions always require confirmation
- [ ] Sync direction is explicit to the user

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - sync action tests
  - manual overwrite confirmation walkthrough

## Technical Notes
- This task introduces browser mutation but not local rollback semantics
