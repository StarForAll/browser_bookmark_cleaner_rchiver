# Reviewer Commands — Sync All Related Docs

## Round Info

- **Task ID**: `04-07-sync-all-related-docs`
- **Round**: 1
- **Decision**: `required`
- **Reviewer Count**: 2
- **Default Reviewer Set**: `claude` + `opencode`

---

## Task Summary

Review the repository-wide documentation sync after self-review fixes.

This task updated root docs, `docs/`, active frontend spec files, active design/task pages, and one user-visible copy module so they match the shipped implementation instead of stale placeholder or target-only wording.

The implemented behavior that the docs now claim includes:

- startup restore/import flow:
  - restore local persisted draft first
  - import browser bookmarks only when no local draft exists
  - persist the imported draft session locally
- draft-graph editing baseline:
  - node edit
  - create child
  - create sibling
  - delete with multi-child folder confirmation
  - drag move
  - keyboard reorder/promote
  - basic hover details
- current layout reality:
  - hint and status surfaces live in the canvas side rail rather than old left-bottom/right-bottom wording
- current planned-vs-shipped boundary:
  - browser overwrite/writeback, WebDAV, search/duplicate focus, `Ctrl+Z`, local backup/undo-overwrite remain future scope

The main review goal is to catch any missed active-document drift after these sync edits.

---

## Review Focus

- missed active doc/spec/design/copy drift against real implementation
- unclear mixing of target-state requirements and current-state claims
- shipped-vs-planned boundary errors
- current layout wording drift for hint/status surfaces
- whether the new code-spec depth is executable and aligned with current code rather than speculative

---

## Target Files

- `README.md`
- `docs/`
- `.trellis/spec/frontend/`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/task_plan.md`
- `src/shared/copy/appShell.ts`
- `src/app/App.tsx`
- `src/features/browser-sync/application/bootstrapWorkspace.ts`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
- `.trellis/tasks/04-07-sync-all-related-docs/prd.md`
- `.trellis/tasks/04-07-sync-all-related-docs/self-review.md`
- `.trellis/tasks/04-07-sync-all-related-docs/check/review-gate-round-1.md`

---

## Reviewer Rules

- Reviewer must use `multi-cli-review` only.
- Reviewer must not modify code.
- Reviewer must not create directories.
- Reviewer should report only concrete defects, regression risks, omission drift, or contract/spec mismatch.
- Reviewer should focus on active documentation surfaces, not archived historical docs.

---

## Reviewer Commands

### Claude

```text
/multi-cli-review "Review the repository-wide documentation sync for implementation drift. Focus on whether any active docs, active frontend specs, active design pages, task-plan summaries, or user-visible shell copy still misstate the shipped behavior after the sync. Pay special attention to startup restore/import order, persisted draft-session boundaries, draft-graph editing and drag capabilities, side-rail hint/status layout wording, and whether browser overwrite, WebDAV, search/duplicate focus, Ctrl+Z, and local backup flows are still correctly described as future scope rather than shipped behavior." README.md docs .trellis/spec/frontend .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/task_plan.md src/shared/copy/appShell.ts src/app/App.tsx src/features/browser-sync/application/bootstrapWorkspace.ts src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx .trellis/tasks/04-07-sync-all-related-docs/prd.md .trellis/tasks/04-07-sync-all-related-docs/self-review.md .trellis/tasks/04-07-sync-all-related-docs/check/review-gate-round-1.md --task-dir tmp/multi-cli-review/04-07-sync-all-related-docs --reviewer-id claude --round 1 --review-focus "repository-wide active doc/spec/design/copy drift against shipped startup flow, draft editing scope, side-rail hint/status layout, and shipped-vs-planned boundaries"
```

### OpenCode

```text
/multi-cli-review "Review the repository-wide documentation sync for implementation drift. Focus on whether any active docs, active frontend specs, active design pages, task-plan summaries, or user-visible shell copy still misstate the shipped behavior after the sync. Pay special attention to startup restore/import order, persisted draft-session boundaries, draft-graph editing and drag capabilities, side-rail hint/status layout wording, and whether browser overwrite, WebDAV, search/duplicate focus, Ctrl+Z, and local backup flows are still correctly described as future scope rather than shipped behavior." README.md docs .trellis/spec/frontend .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/task_plan.md src/shared/copy/appShell.ts src/app/App.tsx src/features/browser-sync/application/bootstrapWorkspace.ts src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx .trellis/tasks/04-07-sync-all-related-docs/prd.md .trellis/tasks/04-07-sync-all-related-docs/self-review.md .trellis/tasks/04-07-sync-all-related-docs/check/review-gate-round-1.md --task-dir tmp/multi-cli-review/04-07-sync-all-related-docs --reviewer-id opencode --round 1 --review-focus "repository-wide active doc/spec/design/copy drift against shipped startup flow, draft editing scope, side-rail hint/status layout, and shipped-vs-planned boundaries"
```

---

## Expected Output

- Reviewer report paths:
  - `tmp/multi-cli-review/04-07-sync-all-related-docs/review-round-1/claude.md`
  - `tmp/multi-cli-review/04-07-sync-all-related-docs/review-round-1/opencode.md`
