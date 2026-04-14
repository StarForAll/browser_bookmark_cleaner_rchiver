# DDD

## Domain Objects

## Domain Truth Boundary

- The normalized draft graph is the only editable source of truth in the workspace
- Tree views, graph views, duplicate views, and search results are derived from the normalized draft graph
- The app does not maintain one tree truth and one graph truth in parallel

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

### SystemRootContainer

Represents Chrome-provided structural root containers that anchor bookmark content import and export.

Rules:

- system root containers are fixed structural anchors, not normal editable business nodes
- normal rename, move, delete, and create-child semantics apply to user bookmark content beneath the managed roots, not to the system root containers themselves
- browser write-back and browser-to-draft overwrite use the managed root set derived from these fixed containers

### DraftState

- `nodesById`
- `rootIds`
- `selectedNodeId`
- `searchQuery`
- `duplicateFilterEnabled`
- `lastAutoLayoutAt`
- `snapshotVersion`

Rules:

- `nodesById` plus `rootIds` form the durable content truth for the current draft
- derived render data must not become a second persisted content truth

### UndoEntry

- `timestamp`
- `mutationType`
- `affectedNodeIds`
- `beforeStatePayload`
- `afterStatePayload`
- `storageMode`: `patch`

Rules:

- Each draft content change creates one undo entry
- Undo entries only apply to the draft layer
- Undo entries use patch storage mode in v1
- Undo entries describe semantic mutations such as `create-node`, `move-node`, `rename-node`, `delete-subtree`, and `edit-bookmark-url`

### DraftCheckpoint

- `createdAt`
- `snapshotVersion`
- `storageKey`
- `sizeBytes`

Rules:

- Checkpoints store complete draft snapshots
- Checkpoints exist to shorten undo replay distance and reduce local recovery risk
- Checkpoint cadence is an implementation detail, but the product model allows periodic checkpoint creation

### WebDAVProfile

- `endpointUrl`
- `username`
- `password`
- `lastTestedAt`
- `lastTestStatus`

Rules:

- WebDAV profile data belongs to a sensitive configuration domain
- sensitive configuration must not be treated like ordinary draft, layout, or status-history data
- secret-bearing values must stay out of user-visible status messages and technical-detail expansions

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

Rules:

- persisted backup artifacts, checkpoints, and cloud snapshots are versioned data assets rather than throwaway implementation details
- backup metadata and backup payloads are allowed to evolve by explicit schema versioning only

## Duplicate Detection

- Duplicates are defined strictly by full URL equality
- Title does not participate in duplicate matching
- UI surfaces human-readable duplicate paths, not internal IDs

## Identity Strategy

- Existing browser nodes use Chrome-derived source identity mapped into internal IDs
- Newly created draft nodes use generated draft IDs
- Merge and sync logic always operates on internal IDs, never UI labels
