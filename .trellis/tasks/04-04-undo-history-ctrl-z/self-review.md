# Self Review Report — T07B Undo History And Ctrl Z

## Session Info

- Task: `04-04-undo-history-ctrl-z` (`T07B`)
- Date: `2026-04-07`
- Review Trigger: `self-review`
- Review Scope: draft-only undo history, `Ctrl+Z` restore behavior, operation hint alignment, and the follow-up canvas-floating hint/status surfaces touched during T07B closeout

## Step 1: Verification

### Self-review gate

Command:

```bash
/ops/softwares/python/bin/python3 .trellis/scripts/workflow/self-review-check.py \
  .trellis/tasks/04-04-undo-history-ctrl-z \
  --test-cmd "pnpm test" \
  --lint-cmd "pnpm lint" \
  --typecheck-cmd "pnpm typecheck"
```

Result:

- `pnpm test` -> `fail`
- `pnpm lint` -> `pass`
- `pnpm typecheck` -> `fail`

Failure source from the fresh self-review gate:

- full-repo `pnpm test` / `pnpm typecheck` are still blocked by active `T08A` red gates:
  - missing `searchAndFocus` module in [searchAndFocus.test.ts](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/features/bookmark-graph/state/searchAndFocus.test.ts#L186)
  - disabled search controls in [App.searchFocus.test.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/App.searchFocus.test.tsx#L66)
  - missing duplicate hover details in [DraftGraphWorkspace.test.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx#L1517)
- root cause remains the unfinished T08A source path itself: `src/features/bookmark-graph/state/searchAndFocus.ts` does not exist yet, so the unresolved import and follow-on type gaps are T08A implementation blockers rather than T07B regressions
- the transient shell-level portal drift discovered during `check` has already been repaired in [extensionShellPageEntry.test.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/extensionShellPageEntry.test.tsx#L33), so no non-`T08A` repo-level failure remains

### Task-local evidence

| Check | Command | Status |
|-------|---------|--------|
| T07B targeted tests | `pnpm exec vitest run src/app/App.undoHistory.test.tsx src/features/bookmark-graph/state/draftUndo.test.ts src/features/bookmark-graph/ui/DraftGraphWorkspace.undo.test.tsx src/app/App.startup.test.tsx` | `pass` |
| Floating shell regression | `pnpm exec vitest run src/extensionShellPageEntry.test.tsx src/app/App.undoHistory.test.tsx src/app/App.startup.test.tsx` | `pass` |
| Lint | `pnpm lint` | `pass` |
| Build | `pnpm build` | `pass` |
| TypeScript | `pnpm typecheck` | `fail` |
| Git diff formatting | `git diff --check` | `pass` |
| Manual Chrome draft edit / `Ctrl+Z` walkthrough | human-reported real extension walkthrough | `pass` |

## Step 2: Spec Contrast

### Finding 1 — Task metadata / PRD drift found during self-review has been closed

- Severity: `L0`
- Updated workflow evidence:
  - [task.json](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-04-undo-history-ctrl-z/task.json#L6) now marks the task as `in_progress`
  - [task.json](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-04-undo-history-ctrl-z/task.json#L18) now keeps `current_phase: 3`
  - [task.json](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-04-undo-history-ctrl-z/task.json#L50) now states the truthful check-phase status and explicitly records the `T08A` blocker
- Updated task-doc evidence:
  - [prd.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-04-undo-history-ctrl-z/prd.md#L36) acceptance boxes are now checked
  - [prd.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-04-undo-history-ctrl-z/prd.md#L40) now separates task-local green gates from repo-level `T08A` blockers
- Why this matters:
  - this finding remains in the report only as an audit trail
  - it is no longer an open deviation blocking T07B closeout wording

### Finding 2 — Full repository verification is still red, so T07B cannot yet be claimed globally green

- Severity: `L1`
- Evidence:
  - fresh self-review gate reports `pnpm test` and `pnpm typecheck` as `fail`
  - the remaining repo-level blockers are all unresolved `T08A` gates:
    - missing module contract in [searchAndFocus.test.ts](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/features/bookmark-graph/state/searchAndFocus.test.ts#L186), [searchAndFocus.test.ts](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/features/bookmark-graph/state/searchAndFocus.test.ts#L200), and [searchAndFocus.test.ts](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/features/bookmark-graph/state/searchAndFocus.test.ts#L215)
    - still-disabled App search controls in [App.searchFocus.test.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/App.searchFocus.test.tsx#L66)
    - missing duplicate hover details in [DraftGraphWorkspace.test.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx#L1517)
- Why this matters:
  - T07B-specific gates are green, but the repository-level acceptance commands required by the workflow are not
  - the correct statement is “T07B functionality is locally verified, repo-wide gate remains blocked by active T08A red tests,” not “task fully green”
  - T07B should not be held responsible for those unresolved T08A red tests

### Finding 3 — No T07B defect is being masked by the T08A blocker wording

- Severity: `L0`
- Evidence:
  - T07B-targeted validation still passes:
    - `pnpm exec vitest run src/app/App.undoHistory.test.tsx src/features/bookmark-graph/state/draftUndo.test.ts src/features/bookmark-graph/ui/DraftGraphWorkspace.undo.test.tsx src/app/App.startup.test.tsx`
    - `pnpm exec vitest run src/extensionShellPageEntry.test.tsx src/app/App.undoHistory.test.tsx src/app/App.startup.test.tsx`
  - `pnpm lint` and `pnpm build` are both green
  - repository-level `pnpm test` / `pnpm typecheck` failures are explained entirely by unfinished T08A files and tests, with no failing assertion or type error inside the T07B implementation surface
- Why this matters:
  - the blocker wording is not hiding a remaining T07B bug
  - this task is still correctly in `check`, but the outstanding repo-level red status belongs to T08A scope

## Step 3: Boundary / Sharp-Edges Check

### Security / misuse review

- No new browser-write path was introduced into draft-only undo flows
- No browser/cloud restore behavior was folded into `Ctrl+Z`; the out-of-scope boundary in [prd.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-04-undo-history-ctrl-z/prd.md#L18) remains intact
- No fail-open config, secret handling, dynamic execution, or dangerous API surface was introduced in the reviewed delta

### Behavioral boundary review

- Draft-only undo persistence is still covered by targeted gates in:
  - [draftUndo.test.ts](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/features/bookmark-graph/state/draftUndo.test.ts)
  - [DraftGraphWorkspace.undo.test.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/features/bookmark-graph/ui/DraftGraphWorkspace.undo.test.tsx)
  - [App.undoHistory.test.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/App.undoHistory.test.tsx)
- The follow-up hint/status floating overlays now match the current UI docs and are protected by App-level regression gates
- A human-reported real extension walkthrough has now been completed for the draft-only `Ctrl+Z` runtime path

## Step 4: Deviation Summary

### L0 Low Risk

1. The working tree is still mixed with unrelated active changes and `T08A` red-gate files, so later archive / closeout work must avoid conflating scopes.
2. The earlier task-metadata / PRD drift identified during self-review has now been fixed and retained here only as audit context.

### L1 Medium Risk

1. Full repository `pnpm test` and `pnpm typecheck` remain red due active `T08A` gates, so T07B cannot be presented as globally green yet.

### L2 High Risk

1. None found in this round.

## Step 5: Context Drift Check

- No evidence that this round reintroduced the earlier “`Ctrl+Z` only works when node button keeps focus” bug
- No evidence that draft-only undo now crosses into browser or WebDAV state
- Task metadata / PRD drift identified during self-review has since been synchronized to the current truthful status
- No `[Evidence Gap]` remains for targeted T07B tests, lint, build, or repository-level typecheck/test status
- No `[Evidence Gap]` remains for the core real-extension walkthrough either; that evidence is now human-reported rather than tool-captured

## Risk Level

Overall: `L1`

Reason:

- implementation-side targeted gates are green
- draft-only undo boundaries remain intact
- but repository-level acceptance is still blocked by active `T08A` red tests

## Next Step Recommendation

- Default next step: finish / archive only after either isolating T07B from the mixed worktree or clearing the remaining T08A repo-level blockers
- Before claiming T07B closeout:
  - keep the final closeout wording explicit that full-repo test/typecheck are still blocked by `T08A`
