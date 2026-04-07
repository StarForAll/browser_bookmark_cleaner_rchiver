# Reviewer Commands — T07A Graph Drag Move Validation

## Round Info

- **Task ID**: `04-04-graph-drag-move-validation` (T07A)
- **Round**: 1
- **Decision**: `recommended` accepted by user
- **Reviewer Count**: 2
- **Default Reviewer Set**: `claude` + `opencode`

---

## Task Summary

Review T07A after the drag-move interaction expansion and the follow-up keyboard hierarchy changes.

The current implementation now includes:

- domain-level `moveDraftNode(...)` validation for legal and illegal moves
- folder-body vs folder-tail drag target semantics
- virtual-root top-level drop handling
- keyboard `ArrowUp` / `ArrowDown` sibling reorder
- keyboard `ArrowLeft` promote-to-parent behavior

The known review pressure points are:

- whether virtual-root drag-drop should stay as accepted interaction behavior or be rolled back to a purely decorative anchor
- whether the current regression suite is missing a critical top-level-node -> virtual-root reorder gate
- whether keyboard hierarchy promotion belongs in the accepted T07A contract or is drifting beyond the task boundary

---

## Review Focus

- virtual-root interaction contract drift
- drag target semantics and invalid-drop boundaries
- missing top-level -> virtual-root regression coverage
- keyboard hierarchy behavior vs task boundary
- whether current tests lock stable behavior instead of implementation accidents

---

## Target Files

- `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
- `src/domain/draft-graph/editing.ts`
- `src/domain/draft-graph/editing.test.ts`
- `src/shared/copy/appShell.ts`
- `.trellis/tasks/04-04-graph-drag-move-validation/self-review.md`
- `.trellis/tasks/04-04-graph-drag-move-validation/check/review-gate-round-1.md`
- `.trellis/tasks/04-04-graph-drag-move-validation/prd.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md`
- `.trellis/spec/frontend/component-guidelines.md`

---

## Reviewer Rules

- Reviewer must use `multi-cli-review` only.
- Reviewer must not modify code.
- Reviewer must not create directories.
- Reviewer should report only concrete defects, regression risks, or spec drift.
- Reviewer should focus on current round findings rather than reopening already-closed unrelated UI topics.

---

## Reviewer Commands

### Claude

```text
/multi-cli-review "Review T07A graph drag-move validation after drag-target refinements and keyboard hierarchy follow-ups. Focus on whether virtual-root drag-drop should be an accepted interaction contract, whether any invalid move boundary or folder-tail vs folder-body rule is still wrong, whether top-level node to virtual-root reorder is missing a regression gate, and whether ArrowLeft hierarchy promotion is drifting beyond the intended task scope." src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx src/domain/draft-graph/editing.ts src/domain/draft-graph/editing.test.ts src/shared/copy/appShell.ts .trellis/tasks/04-04-graph-drag-move-validation/self-review.md .trellis/tasks/04-04-graph-drag-move-validation/check/review-gate-round-1.md .trellis/tasks/04-04-graph-drag-move-validation/prd.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md .trellis/spec/frontend/component-guidelines.md --task-dir tmp/multi-cli-review/04-04-graph-drag-move-validation --reviewer-id claude --round 1 --review-focus "T07A virtual-root contract drift, drag target boundary correctness, missing top-level virtual-root regression gate, and ArrowLeft task-boundary fit"
```

### OpenCode

```text
/multi-cli-review "Review T07A graph drag-move validation after drag-target refinements and keyboard hierarchy follow-ups. Focus on whether virtual-root drag-drop should be an accepted interaction contract, whether any invalid move boundary or folder-tail vs folder-body rule is still wrong, whether top-level node to virtual-root reorder is missing a regression gate, and whether ArrowLeft hierarchy promotion is drifting beyond the intended task scope." src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx src/domain/draft-graph/editing.ts src/domain/draft-graph/editing.test.ts src/shared/copy/appShell.ts .trellis/tasks/04-04-graph-drag-move-validation/self-review.md .trellis/tasks/04-04-graph-drag-move-validation/check/review-gate-round-1.md .trellis/tasks/04-04-graph-drag-move-validation/prd.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md .trellis/spec/frontend/component-guidelines.md --task-dir tmp/multi-cli-review/04-04-graph-drag-move-validation --reviewer-id opencode --round 1 --review-focus "T07A virtual-root contract drift, drag target boundary correctness, missing top-level virtual-root regression gate, and ArrowLeft task-boundary fit"
```

---

## Expected Output

- Reviewer report paths:
  - `tmp/multi-cli-review/04-04-graph-drag-move-validation/review-round-1/claude.md`
  - `tmp/multi-cli-review/04-04-graph-drag-move-validation/review-round-1/opencode.md`
