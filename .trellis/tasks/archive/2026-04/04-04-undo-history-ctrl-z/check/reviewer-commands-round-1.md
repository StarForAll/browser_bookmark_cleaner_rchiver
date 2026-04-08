# Reviewer Commands — Round 1

## Task Summary

- Task: `T07B / 04-04-undo-history-ctrl-z`
- Goal: verify draft-only undo history, `Ctrl+Z` restore behavior, persistence/bootstrap contract continuity, and the App-level floating hint/status follow-up added during T07B closeout
- Important closeout context:
  - T07B targeted tests are green
  - full-repo `pnpm test` / `pnpm typecheck` are still blocked by active `T08A` red tests in `src/features/bookmark-graph/state/searchAndFocus.test.ts`
  - reviewers should distinguish T07B defects from unrelated T08A red gates

## Review Focus

1. Draft-only undo boundary correctness
2. Persistence / bootstrap / App / workspace cross-layer contract drift
3. `Ctrl+Z` global capture regressions for create / edit / delete / same-parent move
4. Floating hint/status overlay regressions or stale UI/documentation coupling

## Key Files

- `src/features/bookmark-graph/state/draftUndo.ts`
- `src/features/bookmark-graph/state/draftUndo.test.ts`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.undo.test.tsx`
- `src/features/browser-sync/application/bootstrapWorkspace.ts`
- `src/app/App.tsx`
- `src/app/App.undoHistory.test.tsx`
- `src/adapters/local-persistence/contracts.ts`
- `.trellis/tasks/04-04-undo-history-ctrl-z/self-review.md`

## Task Dir

- `tmp/multi-cli-review/04-04-undo-history-ctrl-z`
- Round: `1`

## Reviewer Allocation

- Reviewer A: `claude`
- Reviewer B: `opencode`

## Commands

### Claude

```text
/multi-cli-review "Review T07B draft-only undo history and floating hint/status follow-up. Focus on src/features/bookmark-graph/state/draftUndo.ts, src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx, src/features/browser-sync/application/bootstrapWorkspace.ts, src/app/App.tsx, src/adapters/local-persistence/contracts.ts, and .trellis/tasks/04-04-undo-history-ctrl-z/self-review.md. Check draft-only undo boundaries, persistence/bootstrap contract drift, Ctrl+Z global-capture regressions, and whether repo-level pnpm test/typecheck blockers are correctly attributed to active T08A red tests rather than T07B." . --task-dir tmp/multi-cli-review/04-04-undo-history-ctrl-z --reviewer-id claude --round 1 --review-focus "draft-only undo boundary, cross-layer contract drift, Ctrl+Z regression risk"
```

### OpenCode

```text
/multi-cli-review "Review T07B draft-only undo history and floating hint/status follow-up. Focus on src/features/bookmark-graph/state/draftUndo.ts, src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx, src/features/browser-sync/application/bootstrapWorkspace.ts, src/app/App.tsx, src/adapters/local-persistence/contracts.ts, and .trellis/tasks/04-04-undo-history-ctrl-z/self-review.md. Check draft-only undo boundaries, persistence/bootstrap contract drift, Ctrl+Z global-capture regressions, and whether repo-level pnpm test/typecheck blockers are correctly attributed to active T08A red tests rather than T07B." . --task-dir tmp/multi-cli-review/04-04-undo-history-ctrl-z --reviewer-id opencode --round 1 --review-focus "cross-layer persistence/bootstrap/App drift and floating overlay regression risk"
```

## Preconditions

- Current coordinator CLI already has `multi-cli-review-action` available in the project skill inventory.
- Target reviewer CLI must also have `multi-cli-review` available before running the commands above.
