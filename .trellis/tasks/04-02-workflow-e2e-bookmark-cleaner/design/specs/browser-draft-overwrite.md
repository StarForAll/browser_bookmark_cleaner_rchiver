# Browser to Draft Overwrite Spec

## Goal

Define how the app refreshes the current draft by overwriting it with the current browser bookmark tree.

This flow exists so the user can discard current draft structure changes and rebuild the draft from the browser's latest bookmark state.

The flow belongs to Step 2 functional specification and is independent from WebDAV sync.

## Inputs

- current browser bookmark tree
- current draft graph
- draft-type local restore backup capability

## Outputs

- newly rebuilt draft graph derived from the current browser bookmark tree
- new draft-type local restore backup created from the pre-overwrite draft state
- overwrite result status

## Entry and Confirmation

- this flow is triggered by an explicit user action
- it uses its own dedicated action entry and does not share a button with "sync draft to browser bookmarks"
- the action may be shown when the current draft is empty or non-empty
- browser readability is validated at execution time, not only through pre-disabled UI state

Before execution, the UI must show an explicit confirmation that states:

- current browser bookmarks will overwrite the current draft
- the current draft structure and content will be replaced
- browser bookmarks themselves will not be changed by this flow
- a draft-type local backup will be created first
- the old draft can be restored later through the draft-backup recovery entry

## Rules

- this flow overwrites the current draft; it is not a merge flow
- source is always the current browser bookmark tree read in real time at execution time
- target is always the current draft
- before overwrite starts, the app must create a draft-type local restore backup from the current draft state
- if draft backup generation fails, the overwrite action is blocked
- if overwrite succeeds, the draft becomes the browser bookmark tree translated into the current draft graph structure
- overwrite rebuilds the draft completely and does not attempt node-level merge
- overwrite result must still pass through the bookmark-graph normalization boundary before becoming the new draft graph
- after a successful overwrite:
  - expanded/collapsed state is reset
  - node positions are reset
  - selected node is cleared
  - search query is cleared
  - duplicate-only mode is cleared
  - previous undo history is cleared
- if overwrite fails, the draft must remain in its pre-overwrite state
- this flow follows the same draft-side strong consistency rule used by restore-to-draft
- this flow does not write anything back to browser bookmarks
- this flow does not create WebDAV versions by itself
- the persisted local backup written by this flow replaces the current draft-backup slot only after the new backup write succeeds
- the persisted draft-backup slot is shared with other draft-overwrite sources and therefore always keeps only the newest draft-type backup regardless of source origin

## Backup Slot and Recovery Visibility

- this flow writes into the shared `latest-draft-backup` slot
- that slot may have been produced by:
  - WebDAV draft restore pre-backup
  - browser-to-draft overwrite pre-backup
- after this flow writes a new draft backup successfully, any older draft backup in that shared slot is replaced
- the draft-backup recovery UI must show at least:
  - backup created time
  - backup source origin
  - source version label when available

## Failure Policy

- backup generation failure blocks the overwrite action completely
- browser bookmark read failure blocks the overwrite action completely
- normalization or draft replacement failure must keep the original draft unchanged
- if failure happens before draft replacement begins:
  - current draft remains unchanged
  - current view state remains unchanged
  - current undo history remains unchanged
- if failure happens after replacement has started:
  - the app must restore the pre-overwrite draft state
- failure feedback uses:
  - readable error first
  - expandable technical detail second

## Success Feedback

- on success, the UI should clearly state that the draft has been rebuilt from the current browser bookmark tree
- on success, the UI should also remind the user that the previous draft can be restored from the local draft backup entry

## Relationship to Other Specs

- graph normalization behavior comes from `bookmark-graph.md`
- local backup and rollback boundaries come from `history-and-recovery.md`
- this flow is separate from `webdav-sync.md`

## Test Points

- starting browser-to-draft overwrite first creates a draft-type local restore backup
- successful overwrite replaces the current draft with a draft graph rebuilt from the current browser bookmark tree
- failed backup generation prevents any draft overwrite
- failed overwrite keeps the original draft unchanged
- browser-to-draft overwrite does not mutate browser bookmarks
- browser-to-draft overwrite does not create or upload WebDAV snapshots
- successful overwrite clears the previous undo history and resets draft-related view state
- the latest draft-backup slot is replaced only after a new draft backup is written successfully
