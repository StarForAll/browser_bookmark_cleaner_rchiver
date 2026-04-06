# AID

## Workspace Model

The extension page is a single focused workspace with five persistent zones plus one secondary-surface layer:

1. Top bar
   - page title
   - overwrite current draft from browser bookmarks
   - sync current draft to browser bookmarks
   - upload current draft to WebDAV
   - upload current browser bookmarks to WebDAV
   - restore a WebDAV draft version to the current draft
   - restore a WebDAV bookmark version to browser bookmarks
   - undo overwrite operation
   - auto-layout reset
   - WebDAV test button

2. Search and focus strip
   - search
   - duplicate-only filter

3. Main graph canvas
   - product-owned mindmap node cards and SVG branches
   - visible selection state
   - hover card for URL and duplicate info
   - duplicate hover summary with inline expand-more behavior

4. Top-right floating operation hint panel
   - always-visible low-emphasis operation guidance
   - mouse actions and keyboard actions in one list
   - one-line-per-item layout

5. Bottom-right status popup and history anchor
   - latest action result popup
   - close action
   - reopen entry after close
   - newest-three history list
   - success/error result with short failure reason when applicable

6. Secondary surfaces
   - shared confirmation modal for overwrite-risk actions
   - restore-version picker for draft restore
   - restore-version picker for browser-bookmark restore
   - undo-overwrite target chooser and recovery confirmation
   - inline empty-state panel when no user bookmark nodes are available

## Visual Direction

Reference source:

- `tmp/ui/metadata.json`
- `tmp/ui/src/App.tsx`
- `tmp/ui/src/index.css`

Approved design direction:

- editorial productivity workspace, not admin dashboard
- warm light surface with tactile card depth
- low-saturation slate / blue-green accent instead of high-energy neon colors
- calm, premium, information-dense layout with visible breathing space

Mandatory adjustments for the real product:

- UI copy is Chinese by default
- layout must tolerate future English and multilingual expansion
- remove any dependency on decorative English branding such as `The Silent Curator`
- visual direction may borrow atmosphere from `tmp/ui`, but implementation must be product-specific
- system-visible copy should come from centralized product copy resources, not scattered inline strings

## Component Inventory

Primary components:

- top action bar
- search bar
- duplicate-only switch
- graph node card
- hover detail card
- operation hint panel
- bottom-right status popup
- latest-result history anchor

Secondary components:

- node editor modal
- create-child modal
- delete-confirm modal
- restore draft version drawer/modal
- restore browser version drawer/modal
- WebDAV settings drawer/modal
- shared overwrite confirmation modal

## Interaction Rules

- Double click: enter edit mode
- Enter on selected folder node: open create-child dialog
- Delete/Backspace: delete selected node and subtree; folders with multiple direct child nodes require a shared delete-confirm dialog first
- Main graph workspace always represents the current draft only
- Current T06 baseline does not expose drag-and-drop or `Ctrl+Z` in the workspace hint set; those remain later-task scope
- The seven top-right action buttons must be understandable from button text alone
- Sync current draft to browser bookmarks: always requires explicit warning/confirm step
- Overwrite current draft from browser bookmarks: always requires explicit warning/confirm step
- Restore draft from WebDAV: always uses its own dedicated restore action and warning/confirm step
- Restore browser bookmarks from WebDAV: always uses its own dedicated restore action and warning/confirm step
- Undo overwrite operation: opens a target chooser instead of directly running recovery
- Undo overwrite operation stays disabled when neither browser-target nor draft-target overwrite backup is available

## Virtual Root Node

The graph canvas renders a single visual root node at the leftmost position that connects all actual root branches. This node:

- Is **purely a view-layer decoration** with no backing data model entry
- Does **not** exist in `nodesById`, `rootIds`, or any persistence contract
- Cannot be selected, edited, deleted, or have children created under it
- Does not respond to hover, click, double-click, or keyboard events
- Is **excluded** from all sync, upload, restore, overwrite, and browser write-back operations
- Is **excluded** from draft mutation, undo history, and checkpoint operations
- Must not be treated as a business node by any downstream consumer (persistence, sync, export, import)
- Its sole purpose is to provide a unified visual anchor for the mindmap layout

## Edit Dialog Rules

### Folder node

- editable: title
- hidden/disabled: URL

### Bookmark node

- editable: title, URL
- URL is required

### Type selection

- only available during create-child flow
- locked during edit flow

## Visual Feedback

- Hover cards surface friendly path-based duplicate information
- duplicate hover applies only to bookmark nodes with duplicate URLs, not to repeated folder titles
- duplicate hover shows duplicate count plus the first two duplicate paths by default, and the current hovered node is included in that default slice
- when duplicate count is greater than two, remaining entries expand inside the same hover card instead of opening a separate surface
- duplicate path labels stay human-readable and may use order suffixes like `#1` and `#2` when path text alone is not enough to distinguish entries
- Completed actions create a bottom-right status entry with action description, action time, and result
- Failed actions also include a short failure reason in the same status entry
- The status popup can be closed and later reopened from the latest-result anchor
- The status area retains the newest three entries with newest first
- Cloud-unavailable presentation does not need exception-type-specific UI branching at the prototype-validation level

## Default Layout

- Must favor readability over density
- Root-level folders should not overlap
- Re-layout button restores the recommended layout without changing graph content

## State Views

### Empty bookmark state

- Show a friendly empty canvas instead of a broken graph
- Keep search/filter visible but disabled when they have no target data
- Use the status area to indicate that current browser bookmark data is empty
- Keep the draft workspace messaging explicit that draft editing or node creation can still continue

### WebDAV unavailable state

- Keep cloud buttons visible but disabled
- Show a generic unavailable state and rely on the status area for recent failure logs

### Undo overwrite unavailable state

- Keep the undo-overwrite button visible in the top bar
- Disable it when no undoable overwrite backup exists for either target
- Hover feedback must explain that there is currently no overwrite operation that can be undone

### Browser sync warning state

- The same shared confirmation dialog pattern is reused for all overwrite-risk actions
- Warning copy must state overwrite semantics clearly before applying draft changes to browser bookmarks
- Warning copy must state explicitly that `Ctrl+Z` does not revert already-applied browser writes

### Restore picker state

- Restore entry is already fixed by the action button the user chose
- The restore picker only needs to show versions for that already-fixed restore path
- The UI must surface pre-restore backup behavior before the final confirm action
