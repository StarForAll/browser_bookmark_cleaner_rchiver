# System States Page

## Purpose

Define the non-happy-path and edge-state presentation shared across the workspace.

## Empty Browser Data State

### Trigger

- browser read returns no user bookmark nodes

### Required UI

- graph workspace stays mounted
- status area indicates that current browser bookmark data is empty
- draft workspace copy makes it clear that draft editing or node creation may still continue
- the empty-canvas hint area can open the root-create flow without requiring a dedicated action button
- search and duplicate controls remain visible but inactive until usable data exists

## WebDAV Unavailable State

### Trigger

- WebDAV config missing
- host permission missing
- connectivity test failed

### Required UI

- cloud buttons remain visible
- unavailable expression may stay generic at the page level
- the status area keeps the latest failure or unavailable result visible

## Undo Overwrite Unavailable State

### Trigger

- neither browser-target nor draft-target overwrite backup is currently available

### Required UI

- the top-right `undo overwrite operation` entry remains visible
- the entry is disabled instead of hidden
- in v1, hover feedback uses:
  - `当前没有进行覆盖操作，不能进行撤销覆盖操作`
- if only one target is unavailable, the chooser still opens and the unavailable target stays disabled with its own reason

## Overwrite Confirmation State

### Trigger

- overwrite current draft from browser bookmarks
- sync current draft to browser bookmarks
- restore a WebDAV draft version to the current draft
- restore a WebDAV bookmark version to browser bookmarks

### Required UI

- all four actions use the same confirmation-dialog structure
- action-specific wording explains source, target, and overwrite result
- browser-target actions remind the user that `Ctrl+Z` does not revert completed browser writes

## Completed Failure State

### Trigger

- browser overwrite failed
- browser sync failed
- WebDAV upload failed
- WebDAV restore failed
- local backup generation failed

### Required UI

- one status-history entry is written only after execution finishes
- the entry shows:
  - action description
  - action time
  - result
  - short failure reason
- newest entries stay first
- closing the popup does not delete the newest-three history

## Search No-Result State

### Trigger

- search query returns no match

### Required UI

- no-result copy is friendly, not error-like
- graph remains mounted
- the user can clear the query quickly
- duplicate-only mode context remains understandable when active

## Duplicate Hover Overflow State

### Trigger

- duplicate count is greater than two

### Required UI

- default hover still shows duplicate count and the first two paths
- the remaining duplicate paths expand inline in the same hover card
- expanded content uses scrolling instead of unbounded height growth
- closing the hover card resets the expanded state

## Copy Rules

- all empty, unavailable, warning, success, and failure summaries use Chinese in v1
- state copy remains under the centralized copy boundary
