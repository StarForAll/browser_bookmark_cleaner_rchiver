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

### WebDAV

Purpose:

- Store bookmark snapshot versions
- Store draft snapshot versions

Required actions:

- Test connectivity
- Upload new version
- Download selected version
- Prune old versions to newest five

File grouping:

```text
/bookmarks/
  latest.json
  versions/<timestamp>.json
/drafts/
  latest.json
  versions/<timestamp>.json
```

Rules:

- Bookmark and draft artifacts are separated
- Latest pointer and historical versions must stay consistent
- Cloud functions are disabled unless the WebDAV profile is configured and passes availability checks

## Integration Validation

### Good

- Test button passes and enables cloud actions
- Bookmark snapshot upload succeeds and old versions are pruned to five

### Base

- Draft snapshot download restores the draft after first creating the matching local backup

### Bad

- WebDAV unavailable but sync buttons remain enabled
- Bookmark restore starts without local pre-restore backup generation
