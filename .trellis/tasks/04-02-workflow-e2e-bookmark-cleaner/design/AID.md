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

## Interaction Rules

- Double click: enter edit mode
- Enter on selected node: open create-child dialog
- Ctrl+Z: undo one draft mutation
- Delete/Backspace: delete selected node and subtree
- Drag and drop: move node under another folder node

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

## Default Layout

- Must favor readability over density
- Root-level folders should not overlap
- Re-layout button restores the recommended layout without changing graph content
