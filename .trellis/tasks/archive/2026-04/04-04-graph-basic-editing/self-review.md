# Self Review Report — T06 Graph Basic Editing

## Session Info

- **Task**: `04-04-graph-basic-editing` (T06)
- **Date**: 2026-04-06
- **Review Trigger**: AI 广义自审 (`self-review`)
- **Review Scope**: latest graph-editing follow-up rounds, including delete-confirm modal changes and 1000-node performance optimization

---

## Step 1: Verification

### Self-review gate

Command:

```bash
/ops/softwares/python/bin/python3 .trellis/scripts/workflow/self-review-check.py \
  .trellis/tasks/archive/2026-04/04-04-graph-basic-editing \
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

---

## Step 2: Spec Contrast

### Finding 1 — Architecture still diverges from the frozen graph-rendering selection

- **Severity**: L1
- **Spec**:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/TAD.md:35-37`
  - frozen direction requires a node-editor library and explicitly says “not custom SVG/canvas implementation”
- **Implementation**:
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx:904-911`
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx:145-365`
  - current workspace still owns a custom SVG branch renderer, custom layout engine, custom overlap resolver, and custom viewport culling
- **Why this matters**:
  - recent performance work deepens the project’s dependence on the custom renderer instead of moving toward the frozen `@xyflow/react` direction
  - later planned tasks such as drag-move validation were originally framed around library-level drag interactions
- **Required follow-up**:
  - either update the frozen TAD to bless the custom renderer path, or open an explicit migration task back to the library-backed graph strategy

### Finding 2 — Workspace docs no longer match the implemented interaction contract

- **Severity**: L1
- **Spec**:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md:29-32`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md:95-99`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/workspace.md:27-30`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/workspace.md:68-73`
  - these docs still say the hint panel is bottom-left, `Delete/Backspace` has no extra confirmation, and `Enter` generically opens create-child
- **Implementation**:
  - `src/shared/copy/appShell.ts:45-52`
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx:469-513`
  - current behavior is:
    - hint panel moved to the top-right
    - `Enter` only opens create-child for folder nodes
    - deleting a folder with multiple direct child nodes opens an internal confirmation modal first
- **Why this matters**:
  - downstream task authors and reviewers will read the old contract and assert the wrong behavior
  - this is now a real requirement drift, not a wording nit
- **Required follow-up**:
  - update AID/workspace specs through requirement-change handling, then let later tasks inherit the new interaction contract

---

## Step 3: Boundary / Sharp-Edges Check

### Security / misuse review

- No direct `chrome.bookmarks` write path was reintroduced into the graph workspace component
- No dangerous `eval`, `innerHTML`, dynamic script execution, or secret material was introduced
- Delete confirmation now uses an internal modal instead of browser-native `confirm`, which reduces UI inconsistency and avoids a browser-level blocking footgun

### Residual implementation risk

- **Severity**: L0
- The new 1000-node coverage is still a smoke gate, not a measured performance budget:
  - `test/fixtures/draftGraph.ts:54-92`
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx:247-269`
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx:11-40`
- Current automated evidence proves large-graph rendering and viewport culling logic work functionally, but it does **not** prove acceptable frame time or scroll smoothness inside the real Chrome extension runtime

---

## Step 4: Deviation Summary

### L0 Low Risk

1. Large-graph optimization has automated smoke coverage, but no real runtime performance baseline yet.

### L1 Medium Risk

1. Frozen TAD still requires a graph library path, while the implementation continues to expand a custom renderer.
2. Workspace behavior docs are stale relative to the current top-right hint panel, folder-only create-child, and delete-confirm modal rules.

### L2 High Risk

1. None found in this round.

---

## Step 5: Context Drift Check

- No repeated previously-fixed runtime bug was reintroduced by this review itself
- The main gap is spec drift, not implementation correctness drift
- No additional evidence gap remains for lint / typecheck / test / build; all four commands were run and passed

---

## Risk Level

**Overall: L1**

Reason:

- executable verification is green
- no new browser-write or persistence-boundary violations were found
- but the design/architecture contract is now visibly behind the code in two places, and future tasks are likely to inherit that mismatch unless it is corrected

---

## Next Step Recommendation

- Default next step: `/trellis:check`
- Before or during supplementary review, sync the frozen docs for:
  - graph-rendering strategy
  - workspace hint-panel position
  - delete-confirm behavior
  - folder-only `Enter` create-child rule
