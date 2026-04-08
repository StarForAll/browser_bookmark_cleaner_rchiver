# Review Gate — Round 2

## Task

- Task dir: `.trellis/tasks/04-04-undo-history-ctrl-z`
- Task id: `04-04-undo-history-ctrl-z`
- Round: `2`
- Decision: `required`

## Inputs Reviewed

- `.trellis/tasks/04-04-undo-history-ctrl-z/self-review.md`
- `.trellis/tasks/04-04-undo-history-ctrl-z/check/review-gate-round-1.md`
- `.trellis/tasks/04-04-undo-history-ctrl-z/check/reviewer-commands-round-1.md`
- `tmp/multi-cli-review/04-04-undo-history-ctrl-z/summary-round-1.md`
- `tmp/multi-cli-review/04-04-undo-history-ctrl-z/action.md`
- current follow-up paths:
  - `src/extensionShellPageEntry.test.tsx`
  - `src/app/App.undoHistory.test.tsx`
  - `src/app/App.startup.test.tsx`
  - `src/app/App.searchFocus.test.tsx`
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
  - `src/features/bookmark-graph/state/searchAndFocus.test.ts`

## Gate Reasoning

### Hard conditions hit

1. User explicitly requested another third-party validation round
   - this alone upgrades the gate to `required`
2. Cross-task blocker attribution must stay exact
   - round-1 follow-up changed both test gates and check artifacts, so a fresh reviewer should verify that repo-level red status is now truthfully attributed only to `T08A`

### Soft conditions hit

1. Post-review delta exists
   - after round 1, the coordinator fixed an additional T03 shell test drift in `src/extensionShellPageEntry.test.tsx`
   - that drift was discovered only during repo-level revalidation, so a second reviewer pass is valuable
2. Verification remains asymmetric
   - targeted T07B gates plus shell regression gates are green
   - full-repo `pnpm test` / `pnpm typecheck` are still red because `T08A` is unfinished
3. Closeout wording still matters
   - `T07B` is in `check` phase and must not be overstated as repo-wide green while external blockers remain active

## Capability Check

- Current CLI capability confirmed:
  - `multi-cli-review-action`
- Reviewer capability required:
  - `multi-cli-review`
- Default reviewer set selected:
  - `claude`
  - `opencode`

## Review Focus

1. Confirm the T03 shell test update matches the current portal + hidden-overlay DOM contract without weakening the intended shell assertions.
2. Confirm `self-review.md`, `summary-round-1.md`, and `action.md` now describe the verification boundary truthfully:
   - `pnpm test` is only blocked by active `T08A` tests
   - `pnpm typecheck` is only blocked by active `T08A` module/type gaps
3. Confirm no new T07B implementation defect is being masked by the new wording or by the shell test drift fix.

## Output Paths

- Reviewer command pack:
  - `.trellis/tasks/04-04-undo-history-ctrl-z/check/reviewer-commands-round-2.md`
- Reviewer reports:
  - `tmp/multi-cli-review/04-04-undo-history-ctrl-z/review-round-2/claude.md`
  - `tmp/multi-cli-review/04-04-undo-history-ctrl-z/review-round-2/opencode.md`
