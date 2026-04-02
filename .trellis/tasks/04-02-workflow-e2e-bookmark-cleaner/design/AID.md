# AID

## Workspace Model

The extension page is a single focused workspace with four persistent zones:

1. Top bar
   - page title
   - sync to browser
   - save draft to WebDAV
   - sync bookmarks to WebDAV
   - auto-layout reset
   - WebDAV test button

2. Left utility rail or top utility strip
   - search
   - duplicate-only filter
   - shortcut reference entry

3. Main graph canvas
   - draggable nodes
   - visible selection state
   - hover card for URL and duplicate info

4. Fixed status bar
   - last sync target
   - last sync time
   - success/error status

5. Secondary surfaces
   - confirm modal for sync-to-browser
   - restore/version picker drawer or modal
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

## Component Inventory

Primary components:

- top action bar
- search bar
- duplicate-only switch
- graph node card
- hover detail card
- shortcut hint card
- fixed sync status bar

Secondary components:

- node editor modal
- create-child modal
- restore version drawer/modal
- WebDAV settings drawer/modal
- sync-to-browser warning modal
- toast
- expandable technical detail panel

## Interaction Rules

- Double click: enter edit mode
- Enter on selected node: open create-child dialog
- Ctrl+Z: undo one draft mutation
- Delete/Backspace: delete selected node and subtree
- Drag and drop: move node under another folder node
- Sync to browser: always requires explicit warning/confirm step
- Restore from WebDAV: always chooses source artifact and restore target explicitly

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
- Success actions produce toast + status bar update
- Failed actions produce readable error + expandable raw detail
- Disabled cloud actions always explain whether the blocker is missing config, missing host access, or failed connectivity test

## Default Layout

- Must favor readability over density
- Root-level folders should not overlap
- Re-layout button restores the recommended layout without changing graph content

## State Views

### Empty bookmark state

- Show a friendly empty canvas instead of a broken graph
- Keep search/filter visible but disabled when they have no target data
- Offer direct actions to refresh bookmarks or create a first draft node

### WebDAV unavailable state

- Keep cloud buttons visible but disabled
- Show the exact unmet prerequisite near the action area

### Browser sync warning state

- Show overwrite semantics clearly before applying draft changes to browser bookmarks
- State explicitly that `Ctrl+Z` does not revert already-applied browser writes

### Restore picker state

- User must choose artifact type first: bookmark snapshot or draft snapshot
- User must choose restore target explicitly
- The UI must surface pre-restore backup behavior before the final confirm action
