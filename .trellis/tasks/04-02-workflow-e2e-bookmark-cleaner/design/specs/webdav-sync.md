# WebDAV Sync Spec

## Goal

Define versioned upload and restore behavior for bookmark snapshots and draft snapshots.

This spec covers only WebDAV-backed cloud version storage and WebDAV restore flows.

It does not define the separate local browser-to-draft overwrite flow. That flow is specified in `browser-draft-overwrite.md`, even though both restore-to-draft and browser-to-draft overwrite follow the same draft-backup and failure-handling principles.

It also does not define the separate local draft-to-browser write-back flow. That flow is specified in `draft-browser-sync.md`, even though both restore-to-browser and draft-to-browser write-back follow the same browser-backup and best-effort rollback principles.

## Cloud Paths

```text
/bookmarks/latest.json
/bookmarks/versions/<timestamp>.json
/drafts/latest.json
/drafts/versions/<timestamp>.json
```

## Snapshot File Structure

Each WebDAV file, including `latest.json` and `versions/<timestamp>.json`, stores a full structured snapshot:

```ts
type WebDavSnapshot<T> = {
  schemaVersion: string
  artifactType: "bookmark-snapshot" | "draft-snapshot"
  createdAt: string
  versionId: string
  source: "browser" | "draft"
  originAction: "upload-browser-to-webdav" | "upload-draft-to-webdav"
  snapshotLabel: string | null
  payloadFormat: string
  payload: T
}
```

Rules:

- every version file stores full snapshot content, not a delta
- `latest.json` also stores a full snapshot copy, not only a pointer reference
- bookmark snapshots and draft snapshots use the same envelope shape with different `artifactType` and payload content

## Rules

- bookmarks and drafts are stored separately
- only newest five versions are retained per category
- cloud actions are disabled until WebDAV config exists and passes test
- upload-browser and upload-draft are separate actions
- each category keeps its own `latest.json` and history list

## Upload Contract

### Upload Targets

- browser bookmark upload writes only bookmark snapshots
- draft upload writes only draft snapshots

### Upload Sequence

For one successful upload:

1. write a new full history version file to `versions/<timestamp>.json`
2. update the matching `latest.json` with the same full snapshot content
3. prune versions older than the newest five for that same category

### Failure Handling During Upload

If history-version write succeeds but `latest.json` update fails:

- the overall upload is treated as failed
- the just-written history version must be deleted
- no partial retained history is allowed for this failure case

If both history-version write and `latest.json` update succeed, but prune fails:

- the new upload remains valid
- the operation result becomes `partial-success`
- user-facing feedback must state:
  - upload succeeded
  - old version cleanup failed

## Restore Contract

- restoring to browser bookmarks overwrites current browser data
- restoring to draft overwrites current draft data
- both restore targets require matching local pre-restore backup generation first

### Restore Type Boundary

- bookmark WebDAV versions can only restore to browser bookmarks
- draft WebDAV versions can only restore to current draft
- cross-type restore is not allowed

### Restore Preconditions

Cloud restore is allowed only when all of the following are true:

- WebDAV config exists
- configured WebDAV URL is valid
- host permission is granted
- latest connectivity test has passed
- remote version list was loaded successfully
- selected version type matches its only allowed local restore target
- required local pre-restore backup generation succeeds

### Restore Result Boundaries

- restore-to-browser remains an overwrite operation against current browser bookmarks
- restore-to-draft remains an overwrite operation against current draft state
- restore failure handling must follow the already-confirmed history-and-recovery rules for browser and draft recovery

## Availability and Status Rules

### Cloud Action Availability

Upload buttons are enabled only when:

- WebDAV config exists
- configured URL is valid
- host permission is granted
- latest test result is successful

Restore actions are enabled only when:

- all upload preconditions above are satisfied
- remote version list loads successfully
- selected version type is valid for its restore target

### Result Status Enum

Cloud upload and restore actions use these result states:

- `success`
- `partial-success`
- `blocked`
- `error`

Definitions:

- `success`: the requested primary action completed fully
- `partial-success`: the primary action succeeded, but cleanup such as old-version pruning failed
- `blocked`: prerequisites were not satisfied, so execution did not start
- `error`: execution started but failed before the requested primary result was achieved

## Test Points

- upload success updates latest pointer
- prune leaves only five versions
- restore is blocked when no valid WebDAV config exists
- bookmark upload writes only bookmark snapshots
- draft upload writes only draft snapshots
- `latest.json` stores a full snapshot payload, not only a reference
- if history write succeeds but `latest.json` update fails, the just-written history version is removed
- if prune fails after a successful upload, the upload result becomes `partial-success`
- bookmark cloud versions cannot restore to draft
- draft cloud versions cannot restore to browser bookmarks
- restore remains blocked when host permission, connectivity test, or remote version loading is invalid
