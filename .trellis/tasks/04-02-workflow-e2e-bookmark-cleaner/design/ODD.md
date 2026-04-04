# ODD

## Operational Flows

### Flow 1: Load workspace

1. Read current browser bookmark tree
2. Normalize into draft graph
3. Load local expanded state and layout coordinates
4. Render default or saved layout
5. Resolve system-visible page copy from the centralized Chinese-first copy source
6. Present the workspace as the current draft workspace rather than as direct live browser-bookmark editing

### Flow 2: Overwrite current draft from browser bookmarks

1. User clicks the dedicated overwrite-draft action
2. System shows the shared overwrite confirmation dialog with browser-to-draft wording
3. User confirms the overwrite
4. System creates the current draft backup
5. System reads browser bookmarks and rebuilds the draft
6. Bottom-right status history records success or failure

### Flow 3: Edit draft

1. User edits, creates, drags, or deletes a node
2. Draft graph updates locally
3. The latest full draft snapshot is refreshed in local storage
4. A patch-based undo history entry is persisted
5. When the implementation-defined checkpoint condition is met, a periodic checkpoint snapshot may also be persisted
6. Browser bookmark tree remains unchanged

### Flow 4: Apply draft to browser bookmarks

1. User clicks sync to browser
2. System shows the shared overwrite confirmation dialog with draft-to-browser wording
3. User confirms the browser write action
4. System converts the draft graph into browser bookmark mutations
5. Chrome bookmark write runs
6. Bottom-right status history records success or failure

Rules:

- This flow never runs silently
- `Ctrl+Z` does not revert already-applied browser writes

### Flow 5: Sync browser bookmarks to WebDAV

1. Verify WebDAV config exists and last test is usable
2. Build current browser snapshot
3. Upload version to `/bookmarks/`
4. Prune older versions beyond five
5. Bottom-right status history records success or failure

### Flow 6: Save draft to WebDAV

1. Serialize current draft graph
2. Upload version to `/drafts/`
3. Prune older versions beyond five
4. Bottom-right status history records success or failure

### Flow 7: Restore a WebDAV draft version to the current draft

1. User clicks the dedicated restore-draft action
2. System shows only draft-version choices
3. System shows the shared overwrite confirmation dialog with restore-to-draft wording
4. System creates the draft local backup
5. System downloads the selected remote draft version
6. System overwrites the current draft
7. Bottom-right status history records success or failure

### Flow 8: Restore a WebDAV bookmark version to browser bookmarks

1. User clicks the dedicated restore-browser action
2. System shows only bookmark-version choices
3. System shows the shared overwrite confirmation dialog with restore-to-browser wording
4. System creates the browser local backup
5. System downloads the selected remote bookmark version
6. System overwrites current browser bookmarks
7. Bottom-right status history records success or failure

### Flow 9: Empty bookmark workspace

1. Browser bookmark read returns only structural roots or no user bookmark nodes
2. System renders an empty-state workspace instead of an error
3. The status area records the empty-data situation
4. The draft workspace still explains that node creation or editing may continue
5. Search and duplicate-only filter stay visible but inactive until data exists

### Flow 10: Undo overwrite operation

1. User clicks the dedicated undo-overwrite action in the top bar
2. If neither recovery target is available, the action remains disabled and hover feedback explains why
3. If at least one recovery target is available, the system opens the local-backup chooser
4. User selects either undo-overwrite-on-draft or undo-overwrite-on-browser-bookmarks
5. System shows the dedicated recovery confirmation prompt
6. User confirms the recovery
7. System applies the stored local backup to the selected target
8. Bottom-right status history records success or failure

## Failure Policy

- No silent failure
- All completed failures update the bottom-right status history
- A failed status entry includes action description, action time, result, and short failure reason
- Failed remote actions do not mutate unrelated local state
- Cloud actions stay disabled when config, host access, or connectivity prerequisites are missing
- Empty, warning, success, and error states all follow the same centralized copy boundary so future multilingual expansion does not change the control flow design

## Rollback Policy

- Draft mistakes: use undo history
- Restore mistakes: use local latest backup
- Remote history mistakes: select an older WebDAV version and restore again
- Browser write mistakes: not covered by `Ctrl+Z`; recover through explicit restore flows

## Undo Storage Policy

- Current draft persistence uses a full snapshot
- Draft undo history uses patch entries
- Periodic checkpoints are allowed to reduce replay depth
- If local storage pressure is detected, the system should prefer trimming older undo patches before dropping the current draft snapshot
