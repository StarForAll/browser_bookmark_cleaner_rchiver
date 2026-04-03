# ODD

## Operational Flows

### Flow 1: Load workspace

1. Read current browser bookmark tree
2. Normalize into draft graph
3. Load local expanded state and layout coordinates
4. Render default or saved layout
5. Resolve system-visible page copy from the centralized Chinese-first copy source

### Flow 2: Edit draft

1. User edits, creates, drags, or deletes a node
2. Draft graph updates locally
3. Undo history entry is persisted
4. Browser bookmark tree remains unchanged

### Flow 3: Apply draft to browser bookmarks

1. User clicks sync to browser
2. System shows overwrite warning and scope reminder
3. User confirms the browser write action
4. System converts the draft graph into browser bookmark mutations
5. Chrome bookmark write runs
6. Status bar records success or failure

Rules:

- This flow never runs silently
- `Ctrl+Z` does not revert already-applied browser writes

### Flow 4: Sync browser bookmarks to WebDAV

1. Verify WebDAV config exists and last test is usable
2. Build current browser snapshot
3. Upload version to `/bookmarks/`
4. Prune older versions beyond five
5. Update success state in status bar

### Flow 5: Save draft to WebDAV

1. Serialize current draft graph
2. Upload version to `/drafts/`
3. Prune older versions beyond five
4. Update success state in status bar

### Flow 6: Restore from WebDAV

1. User picks source type and target type
2. System creates corresponding local one-file restore backup
3. System downloads selected remote version
4. System overwrites target state
5. UI updates and status is recorded

### Flow 7: Empty bookmark workspace

1. Browser bookmark read returns only structural roots or no user bookmark nodes
2. System renders an empty-state workspace instead of an error
3. User can still open settings, test WebDAV, or create the first draft node
4. Search and duplicate-only filter stay visible but inactive until data exists

## Failure Policy

- No silent failure
- All failures update the fixed status bar
- Readable message first, technical detail second
- Failed remote actions do not mutate unrelated local state
- Cloud actions stay disabled when config, host access, or connectivity prerequisites are missing
- Empty, warning, success, and error states all follow the same centralized copy boundary so future multilingual expansion does not change the control flow design

## Rollback Policy

- Draft mistakes: use undo history
- Restore mistakes: use local latest backup
- Remote history mistakes: select an older WebDAV version and restore again
- Browser write mistakes: not covered by `Ctrl+Z`; recover through explicit restore flows
