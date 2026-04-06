# Reviewer Commands — T06 Graph Basic Editing

## Round Info

- **Task ID**: `04-04-graph-basic-editing` (T06)
- **Round**: 2
- **Decision**: `required`
- **Reviewer Count**: 1

---

## Task Summary

Review T06 after multiple follow-up implementation rounds. The graph workspace now includes:

- custom SVG/XMind-like rendering
- virtual root node
- hover detail cards
- folder-only create-child behavior
- internal delete-confirm modal for multi-child folders
- startup/status persistence adjustments
- 1000-node large-graph optimization with layout changes and viewport culling

The key question is not “does it basically work” but:

- whether the current implementation is safe to freeze as the T06 baseline
- whether the custom renderer path is acceptable given the frozen TAD
- whether there are hidden regression risks in the new performance path

---

## Review Focus

- architecture drift vs frozen graph-rendering direction
- modal gating correctness and interaction consistency
- large-graph rendering / viewport-culling regression risk
- spec drift and downstream-task compatibility
- missing high-value tests

---

## Target Files

- `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
- `src/app/App.tsx`
- `src/app/App.startup.test.tsx`
- `src/app/app.css`
- `src/shared/copy/appShell.ts`
- `src/shared/copy/draftGraphWorkspace.ts`
- `src/features/browser-sync/application/bootstrapWorkspace.ts`
- `src/extensionShellPageEntry.test.tsx`
- `test/fixtures/draftGraph.ts`
- `.trellis/tasks/archive/2026-04/04-04-graph-basic-editing/self-review.md`
- `.trellis/tasks/archive/2026-04/04-04-graph-basic-editing/check/review-gate-round-2.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/TAD.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/workspace.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md`

---

## Reviewer Command

```text
/multi-cli-review "Review T06 graph basic editing after multiple follow-up fixes. Focus on architecture drift against the frozen graph-rendering direction, modal interaction correctness, large-graph viewport-culling regression risk, startup/status scope creep, and whether current tests miss any high-value paths." src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx src/app/App.tsx src/app/App.startup.test.tsx src/app/app.css src/shared/copy/appShell.ts src/shared/copy/draftGraphWorkspace.ts src/features/browser-sync/application/bootstrapWorkspace.ts src/extensionShellPageEntry.test.tsx test/fixtures/draftGraph.ts .trellis/tasks/archive/2026-04/04-04-graph-basic-editing/self-review.md .trellis/tasks/archive/2026-04/04-04-graph-basic-editing/check/review-gate-round-2.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/TAD.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/workspace.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md --task-dir tmp/multi-cli-review/04-04-graph-basic-editing --reviewer-id claude --round 2 --review-focus "T06 baseline stability, spec drift, renderer-direction risk, and large-graph regression risk"
```
