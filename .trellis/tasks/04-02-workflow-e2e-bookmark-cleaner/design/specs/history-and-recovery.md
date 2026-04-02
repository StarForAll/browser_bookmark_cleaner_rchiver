# History and Recovery Spec

## Goal

Separate draft undo from restore rollback.

## Undo History

- scope: draft only
- trigger: every content mutation in the graph
- action: `Ctrl+Z` reverts one mutation step

## Restore Backup

- scope: overwrite operations only
- objects:
  - browser bookmark restore backup
  - draft restore backup
- retention: latest one per object type

## Test Points

- deleting a node can be undone with `Ctrl+Z`
- restoring a WebDAV version first creates a local backup
- backup restore can recover the pre-overwrite state
