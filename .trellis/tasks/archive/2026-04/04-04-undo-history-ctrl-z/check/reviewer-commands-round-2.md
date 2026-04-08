# Reviewer Commands — Round 2

## Task Summary

- Task: `T07B / 04-04-undo-history-ctrl-z`
- Goal: re-validate the round-1 follow-up after fixing the T03 shell portal gate and refreshing T07B check artifacts
- Important closeout context:
  - T07B targeted tests are green
  - shell regression pack is green after updating `src/extensionShellPageEntry.test.tsx`
  - full-repo `pnpm test` is still red only because `T08A` remains unfinished in:
    - `src/app/App.searchFocus.test.tsx`
    - `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
    - `src/features/bookmark-graph/state/searchAndFocus.test.ts`
  - full-repo `pnpm typecheck` is still red only because `T08A` lacks `src/features/bookmark-graph/state/searchAndFocus.ts`

## Review Focus

1. Verify the T03 shell test update correctly follows the current portal + hidden overlay contract
2. Verify round-1 `summary/action/self-review` now state the repo-level blocker boundary truthfully
3. Verify no hidden T07B defect is being misclassified as a `T08A` blocker

## Key Files

- `src/extensionShellPageEntry.test.tsx`
- `src/app/App.tsx`
- `src/app/App.undoHistory.test.tsx`
- `src/app/App.startup.test.tsx`
- `src/app/App.searchFocus.test.tsx`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
- `src/features/bookmark-graph/state/searchAndFocus.test.ts`
- `.trellis/tasks/04-04-undo-history-ctrl-z/self-review.md`
- `tmp/multi-cli-review/04-04-undo-history-ctrl-z/summary-round-1.md`
- `tmp/multi-cli-review/04-04-undo-history-ctrl-z/action.md`

## Task Dir

- `tmp/multi-cli-review/04-04-undo-history-ctrl-z`
- Round: `2`

## Reviewer Allocation

- Reviewer A: `claude`
- Reviewer B: `opencode`

## Commands

### Claude

```text
/multi-cli-review "Review the round-1 follow-up for T07B after the shell portal-gate repair. Focus on src/extensionShellPageEntry.test.tsx, src/app/App.tsx, src/app/App.undoHistory.test.tsx, src/app/App.startup.test.tsx, src/app/App.searchFocus.test.tsx, src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx, src/features/bookmark-graph/state/searchAndFocus.test.ts, .trellis/tasks/04-04-undo-history-ctrl-z/self-review.md, tmp/multi-cli-review/04-04-undo-history-ctrl-z/summary-round-1.md, and tmp/multi-cli-review/04-04-undo-history-ctrl-z/action.md. Check whether the shell test update matches the portal plus hidden overlay DOM contract, whether repo-level pnpm test/typecheck blockers are now truthfully attributed only to active T08A gates, and whether any remaining T07B defect is being masked by that wording." . --task-dir tmp/multi-cli-review/04-04-undo-history-ctrl-z --reviewer-id claude --round 2 --review-focus "shell portal gate correctness, blocker attribution truthfulness, hidden T07B drift"
```

### OpenCode

```text
/multi-cli-review "Review the round-1 follow-up for T07B after the shell portal-gate repair. Focus on src/extensionShellPageEntry.test.tsx, src/app/App.tsx, src/app/App.undoHistory.test.tsx, src/app/App.startup.test.tsx, src/app/App.searchFocus.test.tsx, src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx, src/features/bookmark-graph/state/searchAndFocus.test.ts, .trellis/tasks/04-04-undo-history-ctrl-z/self-review.md, tmp/multi-cli-review/04-04-undo-history-ctrl-z/summary-round-1.md, and tmp/multi-cli-review/04-04-undo-history-ctrl-z/action.md. Check whether the shell test update matches the portal plus hidden overlay DOM contract, whether repo-level pnpm test/typecheck blockers are now truthfully attributed only to active T08A gates, and whether any remaining T07B defect is being masked by that wording." . --task-dir tmp/multi-cli-review/04-04-undo-history-ctrl-z --reviewer-id opencode --round 2 --review-focus "test-gate drift, check-artifact accuracy, misattributed blocker risk"
```

## Preconditions

- Current coordinator CLI already has `multi-cli-review-action` available in the project skill inventory.
- Target reviewer CLI must also have `multi-cli-review` available before running the commands above.
