# Move back-to-top control to page level

## Goal
Provide a visible one-click control that scrolls the whole workspace page back to the top after the user has scrolled down the page.

## Requirements
- scope the control to whole-page scrolling rather than the draft canvas scroll container
- show the control only after the page has scrolled down far enough to make it useful
- clicking the control scrolls the window back to the top without mutating draft content or local persistence
- remove the draft-canvas-scoped back-to-top control so the UI exposes only the page-level behavior

## Acceptance Criteria
- [ ] the control appears after whole-page scroll passes the threshold
- [ ] clicking the control calls page-level scroll-to-top behavior
- [ ] no draft persistence or search state changes are triggered by the control
- [ ] automated regression coverage exists for visibility and click behavior
