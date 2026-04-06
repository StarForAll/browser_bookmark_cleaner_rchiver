# Reviewer Commands — T06 Graph Basic Editing

## Round Info

- **Task ID**: `04-04-graph-basic-editing` (T06)
- **Round**: 3
- **Decision**: `required`
- **Reviewer Count**: 2
- **Default Reviewer Set**: `claude` + `opencode`

---

## Task Summary

Re-review T06 after the modal-focus isolation fix. The latest change is not about graph layout direction anymore; it is specifically about whether open dialogs now behave as true internal modals.

The new code adds:

- `Tab` / `Shift+Tab` focus trapping inside dialogs
- autofocus into edit/create dialogs
- focus restore after close
- a regression test that should prevent focus escaping back to draft nodes

The key question is:

- whether this modal fix is actually complete and safe
- whether the new focus-management path introduced hidden regressions
- whether the current test is strong enough to freeze this interaction contract

---

## Review Focus

- modal focus trap correctness
- keyboard accessibility regression risk
- dialog open/close focus lifecycle
- whether the new tests assert the right stable behavior
- any remaining interaction leakage from dialog to draft canvas

---

## Target Files

- `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
- `.trellis/tasks/archive/2026-04/04-04-graph-basic-editing/check/review-gate-round-3.md`
- `tmp/multi-cli-review/04-04-graph-basic-editing/summary-round-2.md`

---

## Reviewer Commands

### Claude

```text
/multi-cli-review "Re-review T06 graph basic editing after the modal focus-trap fix. Focus on whether Tab and Shift+Tab are truly trapped inside open dialogs, whether focus restore/autofocus logic can regress edit-create-delete flows, and whether the new regression test is strong enough to freeze the modal isolation contract." src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx .trellis/tasks/archive/2026-04/04-04-graph-basic-editing/check/review-gate-round-3.md tmp/multi-cli-review/04-04-graph-basic-editing/summary-round-2.md --task-dir tmp/multi-cli-review/04-04-graph-basic-editing --reviewer-id claude --round 3 --review-focus "T06 modal focus trap correctness, keyboard accessibility regression risk, and test adequacy"
```

### OpenCode

```text
/multi-cli-review "Re-review T06 graph basic editing after the modal focus-trap fix. Focus on whether Tab and Shift+Tab are truly trapped inside open dialogs, whether focus restore/autofocus logic can regress edit-create-delete flows, and whether the new regression test is strong enough to freeze the modal isolation contract." src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx .trellis/tasks/archive/2026-04/04-04-graph-basic-editing/check/review-gate-round-3.md tmp/multi-cli-review/04-04-graph-basic-editing/summary-round-2.md --task-dir tmp/multi-cli-review/04-04-graph-basic-editing --reviewer-id opencode --round 3 --review-focus "T06 modal focus trap correctness, keyboard accessibility regression risk, and test adequacy"
```
