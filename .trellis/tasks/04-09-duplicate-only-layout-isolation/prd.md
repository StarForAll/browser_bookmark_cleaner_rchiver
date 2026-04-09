# Fix duplicate-only canvas layout isolation

## Goal
Keep the duplicate-only view inside the canvas layout boundary so toggling `仅看重复项` does not shift non-canvas UI such as the top-right action area or floating canvas overlays.

## Requirements
- keep `duplicateOnly` as view-only state
- preserve the duplicate-focused list behavior inside the canvas area
- prevent duplicate-only rendering from changing outer page layout or causing action-area position drift
- keep the existing floating hint/status overlays anchored to the canvas area

## Acceptance Criteria
- [ ] toggling `仅看重复项` does not change the top action area layout
- [ ] duplicate-only content stays scrollable inside the canvas tree container
- [ ] existing search/duplicate behavior remains intact
- [ ] automated regression coverage exists for the non-canvas layout boundary

## Technical Notes
- scope changes to `src/app/app.css`, `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`, and related tests unless a smaller fix emerges
- prefer tightening layout constraints over introducing imperative viewport resets
