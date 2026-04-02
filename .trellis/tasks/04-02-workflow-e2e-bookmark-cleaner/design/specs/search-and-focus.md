# Search and Focus Spec

## Goal

Define how users find nodes quickly and isolate duplicate URL hotspots without losing graph context.

## Inputs

- current draft node set
- node titles
- node URLs
- duplicate URL index
- current selection and viewport position

## Outputs

- search result list ordered by title and URL match
- graph focus target for the selected result
- duplicate-only filtered view state

## Rules

- search matches title and URL
- duplicate-only mode is derived from the duplicate URL index, not hard-coded flags on nodes
- focus actions center the viewport on the target node without mutating graph content
- search and duplicate-only mode can coexist
- empty results are represented as a friendly no-match state, not as an error

## Test Points

- typing a title keyword finds matching folder and bookmark nodes
- typing a URL fragment finds matching bookmark nodes
- duplicate-only mode hides non-duplicate nodes from the active focus view
- clearing search or duplicate-only mode restores the normal graph view
