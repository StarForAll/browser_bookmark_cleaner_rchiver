# Review Gate — T07A Graph Drag Move Validation

## Task Context

- **Task ID**: `04-04-graph-drag-move-validation` (T07A)
- **Review Round**: 1
- **Date**: 2026-04-07
- **Reviewer**: Current CLI (Codex)

---

## Current Delta Summary

- Current task delta is no longer only the original drag-move baseline
- The edited surface now includes:
  - domain-level move validation and path recomputation
  - workspace drag target rules for folder body vs folder tail drop zone
  - virtual-root top-level drop handling
  - keyboard `ArrowUp` / `ArrowDown` sibling reorder
  - keyboard `ArrowLeft` promote-to-parent behavior
- The hotspot remains the shared graph workspace surface:
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`

---

## Inputs Read

- `.trellis/tasks/04-04-graph-drag-move-validation/self-review.md`
- `.trellis/tasks/04-04-graph-drag-move-validation/prd.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md`
- `.trellis/spec/frontend/component-guidelines.md`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
- `src/domain/draft-graph/editing.ts`
- fresh verification evidence:
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm build`

---

## Hard Conditions Check

| Condition | Hit? | Notes |
|-----------|------|-------|
| Authentication / authorization / secrets | ❌ | No |
| Data migration / schema change | ❌ | No |
| Public API / external integration contract | ❌ | No runtime public API or external integration changed |
| Payment / queue / cache consistency | ❌ | No |
| Core shared module with clear blast radius | ❌ | `DraftGraphWorkspace` is central, but the known issues are localized interaction-contract drift, not a broad unknown blast-radius change |
| User explicitly requested task-level multi-CLI review | ❌ | Current turn requested the `/check` gate itself, not a direct instruction to start reviewer execution |

**Hard-condition result**: not triggered

---

## Soft Conditions Assessment

| Factor | Assessment | Notes |
|--------|------------|-------|
| Complexity | Medium | 8 modified files and a large UI interaction delta around one core workspace |
| Impact surface | Medium | Drag/drop, keyboard hierarchy movement, virtual-root behavior, and task/spec contracts all intersect here |
| Uncertainty | Medium | Automated coverage is strong, but one top-level virtual-root reorder path is still not explicitly locked |
| Blast radius | Medium | A wrong drag contract would affect the main editable graph workflow for later tasks |

---

## Determination: **RECOMMENDED**

### Why `recommended`, not `skip`

1. Self-review surfaced two real L1 items:
   - virtual-root interaction contract drift
   - missing top-level-to-virtual-root regression gate
2. The code sits in the shared graph workspace interaction layer rather than an isolated helper.
3. Independent reviewer eyes could still help decide whether virtual-root interactivity should be blessed in spec or rolled back.

### Why `recommended`, not `required`

1. No hard-condition trigger was hit.
2. Current risk is primarily known and bounded:
   - documentation/contract drift
   - one missing explicit regression test
3. Fresh automated evidence is green:
   - `pnpm test`
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm build`
4. The most direct path is still to resolve the known issues; multi-CLI review adds value, but it is not mandatory to make progress safely.

---

## Capability Check

- Current CLI `multi-cli-review-action` capability: available in project skill set
- Reviewer-side `multi-cli-review` capability: available in project skill set
- Reviewer command package: generated after the user explicitly accepted entering multi-CLI review on 2026-04-07

---

## Review Focus If Upgraded To Multi-CLI Review

1. Should the virtual root remain a decorative anchor, or is “top-level drop target” now the accepted contract?
2. Does the current test suite adequately lock all intended drag permutations, especially top-level node -> virtual root reorder?
3. Does the new keyboard hierarchy behavior belong in `T07A`, or should it be split/documented as a separate accepted contract?
4. Are there any hidden regressions in the shared graph workspace semantics that the current tests do not prove?

---

## Next Step

- Reviewer command package is available at:
  - `.trellis/tasks/04-04-graph-drag-move-validation/check/reviewer-commands-round-1.md`
- Execute round-1 reviewer commands with:
  - `--reviewer-id claude`
  - `--reviewer-id opencode`
- After both reviewer reports are available, return here and process them with `multi-cli-review-action`
