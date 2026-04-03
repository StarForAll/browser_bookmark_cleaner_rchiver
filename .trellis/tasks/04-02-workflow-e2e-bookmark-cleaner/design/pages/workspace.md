# Workspace Page

## Purpose

Define the primary extension workspace where the user views and edits the current draft graph.

The workspace always represents the current draft, not live browser bookmarks.

## Main Regions

1. Top shell
   - page title
   - seven explicit action buttons
   - auto-layout reset
   - WebDAV settings / test entry

2. Search and focus strip
   - title or URL search
   - duplicate-only toggle

3. Graph canvas
   - draft graph rendering
   - selection
   - drag and drop
   - hover detail

4. Bottom-left operation hint area
   - always-visible low-emphasis help block
   - one line per operation hint
   - mouse and keyboard operations in one unified list

5. Bottom-right result area
   - latest-result popup
   - close action
   - reopen anchor
   - newest-three history

## Top-Right Explicit Actions

The following seven actions must be directly visible and understandable from button text alone:

1. overwrite current draft from browser bookmarks
2. sync current draft to browser bookmarks
3. upload current draft to WebDAV
4. upload current browser bookmarks to WebDAV
5. restore a WebDAV draft version to the current draft
6. restore a WebDAV bookmark version to browser bookmarks
7. undo overwrite operation

No extra action grouping is required as long as each button is individually clear.

## Core Workspace Behaviors

### Draft editing

- select node
- double click to edit
- `Enter` to create child
- drag to move
- `Delete` or `Backspace` to remove node or subtree directly without secondary confirmation
- `Ctrl+Z` to undo one draft-content mutation

### Search and duplicate focus

- search matches title and URL only
- duplicate-only mode filters the current draft view
- search and duplicate-only mode can coexist

### Hover information

- all hover cards show title, node type, and full path
- bookmark-node hover also shows URL
- duplicate bookmark hover shows:
  - duplicate total count
  - first two duplicate paths by default
  - inline expand-more when more than two exist

## Secondary Surfaces Opened From The Workspace

- node editor
- create-child flow
- create-root flow
- shared overwrite confirmation dialog
- WebDAV settings
- remote restore picker
- local backup recovery
- status-history popup

## Undo Overwrite Rules

- the top-right `undo overwrite operation` action is a unified entry, not two separate buttons
- clicking it opens a second-step chooser instead of executing recovery immediately
- the chooser exposes:
  - undo overwrite on browser bookmarks
  - undo overwrite on current draft
- if neither recovery target is currently available, the top-right action stays disabled
- when the top-right action is disabled, hover feedback states that there is no completed overwrite action available to undo right now
- if only one recovery target is unavailable, the chooser still opens and the unavailable target remains disabled with a target-specific unavailable reason

## Operation Hint Rules

- the bottom-left operation hint area is always visible
- it must stay low-emphasis enough to avoid competing with the graph canvas
- it must still remain readable when the user looks for guidance
- the area shows these six operation hints in one-line-per-item format:
  - click: select node
  - double click: edit node
  - drag: move node
  - `Enter`: create child node
  - `Delete / Backspace`: delete node
  - `Ctrl+Z`: undo one draft edit

## Empty-State Rules

- when browser bookmark data is empty, the workspace still renders as a valid draft workspace
- the status area reports the empty browser-data situation
- the main draft area still communicates that node editing or creation can continue
- the empty-canvas hint area can open the root-create flow

## Status Rules

- result entries appear only after an explicit system action completes
- every entry shows:
  - action description
  - action time
  - result
- failed entries also show a short failure reason
- newest three entries are retained
- newest entry appears first
- closing the popup preserves the retained history
- routine draft editing actions such as create-child, node edit, drag, delete, and undo do not enter this status history

## Copy Rules

- all controls, hints, warnings, empty-state text, and result summaries use Chinese in v1
- the shell must still tolerate future multilingual expansion without redesign
