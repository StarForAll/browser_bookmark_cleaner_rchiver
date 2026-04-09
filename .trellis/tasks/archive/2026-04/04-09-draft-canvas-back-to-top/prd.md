# Add draft canvas back-to-top button

## Goal
Provide a one-click control that scrolls the draft canvas back to the top when the draft area becomes long enough to require meaningful vertical scrolling.

## Requirements
- keep the control scoped to the draft canvas scroll container
- show the control only when the canvas has been scrolled down far enough to make the action useful
- clicking the control returns the canvas scroll position to the top without mutating draft content
- preserve existing search, duplicate-only, drag, and undo behavior

## Acceptance Criteria
- [ ] a visible back-to-top control appears after scrolling the draft canvas down
- [ ] clicking the control scrolls the draft canvas to `scrollTop = 0`
- [ ] the control does not write persistence or affect selection/search state
- [ ] automated regression coverage exists for visibility and click behavior

## Technical Notes
- prefer implementing the control inside `DraftGraphWorkspace` because the scroll container already lives there
- reuse existing floating control patterns where possible, but avoid coupling to app-shell portal overlays
