# DDD

## Domain Objects

### BookmarkNode

Represents one node in the normalized graph.

Fields:

- `internalId`: stable hidden identifier
- `sourceType`: `browser` | `draft`
- `nodeType`: `folder` | `bookmark`
- `title`: string
- `url`: string | null
- `parentId`: string | null
- `childIds`: string[]
- `pathTokens`: string[]
- `position`: `{ x: number; y: number } | null`
- `isExpanded`: boolean

Rules:

- `internalId` is never shown to users
- `url` must be `null` for folders
- `url` must be non-empty for bookmarks

### DraftState

- `nodesById`
- `rootIds`
- `selectedNodeId`
- `searchQuery`
- `duplicateFilterEnabled`
- `lastAutoLayoutAt`

### UndoEntry

- `timestamp`
- `mutationType`
- `affectedNodeIds`
- `beforeStatePatch`
- `afterStatePatch`

Rules:

- Each draft content change creates one undo entry
- Undo entries only apply to the draft layer

### WebDAVProfile

- `endpointUrl`
- `username`
- `password`
- `lastTestedAt`
- `lastTestStatus`

### SyncStatus

- `target`: `browser` | `webdav-bookmarks` | `webdav-draft`
- `status`: `idle` | `running` | `success` | `error`
- `lastRunAt`
- `message`
- `technicalDetails`

### BackupArtifact

- `artifactType`: `browser-restore-backup` | `draft-restore-backup`
- `createdAt`
- `localPathKey`
- `snapshotVersion`

## Duplicate Detection

- Duplicates are defined strictly by full URL equality
- Title does not participate in duplicate matching
- UI surfaces human-readable duplicate paths, not internal IDs

## Identity Strategy

- Existing browser nodes use Chrome-derived source identity mapped into internal IDs
- Newly created draft nodes use generated draft IDs
- Merge and sync logic always operates on internal IDs, never UI labels
