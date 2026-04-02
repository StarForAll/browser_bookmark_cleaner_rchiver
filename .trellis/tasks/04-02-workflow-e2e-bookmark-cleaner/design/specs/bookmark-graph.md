# Bookmark Graph Spec

## Goal

Define how browser bookmark data becomes an editable graph.

## Inputs

- Chrome bookmark tree
- Local expanded-state map
- Local node-position map

## Outputs

- normalized node map
- derived duplicate URL index
- graph render model

## Invariants

- hidden internal IDs remain stable inside the app
- duplicate matching is URL-only
- folders never contain URL values
- bookmark nodes always require URL values

## Test Points

- graph builds from nested bookmark data
- duplicate index updates after edit/create/delete
- local layout restore does not change content
