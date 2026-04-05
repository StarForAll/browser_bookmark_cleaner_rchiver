# Reviewer Commands Round 1

## Task Summary

- Task: `T03 / Create Extension Shell And Page Entry`
- Goal: verify the MV3 extension shell and workspace placeholder UI after multiple correction rounds
- Scope: shell structure only; no bookmark API, no graph editing, no sync execution

## Review Focus

1. Frozen page-structure alignment:
   - top shell
   - search strip
   - graph canvas
   - bottom-left hint overlay
   - bottom-right status popup / reopen anchor
2. Placeholder contract alignment:
   - status popup latest-result entry shape
   - retained history placeholder shape
   - undo-overwrite disabled explanation
3. Regression risk:
   - repeated layout fixes hiding a remaining mismatch
   - tests binding to CSS structure instead of stable behavior

## Target Paths

- `src/app/App.tsx`
- `src/app/app.css`
- `src/shared/copy/appShell.ts`
- `src/extensionShellPageEntry.test.tsx`
- `.trellis/tasks/04-04-extension-shell-page-entry/self-review.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/workspace.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/status-history.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/system-states.md`

## Round Metadata

- Round: `1`
- Task dir: `tmp/multi-cli-review/04-04-extension-shell-page-entry`
- Reviewer count: `1`
- Assigned reviewer id: `claude`

## Reviewer Rules

- Reviewer must use `multi-cli-review` only.
- Reviewer must not modify code.
- Reviewer must not create directories.
- Reviewer should report only concrete defects, regression risks, or spec drift.

## Command For Other CLI

```text
/multi-cli-review "Review T03 extension shell/page-entry after repeated UI correction rounds. Focus on spec drift, placeholder-contract correctness, regression risk, and whether current tests assert the right stable behavior." src/app/App.tsx src/app/app.css src/shared/copy/appShell.ts src/extensionShellPageEntry.test.tsx .trellis/tasks/04-04-extension-shell-page-entry/self-review.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/workspace.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/status-history.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/system-states.md --task-dir tmp/multi-cli-review/04-04-extension-shell-page-entry --reviewer-id claude --round 1 --review-focus "T03 shell semantics, status placeholder contract, undo-disabled explanation, and regression-prone test assertions"
```

## Expected Output

- Reviewer report path:
  - `tmp/multi-cli-review/04-04-extension-shell-page-entry/review-round-1/claude.md`
