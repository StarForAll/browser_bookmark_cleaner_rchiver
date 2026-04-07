# Self Review Report — T07A Graph Drag Move Validation

## Session Info

- **Task**: `04-04-graph-drag-move-validation` (T07A)
- **Date**: 2026-04-07
- **Review Trigger**: AI 广义自审 (`self-review`)
- **Review Scope**: drag-move validation follow-up rounds, virtual-root drag behavior, and keyboard layer promotion/reorder interactions

---

## Step 1: Verification

### Self-review gate

Command:

```bash
/ops/softwares/python/bin/python3 .trellis/scripts/workflow/self-review-check.py \
  .trellis/tasks/04-04-graph-drag-move-validation \
  --test-cmd "pnpm test" \
  --lint-cmd "pnpm lint" \
  --typecheck-cmd "pnpm typecheck"
```

Result:

- Test: `pass`
- Lint: `pass`
- Type check: `pass`
- Git status: modified files detected

### Fresh command evidence

| Check | Command | Status |
|-------|---------|--------|
| Test | `pnpm test` | ✅ Pass |
| TypeScript | `pnpm typecheck` | ✅ Pass |
| Lint | `pnpm lint` | ✅ Pass |
| Build | `pnpm build` | ✅ Pass |
| Sonar | `pnpm sonar` | `not run` |
| Manual Chrome drag walkthrough | N/A | `not run` |

---

## Step 2: Spec Contrast

### Finding 1 — Virtual root interaction now violates the frozen “non-interactive anchor” contract

- **Severity**: L1
- **Spec**:
  - `.trellis/spec/frontend/component-guidelines.md:74`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md:112-119`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md:61-68`
  - all three documents still define the virtual root as a visible but non-focusable and non-interactive decoration
- **Implementation**:
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx:631-641`
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx:1441-1448`
  - current code resolves `VIRTUAL_ROOT_ID` as a real drop target and renders `.draft-virtual-root-drop-zone` with `onDragOver` / `onDrop`
- **Test contract drift evidence**:
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx:194-210`
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx:967-1001`
  - the same test file still describes the virtual root as “non-interactive”, while a later test already depends on drag-drop through that area
- **Why this matters**:
  - this is no longer a wording mismatch; the interaction model changed
  - later reviewers and task authors will assert the wrong behavior from frozen docs and stale test names
- **Required follow-up**:
  - either update AID / bookmark-graph spec / frontend guideline wording to bless “virtual root as top-level drop target”, or move this behavior behind a new approved requirement change instead of treating it as implicit

### Finding 2 — Automated coverage still misses “top-level node dropped onto virtual root reorders rootIds”

- **Severity**: L1
- **Observed implementation path**:
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx:631-641`
  - virtual-root drop always resolves to `targetParentId: null` plus a computed root index, so top-level nodes should reorder inside `rootIds`
- **Covered tests today**:
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx:920-965` covers top-level node -> folder
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx:967-1001` covers nested node -> virtual root
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx:1152-1198` covers same-level folder-body reorder
- **Missing gate**:
  - there is still no explicit component test for “top-level bookmark/folder -> virtual root” reordering behavior
- **Why this matters**:
  - the behavior exists in code and was already described in the manual checklist discussion
  - without an automated gate, a later refactor can silently break top-level virtual-root reorder while keeping current tests green
- **Required follow-up**:
  - add one UI regression test that drags a top-level node onto the virtual root and asserts reordered `rootIds`

### Finding 3 — Task-local docs are still drag-only, but current implementation now also carries keyboard layer-promotion behavior

- **Severity**: L0
- **Task docs**:
  - `.trellis/tasks/04-04-graph-drag-move-validation/prd.md:13-20`
  - current task contract only states drag-move validation and explicitly frames scope around drag/drop structure checks
- **Implementation**:
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx:602-619`
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx:1036-1093`
  - current workspace now also supports `ArrowLeft` promote-to-parent behavior with top insertion
- **Why this matters**:
  - the code is covered and intentional, but the task docs do not record that the interaction surface now includes keyboard hierarchy promotion
  - this is a documentation drift risk, not a correctness bug
- **Required follow-up**:
  - record the keyboard layer-promotion contract in the appropriate task/spec doc if this behavior is now part of the accepted workspace interaction set

---

## Step 3: Boundary / Sharp-Edges Check

### Security / misuse review

- No direct `chrome.bookmarks.create/update/removeTree` write path was reintroduced into the graph workspace drag or keyboard mutation path
- No new `any`, dangerous dynamic execution, secret material, or fail-open transport/config path was introduced in the reviewed delta
- Draft mutations still flow through `moveDraftNode(...)` and local session persistence instead of bypassing the normalized draft snapshot

### Residual implementation risk

- **Severity**: L0
- Current automated evidence proves drag rules and keyboard reorder/promote rules functionally work, but it still does **not** prove final hand-feel in real Chrome runtime for all matrix combinations discussed in the manual checklist
- Manual Chrome validation is still missing from this self-review round

---

## Step 4: Deviation Summary

### L0 Low Risk

1. Task docs have not yet recorded the newly added `ArrowLeft` hierarchy-promotion contract.
2. Manual Chrome drag walkthrough was not rerun in this self-review round.

### L1 Medium Risk

1. Virtual root is now a real drag-drop interaction surface, but frozen docs and an older test name still describe it as non-interactive.
2. Top-level node -> virtual root reorder behavior is implemented but not explicitly locked by a dedicated automated regression test.

### L2 High Risk

1. None found in this round.

---

## Step 5: Context Drift Check

- No evidence of reintroducing browser writeback inside draft-only mutations
- No evidence of viewport reset regressions from the reviewed delta
- The main issue in this round is contract drift, not a reproduced runtime failure
- No `[Evidence Gap]` remains for `pnpm test`, `pnpm lint`, `pnpm typecheck`, or `pnpm build`; all four commands were run fresh in this review

---

## Risk Level

**Overall: L1**

Reason:

- executable verification is green
- draft-only mutation boundaries remain intact
- but the virtual-root interaction contract is now out of sync with frozen docs, and one important top-level reorder path is still missing an explicit regression gate

---

## Next Step Recommendation

- Default next step: `/trellis:check`
- Before or during supplementary review:
  - decide whether virtual-root drop should be officially blessed as interactive behavior
  - add the missing top-level -> virtual-root reorder test if that behavior is intended to stay
  - sync the keyboard `ArrowLeft` layer-promotion rule into task/spec docs if it is part of the accepted workspace contract

---

## Review-Action Addendum

- **Date**: 2026-04-07
- **Source**: `tmp/multi-cli-review/04-04-graph-drag-move-validation/summary-round-1.md`

Round-1 multi-CLI review follow-up resolved the previously open L1 items:

1. Virtual-root contract drift was closed by syncing:
   - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md`
   - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md`
   - `.trellis/spec/frontend/component-guidelines.md`
   - `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
2. The missing top-level -> virtual-root reorder gate was closed by adding a new UI regression test in `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`.
3. The task-boundary drift for `ArrowLeft` was closed by syncing `.trellis/tasks/04-04-graph-drag-move-validation/prd.md` and `AID.md`.

Post-fix verification evidence:

- `pnpm test`: pass
- `pnpm lint`: pass
- `pnpm typecheck`: pass
- `pnpm build`: pass

Residual open items after review-action:

- Manual Chrome drag verification: `not run`
- `pnpm sonar`: `not run`
