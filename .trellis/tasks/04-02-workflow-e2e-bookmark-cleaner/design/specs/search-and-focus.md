# Search and Focus Spec

## Goal

Define how users find nodes quickly and isolate duplicate URL hotspots without losing graph context.

This spec covers only search, duplicate-hotspot focus, and their coexistence rules inside the draft graph workspace.

## Inputs

- current draft node set
- node titles
- node URLs
- duplicate URL index
- current selection and viewport position
- duplicate-only mode toggle state
- current search query

## Outputs

- search result list ordered by match priority and graph traversal order
- graph focus target for the selected result
- duplicate-only filtered view state
- duplicate-only mode status hint
- hover duplicate detail payload for bookmark nodes with duplicate URLs

## Rules

- search matches title and URL only
- search uses case-insensitive substring matching in v1
- search does not match path text, duplicate-path helper text, or hidden internal IDs
- duplicate-only mode is derived from the duplicate URL index, not hard-coded flags on nodes
- duplicate-only mode uses a dedicated duplicate-focused presentation
- duplicate nodes in duplicate-only mode surface their full paths directly in a visually readable form instead of relying on visible ancestor context nodes
- duplicate-hover behavior applies only to bookmark nodes with duplicate URLs
- folder-title repetition never counts as duplicate-node behavior in v1
- every hover card shows:
  - node title
  - node type
  - human-readable full path
- bookmark-node hover cards also show URL
- folder-node hover cards do not show URL placeholders
- non-duplicate nodes do not show duplicate summary or duplicate list sections
- duplicate-node hover cards show:
  - duplicate total count
  - the first two duplicate path entries, including the current hovered node itself
- when duplicate count is greater than two, the remaining entries stay collapsed behind an inline "expand more" action inside the same hover card
- "expand more" state belongs only to the current hover session and resets after hover ends
- expanded duplicate lists keep original order and use internal scrolling instead of unbounded card growth
- duplicate-path entries use human-readable path labels, not raw internal IDs
- if path text alone cannot distinguish two duplicate entries, the UI appends a readable order suffix such as `#1` or `#2`
- internal stable IDs may participate in uniqueness calculation, but they are never shown directly in the hover card
- bookmark nodes with missing or invalid URLs are invalid content, so they do not enter normal duplicate-hover rendering
- focus actions center the viewport on the target node without mutating graph content
- title matches rank ahead of URL matches
- within the same match class, result order follows the graph's natural traversal order
- search and duplicate-only mode can coexist
- when duplicate-only mode is enabled, search runs only inside the duplicate-node result set
- clearing the search query does not disable duplicate-only mode
- disabling duplicate-only mode does not clear the current search query
- the workspace must always show a visible hint that tells the user whether duplicate-only mode is currently enabled
- empty results are represented as a friendly no-match state, not as an error
- no-match copy must distinguish between:
  - no result in the full graph
  - no result inside duplicate-only mode

## Test Points

- typing a title keyword finds matching folder and bookmark nodes
- typing a URL fragment finds matching bookmark nodes
- title matches rank ahead of URL-only matches
- duplicate-only mode shows only duplicate-focused results and surfaces full duplicate paths directly
- when duplicate-only mode is enabled, search does not return non-duplicate nodes
- the UI always exposes whether duplicate-only mode is on or off
- clearing search preserves duplicate-only mode
- disabling duplicate-only mode returns the active search to the full graph scope
- duplicate hover never treats folder-title repetition as duplicate-node content
- duplicate hover shows the first two duplicate paths by default and includes the current hovered node
- duplicate hover exposes an inline expand-more action only when duplicate count is greater than two
- expanded duplicate entries reset back to collapsed after the hover card closes
- duplicate hover path labels remain human-readable and never expose raw internal IDs
