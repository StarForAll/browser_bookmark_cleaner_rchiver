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
   - product-owned mindmap branches
   - hover detail

4. Canvas-side operation hint area
   - always-visible low-emphasis help block
   - one line per operation hint
   - mouse and keyboard operations in one unified list

5. Canvas-side result area
   - latest-result popup
   - close action
   - reopen anchor
   - newest-three history

Current implementation snapshot:

- when startup restores or imports a draft, the graph canvas renders the real draft workspace rather than a placeholder card
- the visual virtual root is already rendered as a view-only anchor at the left side of the draft graph
- the operation hint area and status result area are rendered together inside the canvas side rail
- drag, create, edit, delete, reorder, and promote interactions are implemented for the current draft
- search / duplicate focus and duplicate-path hover expansion remain future task scope

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

## Virtual Root Node

The graph canvas renders a single visual root node at the leftmost position. It connects all actual root branches into one unified tree.

Constraints:
- Purely a view-layer decoration; no backing entry in `nodesById` or any persistence contract
- Cannot be selected, edited, deleted, or have children created under it
- Does not respond to hover, click, double-click, or keyboard events
- Excluded from all sync, upload, restore, overwrite, and browser write-back operations
- Excluded from draft mutation, undo history, and checkpoint operations
- Must not be treated as a business node by any downstream consumer

## Core Workspace Behaviors

Unless a line is explicitly marked as future scope, the draft-editing behaviors below describe the current accepted workspace baseline.

### Draft editing

- select node
- double click to edit
- `Enter` on a selected folder node to create a child
- `Shift + Enter` on a selected node to create a sibling, including a new top-level root
- `Delete` or `Backspace` to remove node or subtree
- deleting a folder with multiple direct child nodes requires a secondary confirmation dialog
- `ArrowUp / ArrowDown` reorder the selected node within the current level
- `ArrowLeft` promotes the selected node by one level
- drag moves and reorders the current draft only
- `Ctrl+Z` remains future task scope rather than the current workspace baseline

### Search and duplicate focus

- search matches title and URL only
- duplicate-only mode filters the current draft view
- search and duplicate-only mode can coexist

Current implementation note:

- search and duplicate-only mode are still future task scope
- the workspace currently keeps the dedicated UI entry points visible but disabled

### Hover information

- all hover cards show title, node type, and full path
- bookmark-node hover also shows URL
- duplicate bookmark hover shows:
  - duplicate total count
  - first two duplicate paths by default
  - inline expand-more when more than two exist

Current implementation note:

- title, node type, full path, and bookmark URL are implemented
- duplicate-count and duplicate-path expansion remain future task scope

## Secondary Surfaces Opened From The Workspace

- node editor
- create-child flow
- create-root flow
- delete-confirm flow
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

- the canvas-side operation hint area is always visible
- it must stay low-emphasis enough to avoid competing with the graph canvas
- it must still remain readable when the user looks for guidance
- the area shows one-line-per-item operation hints
- the current implemented hint set is:
  - click: select node
  - double click: edit node
  - `Enter`: create child node under the selected folder
  - `Shift + Enter`: create sibling node
  - `ArrowUp / ArrowDown`: reorder within current level
  - `ArrowLeft`: promote one level
  - `Delete / Backspace`: delete node
  - hover: view node details

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
- routine draft editing actions such as create-child, node edit, and delete do not enter this status history

Current implementation note:

- the status area already persists popup-open state and the latest startup result
- newest-three retained history is still future task scope; the current implementation shows the latest persisted entry only

## Copy Rules

- all controls, hints, warnings, empty-state text, and result summaries use Chinese in v1
- the shell must still tolerate future multilingual expansion without redesign
