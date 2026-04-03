# History and Recovery Spec

## Goal

Separate draft undo from restore rollback.

This spec covers:

- which graph actions produce undo history
- when local restore backups must be created
- how local backup recovery behaves for browser bookmarks and draft state
- how failure handling differs between draft recovery and browser recovery

## Undo History

- scope: draft only
- trigger: every content mutation in the graph
- action: `Ctrl+Z` reverts one mutation step

### Undo Triggers

Undo history is created for draft content mutations only:

- create node
- edit node title
- edit bookmark URL
- move node
- delete node or subtree

Undo history is not created for view-only changes:

- expanded/collapsed toggle
- node position change
- viewport movement
- search query changes
- duplicate-only mode toggle changes

### Undo Boundaries

- `Ctrl+Z` reverts only the most recent draft content mutation
- `Ctrl+Z` never reverts:
  - browser write-back
  - WebDAV upload
  - WebDAV restore
  - local backup generation

## Restore Backup

- scope: overwrite operations only
- objects:
  - browser bookmark restore backup
  - draft restore backup
- retention: latest one per object type

### Backup Triggers

Local restore backup must be created before:

- restoring a WebDAV version to browser bookmarks
- restoring a WebDAV version to the current draft
- syncing the current draft to browser bookmarks
- overwriting the current draft from the current browser bookmark tree

Local restore backup is not created for:

- normal draft editing
- uploading browser bookmarks to WebDAV
- uploading draft data to WebDAV
- search, filter, layout, expand/collapse, or other view-only actions

### Cloud Version Context

- WebDAV keeps the newest five complete versions per object type
- bookmark versions and draft versions are retained separately
- when a sixth version is created for one type, the oldest version of that same type is removed

### Local Backup Retention

- local restore backup is replaced only after the new backup has been written successfully
- the previous local backup must remain untouched if the new backup write fails
- only the newest one local backup is retained for each object type

### Local Backup Slot Model

Persisted local restore backups are stored in only two logical slots:

- `latest-draft-backup`
- `latest-browser-backup`

Rules:

- slots are separated by target object type, not by source origin
- a newer draft-type backup replaces the older `latest-draft-backup` slot after successful write
- a newer browser-type backup replaces the older `latest-browser-backup` slot after successful write
- source differences are preserved in metadata only, not by keeping multiple persisted backups of the same target type

### Local Recovery Entry Points

- the page exposes two separate recovery actions:
  - restore browser backup
  - restore draft backup
- each action is disabled if no matching local backup exists
- each action is also disabled if the matching local backup exists but fails structural validation
- each recovery entry must display at least:
  - backup created time
  - backup source origin
  - source version label when available

### Local Backup Availability Rules

Browser-backup recovery is available only when:

- matching metadata exists
- `artifactType = browser-restore-backup`
- payload exists and parses successfully
- payload satisfies the minimum bookmark-tree structure rules

Draft-backup recovery is available only when:

- matching metadata exists
- `artifactType = draft-restore-backup`
- payload exists and parses successfully
- payload satisfies the minimum draft-graph structure rules

### Backup Metadata

Each local backup metadata record must include at least:

- `artifactId`
- `artifactType`
- `schemaVersion`
- `createdAt`
- `payloadFormat`
- `storageKey`
- `sizeBytes`
- `sourceObjectType`
- `targetObjectType`
- `triggerAction`
- `sourceOrigin`
- `sourceVersionId`
- `sourceVersionLabel`

`sourceOrigin` is limited to:

- `webdav-bookmark-version`
- `webdav-draft-version`
- `draft-sync`
- `browser-current-tree`

Backup source combinations currently allowed:

- `draft-restore-backup` from `webdav-draft-version`
- `draft-restore-backup` from `browser-current-tree`
- `browser-restore-backup` from `webdav-bookmark-version`
- `browser-restore-backup` from `draft-sync`

### Recovery Semantics

- restoring a browser backup restores browser bookmark data
- restoring a draft backup restores draft data
- a successful local backup recovery shows a confirmation dialog or prompt
- successful local backup recovery does not create a new persisted local restore backup
- a local backup recovery may still use an operation-scoped temporary rollback snapshot when needed for failure handling

### Failure Policy

- any overwrite operation that requires local restore backup must stop immediately if backup generation fails
- when backup generation fails:
  - the overwrite action is blocked
  - current browser bookmarks remain unchanged
  - current draft state remains unchanged
  - the previous local backup remains unchanged
- failure feedback must be layered:
  - readable error first
  - expandable technical detail second

### Recovery Failure Handling

Draft recovery rules:

- draft recovery is strong-transactional in v1
- if draft recovery fails, the draft must remain in its pre-recovery state

Browser recovery rules:

- browser recovery may use an operation-scoped temporary rollback snapshot of the pre-recovery browser state
- that temporary rollback snapshot is not treated as the persisted local restore backup
- if browser recovery fails during write steps:
  - the app must stop further write steps
  - the app must attempt best-effort rollback to the pre-recovery browser state
- browser recovery therefore targets best-effort rollback, not absolute transactional guarantees

## Test Points

- deleting a node can be undone with `Ctrl+Z`
- restoring a WebDAV version first creates a local backup
- backup restore can recover the pre-overwrite state
- draft-content undo is not created for search, filter, layout, or expand/collapse changes
- syncing draft to browser bookmarks first creates a browser-type local restore backup
- overwriting current draft from browser bookmarks first creates a draft-type local restore backup
- a failed backup generation blocks the overwrite action and preserves the previous local backup
- browser backup recovery and draft backup recovery are exposed as separate actions
- a structurally invalid local backup disables its matching recovery action
- failed draft recovery keeps the original draft unchanged
- failed browser recovery attempts best-effort rollback to the pre-recovery browser state
