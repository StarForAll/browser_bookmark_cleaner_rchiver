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
- current draft persistence: one full draft snapshot
- undo persistence: patch-based entries
- checkpoint policy: periodic full draft snapshot checkpoints are allowed

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

### Undo Storage Model

- the current draft is always persisted as a complete draft snapshot
- each undoable mutation writes one patch-oriented undo entry rather than a full-tree duplicate snapshot
- periodic checkpoint snapshots may be written after an implementation-defined number of undoable mutations
- checkpoint snapshots are part of draft durability and replay control, not part of the user-visible local restore-backup feature
- if local storage pressure requires trimming, the system should trim oldest undo patches first while preserving:
  - the latest current-draft snapshot
  - the latest valid checkpoint snapshot when one exists

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

- the workspace exposes one unified recovery entry for undoing overwrite operations
- opening that entry reveals two target-specific recovery choices:
  - undo overwrite on browser bookmarks
  - undo overwrite on current draft
- the top-level recovery entry is disabled when neither target has a matching valid local backup
- each target-specific recovery choice is disabled if no matching local backup exists
- each target-specific recovery choice is also disabled if the matching local backup exists but fails structural validation
- each recovery choice must display at least:
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

`sourceObjectType` must remain semantically consistent with `sourceOrigin`:

- `webdav-draft-version` -> `draft`
- `browser-current-tree` -> `browser`
- `webdav-bookmark-version` -> `browser`
- `draft-sync` -> `draft`

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
- current draft persistence uses a full snapshot, not patch-only state
- undo entries use patch storage rather than duplicating the full draft graph per step
- periodic checkpoint snapshots do not change user-visible overwrite-recovery semantics
- syncing draft to browser bookmarks first creates a browser-type local restore backup
- overwriting current draft from browser bookmarks first creates a draft-type local restore backup
- a failed backup generation blocks the overwrite action and preserves the previous local backup
- browser backup recovery and draft backup recovery are exposed as separate choices under one undo-overwrite entry
- a structurally invalid local backup disables its matching recovery action
- failed draft recovery keeps the original draft unchanged
- failed browser recovery attempts best-effort rollback to the pre-recovery browser state
