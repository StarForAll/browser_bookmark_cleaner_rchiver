# Reviewer Commands — T07A Graph Drag Move Validation

## Round Info

- **Task ID**: `04-04-graph-drag-move-validation` (T07A)
- **Round**: 2
- **Decision**: `required`
- **Reviewer Count**: 2
- **Default Reviewer Set**: `claude` + `opencode`

---

## Task Summary

Round 1 review findings have already been processed. This round is a post-fix validation pass.

The current follow-up changes did three things:

- synced the virtual-root contract across design/task/frontend docs
- added a top-level node -> virtual-root reorder regression test
- synced selected-node keyboard move behavior (`ArrowUp` / `ArrowDown` / `ArrowLeft`) into the task/spec contract

The goal of round 2 is not to rediscover the original drift; it is to verify that the fix actually closes the drift cleanly and does not introduce a second-order mismatch.

---

## Review Focus

- post-fix validation of virtual-root contract sync
- adequacy of the new top-level -> virtual-root regression test
- keyboard move contract vs implementation consistency
- whether any new spec/test/code mismatch remains after round-1 fixes

---

## Target Files

- `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md`
- `.trellis/spec/frontend/component-guidelines.md`
- `.trellis/tasks/04-04-graph-drag-move-validation/prd.md`
- `.trellis/tasks/04-04-graph-drag-move-validation/self-review.md`
- `.trellis/tasks/04-04-graph-drag-move-validation/check/review-gate-round-2.md`
- `tmp/multi-cli-review/04-04-graph-drag-move-validation/summary-round-1.md`
- `tmp/multi-cli-review/04-04-graph-drag-move-validation/action.md`

---

## Reviewer Rules

- Reviewer must use `multi-cli-review` only.
- Reviewer must not modify code.
- Reviewer must not create directories.
- Reviewer should report only concrete defects, regression risks, or unresolved contract drift.
- Reviewer should treat round-1 findings as already handled and focus on whether the new fixes are actually sufficient.

---

## Reviewer Commands

### Claude

```text
/multi-cli-review "Re-review T07A graph drag-move validation after round-1 review fixes. Focus on whether the virtual-root contract sync is now fully consistent across docs/tests, whether the new top-level-node to virtual-root regression test really locks the intended rootIds reorder behavior, whether the documented ArrowUp/ArrowDown/ArrowLeft keyboard move semantics match the real accepted behavior, and whether the round-1 fixes introduced any fresh code/spec/test mismatch." src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md .trellis/spec/frontend/component-guidelines.md .trellis/tasks/04-04-graph-drag-move-validation/prd.md .trellis/tasks/04-04-graph-drag-move-validation/self-review.md .trellis/tasks/04-04-graph-drag-move-validation/check/review-gate-round-2.md tmp/multi-cli-review/04-04-graph-drag-move-validation/summary-round-1.md tmp/multi-cli-review/04-04-graph-drag-move-validation/action.md --task-dir tmp/multi-cli-review/04-04-graph-drag-move-validation --reviewer-id claude --round 2 --review-focus "T07A post-fix validation of virtual-root contract sync, new rootIds reorder regression test, and keyboard move contract consistency"
```

### OpenCode

```text
/multi-cli-review "Re-review T07A graph drag-move validation after round-1 review fixes. Focus on whether the virtual-root contract sync is now fully consistent across docs/tests, whether the new top-level-node to virtual-root regression test really locks the intended rootIds reorder behavior, whether the documented ArrowUp/ArrowDown/ArrowLeft keyboard move semantics match the real accepted behavior, and whether the round-1 fixes introduced any fresh code/spec/test mismatch." src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md .trellis/spec/frontend/component-guidelines.md .trellis/tasks/04-04-graph-drag-move-validation/prd.md .trellis/tasks/04-04-graph-drag-move-validation/self-review.md .trellis/tasks/04-04-graph-drag-move-validation/check/review-gate-round-2.md tmp/multi-cli-review/04-04-graph-drag-move-validation/summary-round-1.md tmp/multi-cli-review/04-04-graph-drag-move-validation/action.md --task-dir tmp/multi-cli-review/04-04-graph-drag-move-validation --reviewer-id opencode --round 2 --review-focus "T07A post-fix validation of virtual-root contract sync, new rootIds reorder regression test, and keyboard move contract consistency"
```

---

## Expected Output

- Reviewer report paths:
  - `tmp/multi-cli-review/04-04-graph-drag-move-validation/review-round-2/claude.md`
  - `tmp/multi-cli-review/04-04-graph-drag-move-validation/review-round-2/opencode.md`
