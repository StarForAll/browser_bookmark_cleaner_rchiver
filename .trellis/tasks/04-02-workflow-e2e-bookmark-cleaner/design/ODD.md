# ODD

## Operational Flows

### Flow 1: Load workspace

1. Read current browser bookmark tree
2. Normalize into draft graph
3. Load local expanded state and layout coordinates
4. Render default or saved layout

### Flow 2: Edit draft

1. User edits, creates, drags, or deletes a node
2. Draft graph updates locally
3. Undo history entry is persisted
4. Browser bookmark tree remains unchanged

### Flow 3: Sync browser bookmarks to WebDAV

1. Verify WebDAV config exists and last test is usable
2. Build current browser snapshot
3. Upload version to `/bookmarks/`
4. Prune older versions beyond five
5. Update success state in status bar

### Flow 4: Save draft to WebDAV

1. Serialize current draft graph
2. Upload version to `/drafts/`
3. Prune older versions beyond five
4. Update success state in status bar

### Flow 5: Restore from WebDAV

1. User picks source type and target type
2. System creates corresponding local one-file restore backup
3. System downloads selected remote version
4. System overwrites target state
5. UI updates and status is recorded

## Failure Policy

- No silent failure
- All failures update the fixed status bar
- Readable message first, technical detail second
- Failed remote actions do not mutate unrelated local state

## Rollback Policy

- Draft mistakes: use undo history
- Restore mistakes: use local latest backup
- Remote history mistakes: select an older WebDAV version and restore again
