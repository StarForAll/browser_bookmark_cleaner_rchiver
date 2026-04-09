# Implement Responsive Draft Graph Layout On Resize

## Goal
Make the draft graph workspace adapt its node layout when the available canvas width changes, so deep child nodes remain discoverable during window or container resize without silently resetting the user's viewport.

## Requirements
- Detect the draft graph container width and treat it as a layout input.
- Recalculate graph layout spacing when the available width shrinks or expands.
- Preserve current interaction semantics for selection, search focus, drag/drop, dialogs, and large-graph viewport rendering.
- Avoid forced scroll resets on resize.
- Keep the existing visual hierarchy readable at common desktop and narrow extension widths.

## Acceptance Criteria
- [ ] Resizing the workspace recomputes graph layout responsively instead of keeping a fully static column spacing model.
- [ ] Deep child nodes remain reachable and are not pushed off-canvas unnecessarily at narrower widths.
- [ ] Existing search-focus and large-graph viewport behavior continue to work after resize.
- [ ] No resize effect silently snaps the tree viewport back to the top-left corner.
- [ ] Automated tests cover the resize-adaptive behavior.

## Technical Notes
- Primary implementation surface: `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
- Primary styling surface: `src/app/app.css`
- Primary test surface: `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
- Prefer container-aware layout metrics over resize-time imperative scroll adjustments.
