# Draft to Browser Sync Spec

## Goal

Define how the app overwrites the managed browser bookmark tree with the current draft graph.

This flow exists so the user can explicitly apply current draft edits to real browser bookmarks.

The flow belongs to Step 2 functional specification and is independent from WebDAV sync and the separate browser-to-draft overwrite flow.

## Inputs

- current draft graph
- browser-type local restore backup capability
- current managed browser bookmark roots
- Chrome bookmark API write contract

## Outputs

- browser bookmark mutation plan derived from the current draft graph
- new browser-type local restore backup created from the pre-sync browser state
- sync result status

## Entry and Confirmation

- this flow is triggered by an explicit user action
- it uses one dedicated top-right "sync current draft to browser bookmarks" action entry
- it does not share a button with WebDAV upload or browser-to-draft overwrite
- the action is disabled when the current draft is empty
- browser writability is validated at execution time, not only through pre-disabled UI state

Before execution, the UI must show an explicit confirmation that states:

- the current draft will overwrite the current browser bookmarks
- the current browser bookmark structure and content will be replaced inside the managed bookmark scope
- the current draft itself will not be cleared or rebuilt by this flow
- a browser-type local backup will be created first
- the previous browser bookmark state can later be restored through the browser-backup recovery entry

## Rules

- sync source data always comes from the current draft graph
- sync uses the latest in-memory draft state and does not require a separate draft-save action first
- sync ignores view-only state:
  - expanded/collapsed state
  - node positions
  - selected node
  - search query
  - duplicate-only mode
  - viewport position
- before browser write starts, the draft graph must be converted into browser-bookmark write data that follows the official Chrome bookmark API contract
- invalid sync data is determined by the official Chrome bookmark API requirements, not by app-local guesswork
- sync is an overwrite flow, not a merge flow
- sync scope is limited to the managed browser bookmark root set already represented by the current draft
- browser areas outside the managed draft root set must not be modified by this flow
- the implementation may use a mutation plan instead of full delete-and-rebuild, but the final managed browser structure must match the current draft graph
- sync must be blocked before browser writes begin if:
  - browser-type local backup generation fails
  - graph-to-browser conversion fails
  - Chrome-contract validation fails
  - current managed browser scope cannot be read

## Failure and Rollback

- if sync fails before browser writes begin:
  - browser bookmarks remain unchanged
  - current draft remains unchanged
- browser writes are not treated as absolutely transactional in v1
- before browser write steps begin, the app may capture an operation-scoped temporary rollback snapshot of the current browser state
- that temporary rollback snapshot is not treated as the persisted local restore backup
- if browser writes fail after execution has started:
  - the app must stop further write steps
  - the app must attempt best-effort rollback to the pre-sync browser state
- failure outcomes must be distinguishable:
  - sync failed but automatic rollback succeeded
  - sync failed and automatic rollback also failed
- current draft must remain editable after any sync failure, even when browser rollback also fails

## Backup, Undo, and UI State

- before sync execution, the app must create a new browser-type local restore backup
- the new backup writes to the `latest-browser-backup` slot
- the old browser backup is replaced only after the new browser backup is written successfully
- the backup metadata for this flow must include:
  - `triggerAction = sync-draft-to-browser`
  - `sourceOrigin = draft-sync`
- successful sync does not clear current draft undo history
- `Ctrl+Z` after a successful sync still changes draft only and does not automatically revert browser bookmarks
- if the user undoes later draft changes, the draft may diverge from browser bookmarks again until the user explicitly syncs another time
- successful or failed sync does not reset current draft workspace view state:
  - selected node
  - search query
  - duplicate-only mode
  - expanded/collapsed state
  - node positions
  - viewport position

## Status Feedback

- after user confirmation, the app enters an in-progress sync state
- completion feedback is written into the bottom-right status history
- each completed status entry includes:
  - action description
  - action time
  - action result
- failed entries also include a short failure reason
- the status-history UI keeps the newest three completed entries with newest first
- completion feedback must distinguish at least:
  - sync succeeded
  - sync failed and automatic rollback succeeded
  - sync failed and automatic rollback failed
  - sync was blocked before execution started

## Relationship to Other Specs

- graph normalization and draft-content invariants come from `bookmark-graph.md`
- browser backup generation and backup-slot rules come from `history-and-recovery.md`
- this flow is separate from `browser-draft-overwrite.md`
- this flow is separate from `webdav-sync.md`

## Test Points

- sync starts only from a non-empty draft
- sync confirmation clearly states that current draft overwrites browser bookmarks inside the managed scope
- sync first creates a browser-type local restore backup
- failed browser backup generation blocks all browser writes
- sync conversion follows the Chrome bookmark API contract before write steps begin
- invalid converted bookmark data blocks sync before browser writes begin
- successful sync updates the managed browser bookmark scope to match the current draft graph
- successful sync does not clear draft undo history
- successful sync does not reset current draft workspace view state
- failed browser sync attempts best-effort rollback to the pre-sync browser state
- browser areas outside the managed draft root set are not modified by this flow
