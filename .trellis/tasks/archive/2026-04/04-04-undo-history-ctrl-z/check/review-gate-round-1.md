# Review Gate — Round 1

## Task

- Task dir: `.trellis/tasks/04-04-undo-history-ctrl-z`
- Task id: `04-04-undo-history-ctrl-z`
- Round: `1`
- Decision: `required`

## Inputs Reviewed

- `.trellis/tasks/04-04-undo-history-ctrl-z/self-review.md`
- `.trellis/tasks/04-04-undo-history-ctrl-z/prd.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md`
- current implementation paths:
  - `src/features/bookmark-graph/state/draftUndo.ts`
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
  - `src/features/browser-sync/application/bootstrapWorkspace.ts`
  - `src/app/App.tsx`
  - `src/adapters/local-persistence/contracts.ts`

## Gate Reasoning

### Hard conditions hit

1. Cross-layer contract change
   - `PersistedDraftSession.undoHistory/checkpoints` now flows through persistence validation, startup bootstrap restore, `App`, and `DraftGraphWorkspace`.
2. Core shared module / blast radius
   - `Ctrl+Z` behavior is implemented in the shared draft workspace and affects future search/sync tasks that depend on the same persisted session shape.

### Soft conditions hit

1. Scope is materially non-trivial
   - current diff for the T07B surface spans 9 key files with 700+ inserted lines across state, UI, bootstrap, docs, and task metadata.
2. Confidence is not yet high enough for `skip`
   - this task already needed multiple follow-up correction rounds for global `Ctrl+Z` capture and floating overlay placement.
3. Verification is asymmetric
   - targeted T07B gates pass, but full-repo `pnpm test` / `pnpm typecheck` are still red because of active `T08A` red tests, which increases the value of an independent reviewer checking whether any hidden T07B drift remains.
4. Manual runtime evidence is still missing
   - the current self-review still marks the real extension create/edit/delete/move + `Ctrl+Z` walkthrough as `not run`.

## Capability Check

- Current CLI capability confirmed:
  - `multi-cli-review-action`
- Reviewer capability required:
  - `multi-cli-review`
- Default reviewer set selected:
  - `claude`
  - `opencode`

## Review Focus

1. Draft-only undo must not cross into browser or WebDAV state.
2. Undo patch persistence must remain consistent across:
   - `draftUndo.ts`
   - local persistence contract validation
   - startup bootstrap restore
   - `App` -> `DraftGraphWorkspace` prop wiring
3. Global `Ctrl+Z` capture must not regress node create / edit / delete / same-parent move recovery.
4. App-level floating hint/status overlays must not introduce new layout coupling or stale status semantics.
5. Repo-level red `pnpm test` / `pnpm typecheck` should not be misattributed to T07B if they are still only blocked by `T08A`.

## Output Paths

- Reviewer command pack:
  - `.trellis/tasks/04-04-undo-history-ctrl-z/check/reviewer-commands-round-1.md`
- Reviewer reports:
  - `tmp/multi-cli-review/04-04-undo-history-ctrl-z/review-round-1/claude.md`
  - `tmp/multi-cli-review/04-04-undo-history-ctrl-z/review-round-1/opencode.md`
