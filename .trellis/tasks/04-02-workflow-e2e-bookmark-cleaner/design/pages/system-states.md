# System States Page

## Purpose

Collect non-happy-path UI states that were previously only implied.

## Empty Bookmark State

- trigger:
  - no user bookmark nodes available to render
- required UI:
  - empty canvas illustration or light placeholder
  - explanation text
  - action to refresh browser snapshot
  - optional action to create first draft node

## WebDAV Disabled State

- trigger:
  - missing config
  - host permission missing
  - connectivity test failed
- required UI:
  - disabled cloud buttons remain visible
  - blocker reason appears near the relevant controls

## Sync Failure State

- trigger:
  - browser write failure
  - upload failure
  - restore failure
- required UI:
  - readable error message first
  - expandable technical detail second
  - status bar mirrors the failure

## Sync Warning State

- trigger:
  - sync draft to browser bookmarks
  - restore snapshot to browser bookmarks
- required UI:
  - explicit overwrite wording
  - reminder that `Ctrl+Z` cannot undo completed browser writes

## Search Empty Result State

- trigger:
  - no title or URL match
- required UI:
  - friendly no-result copy
  - quick clear action
  - graph remains mounted

## Duplicate Hover Overflow State

- trigger:
  - duplicate bookmark count is greater than two
  - duplicate paths or URLs are long enough to exceed the compact hover summary height
- required UI:
  - default hover still shows duplicate count and the first two duplicate paths
  - remaining duplicate entries expand inside the same hover card
  - expanded entries use internal scrolling instead of unbounded hover-card growth
  - closing the hover card resets the duplicate list back to its default collapsed state

## Copy Rules

- all empty, disabled, warning, success, and failure state summaries use Chinese in v1
- state-specific copy stays under the same centralized copy boundary as the rest of the workspace so future multilingual expansion does not force state-flow rewrites
