# IDD

## Integration Points

### Chrome Bookmarks API

Purpose:

- Read current bookmark tree
- Apply confirmed bookmark sync back to browser

Contract:

- Read returns the full bookmark tree and node metadata available through Chrome
- Write operations are triggered only after explicit user confirmation
- Draft-only mutations never call Chrome APIs directly
- Application code consumes structured bookmark-domain results rather than raw Chrome bookmark API shapes

Failure Handling:

- If write fails, show readable error + expandable technical detail
- Preserve the current draft unchanged

### Local Persistence

Primary store: `chrome.storage.local`

Data categories:

- WebDAV profile
- Expanded/collapsed state
- Node layout coordinates
- Draft state
- Undo history
- Last local restore backup metadata
- WebDAV host-access grant state

Implementation direction:

- Local persistence is split logically into ordinary workspace state, sensitive configuration, and persisted asset categories
- v1 stores those categories in `chrome.storage.local`
- If persisted asset size or replay pressure later makes `chrome.storage.local` insufficient, large-object assets such as snapshot payloads, checkpoint payloads, or backup payloads may move to `IndexedDB` without changing the logical persistence contracts

### UI Copy Resources

Purpose:

- Provide one centralized source for system-visible product copy

Contract:

- The first release bundles Chinese copy only
- Page-level UI should read product copy from shared copy resources instead of scattering ad hoc inline strings
- Future locale additions must not require changes to bookmark, draft, sync, or WebDAV contracts

### WebDAV

Purpose:

- Store bookmark snapshot versions
- Store draft snapshot versions

Required actions:

- Request host access for the configured endpoint when needed
- Test connectivity
- Upload new version
- Download selected version
- Prune old versions to newest five

Adapter contract:

- The adapter returns structured domain results for connectivity checks, version listing, uploads, downloads, and pruning
- The adapter does not expose raw `fetch` response objects or transport-specific shapes to the application layer

File grouping:

```text
/bookmarks/
  index.json
  latest.json
  versions/<timestamp>.json
/drafts/
  index.json
  latest.json
  versions/<timestamp>.json
```

Rules:

- Bookmark and draft artifacts are separated
- Each category keeps an explicit version index manifest that drives restore lists, ordering, and metadata display
- `latest.json` stores the newest full snapshot copy, but it is not the authoritative history index
- Version files, `latest.json`, and the explicit version index manifest must stay consistent
- Cloud functions are disabled unless the WebDAV profile is configured, host access is granted, and availability checks pass
- The adapter should prefer native `fetch` over a third-party WebDAV SDK in v1

Permission contract:

- `bookmarks` permission is required for browser tree read/write
- `storage` permission is required for local state, draft state, and settings persistence
- WebDAV network access uses host permissions tied to the configured endpoint origin
- If host access is denied, the app must remain fully usable for local draft editing

Error contract:

- Adapter failures must be normalized into readable domain errors plus expandable technical detail
- Secret-bearing configuration values must not appear in readable errors or technical-detail payloads

## Integration Validation

### Good

- Test button passes and enables cloud actions
- Bookmark snapshot upload succeeds and old versions are pruned to five

### Base

- Draft snapshot download restores the draft after first creating the matching local backup

### Bad

- WebDAV unavailable but sync buttons remain enabled
- Host access denied but upload still starts
- Bookmark restore starts without local pre-restore backup generation
