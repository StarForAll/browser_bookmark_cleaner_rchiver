# Implement WebDAV Draft Restore

## Goal
Restore a selected WebDAV version into the current draft while preserving local backup safety.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T12A`
- 依赖任务：`T11`
- 主要设计输入：`design/ODD.md`, `design/specs/webdav-sync.md`, `design/specs/history-and-recovery.md`, `design/pages/restore-version.md`

## In Scope
- Restore selected cloud version into draft
- Pre-restore local backup
- Draft restore confirmation flow

## Out Of Scope
- No browser bookmark restore

## Start Conditions
- `T11` upload and version list semantics are stable

## Waiting Conditions
- Wait for cloud version objects and retention semantics to exist

## Requirements
- Restore must target draft only
- Pre-restore local safety backup must be mandatory

## Acceptance Criteria
- [ ] Cloud version can restore into draft safely
- [ ] Draft restore flow is explicit and reversible through local backup semantics

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - restore-flow tests
  - manual draft restore walkthrough

## Technical Notes
- Keep draft restore separated from browser restore because the blast radius differs
