# WebDAV Sync Spec

## Goal

Define versioned upload and restore behavior for bookmark snapshots and draft snapshots.

## Cloud Paths

```text
/bookmarks/latest.json
/bookmarks/versions/<timestamp>.json
/drafts/latest.json
/drafts/versions/<timestamp>.json
```

## Rules

- bookmarks and drafts are stored separately
- only newest five versions are retained per category
- cloud actions are disabled until WebDAV config exists and passes test

## Restore Contract

- restoring to browser bookmarks overwrites current browser data
- restoring to draft overwrites current draft data
- both restore targets require matching local pre-restore backup generation first

## Test Points

- upload success updates latest pointer
- prune leaves only five versions
- restore is blocked when no valid WebDAV config exists
