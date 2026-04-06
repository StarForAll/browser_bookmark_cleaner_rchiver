# Prototype Validation

## Purpose

Record the Step 3 discussion-based validation result for the existing `tmp/ui/` prototype assets.

This validation confirms interaction semantics and UI expression only. It does not validate runtime Chrome API behavior, WebDAV connectivity, or production implementation code.

## Prototype Boundary

- `tmp/ui/` remains a visual and interaction reference asset only
- prototype code under `tmp/ui/` is completely forbidden from direct reuse in production implementation
- only visual tone, page zoning, and interaction direction may be carried forward

## Validation Scope

### Main Flow

Validated against:

- workspace zoning clarity
- distinction between draft editing and browser-write actions
- distinction between draft WebDAV upload and browser WebDAV upload
- distinction between restore-to-draft and restore-to-browser actions
- status-feedback clarity after action completion

Result summary:

- zoning clarity: pass
- action-object clarity: fail in the reviewed prototype
- restore-target clarity: fail in the reviewed prototype
- status-feedback baseline: partial-pass in the reviewed prototype

Required adjustments:

- the main workspace must always be expressed as the current draft workspace
- the top-right action area must expose seven explicit buttons:
  - overwrite current draft from browser bookmarks
  - sync current draft to browser bookmarks
  - upload current draft to WebDAV
  - upload current browser bookmarks to WebDAV
  - restore a WebDAV draft version to the current draft
  - restore a WebDAV bookmark version to browser bookmarks
  - undo overwrite operation
- each button must be understandable from button text alone, without relying on extra helper copy
- the workspace should keep a low-emphasis but always-visible operation-hint panel anchored at the top-right of the graph canvas
- the four overwrite-risk actions must enter one shared confirmation dialog with action-specific wording:
  - overwrite current draft from browser bookmarks
  - sync current draft to browser bookmarks
  - restore a WebDAV draft version to the current draft
  - restore a WebDAV bookmark version to browser bookmarks
- undo-overwrite uses its own unified entry and second-step target chooser instead of reusing the shared four-action overwrite dialog

### Exception Flow

Validated against:

- whether the UI exposes visible failure feedback instead of failing silently

Result summary:

- visible failure feedback: required
- exception-type differentiation in UI: not required for Step 3

Required adjustments:

- failed actions only need a readable error log in the status area
- the prototype validation does not require separate UI branches for different WebDAV failure categories

### Empty-Data Flow

Validated against:

- whether the UI tells the user that browser bookmark data is currently empty
- whether the draft workspace still communicates that editing can continue

Result summary:

- empty-state explanation: required
- explicit action buttons inside the empty state: not required

Required adjustments:

- the status area should indicate the empty-data situation
- the draft workspace should still explain that users may continue draft editing or node creation

## Status Feedback Contract

Step 3 confirmed the following status-feedback model:

- a result entry is shown only after an action finishes
- each entry includes:
  - action description
  - action time
  - action result
- failed entries also include a short failure reason
- the bottom-right status popup can be closed
- after closing, the latest-result entry remains available and can reopen the detailed popup
- the popup/history keeps the newest three entries
- both success and failure entries are retained
- newest entries appear first

## Overall Step 3 Outcome

- Step 3 discussion is complete
- the current prototype is accepted only as a design-reference asset
- the design package must carry the required semantic adjustments above before moving forward
- runtime verification status: not run
