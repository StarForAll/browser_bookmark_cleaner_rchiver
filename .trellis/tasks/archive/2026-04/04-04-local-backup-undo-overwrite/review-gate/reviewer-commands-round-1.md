# Reviewer Commands Round 1

## Task Summary

- Task: `T09B` / `local-backup-undo-overwrite`
- Round: `1`
- Gate decision: `required`
- Reviewer count: `1`
- Reviewer id: `reviewer-1`

## Review Focus

- browser bookmark write / rollback correctness
- external-action running lock and serialized side effects
- undo-overwrite chooser + recovery confirmation boundary
- missed regressions around status history, startup/session state, and adapter contracts

## Target Paths

- `src/app/App.tsx`
- `src/app/app.css`
- `src/shared/copy/appShell.ts`
- `src/adapters/local-persistence/localBackupArtifacts.ts`
- `src/adapters/browser-bookmarks/exportDraftToBrowserTree.ts`
- `src/adapters/browser-bookmarks/writeManagedBrowserTree.ts`
- `src/app/App.localBackupRecovery.test.tsx`
- `src/adapters/browser-bookmarks/writeManagedBrowserTree.test.ts`
- `src/app/App.overwriteConfirmation.test.tsx`
- `.trellis/tasks/04-04-local-backup-undo-overwrite/check.md`
- `.trellis/tasks/04-04-local-backup-undo-overwrite/test-first.md`

## Reviewer Instructions

- Reviewer must use `multi-cli-review`.
- Reviewer must not modify code.
- Reviewer must write only the structured report for this round.
- Reviewer should treat `check.md` as current ground truth, then look for missed defects or weak assumptions.

## Copy-Paste Command

```text
/multi-cli-review "Review T09B local backup / undo-overwrite against the frozen specs and current check report. Focus on browser write rollback correctness, external-action serialization, chooser/recovery UX contract, and missed regressions in the listed changed files. Output only a structured defect report and do not modify code." . --task-dir tmp/multi-cli-review/local-backup-undo-overwrite --reviewer-id reviewer-1 --round 1 --review-focus "浏览器写回回滚、外部动作并发锁、恢复选择器与确认边界、状态与适配器回归"
```
