# Bookmark Graph Spec

## Goal

Define how browser bookmark data becomes an editable graph.

This spec covers only the graph-content transformation boundary for v1:

- how browser bookmark data is normalized into editable graph content
- how duplicate relationships are derived
- how render-facing graph data is prepared from normalized content plus local view state

It does not define WebDAV persistence, undo storage format, or browser write-back operations.

## Inputs

- Chrome bookmark tree
- Local expanded-state map
- Local node-position map

Chrome bookmark import includes fixed structural root containers. Those containers anchor the managed bookmark scope, but they are not treated as normal editable business nodes.

## Outputs

- `nodesById`
  - normalized node table keyed by hidden `internalId`
  - each node contains the minimum graph-content fields required by editing and traversal:
    - `internalId`
    - `nodeType`
    - `title`
    - `url`
    - `parentId`
    - `childIds`
    - `pathTokens`
- `rootIds`
  - ordered top-level node ID list for graph traversal and layout entry
- `duplicateUrlIndex`
  - URL-keyed duplicate index that points to all nodes sharing the exact same URL string
- `graphRenderModel`
  - render-facing graph structure derived from normalized content plus local expanded-state and node-position data
  - includes only the view information needed by the graph canvas, without changing graph content truth

Rules:

- `nodesById` plus `rootIds` are the only content truth for the draft graph
- `graphRenderModel` is a derived render projection, not a second persisted source of truth

## Invariants

- hidden internal IDs remain stable within the local draft lifecycle, including page refresh recovery
- duplicate matching is strict URL-string equality only
- folders never contain URL values
- bookmark nodes always require URL values
- any non-null `parentId` must reference an existing node inside `nodesById`
- expanded/collapsed state and node positions are view state only
- expanded/collapsed state and node positions do not participate in duplicate detection, content comparison, or browser write-back payload generation
- system root containers stay fixed and do not enter normal rename, move, delete, or create-child semantics

## Virtual Root Node (View Layer Only)

The mindmap canvas renders a decorative virtual root node to unify multiple root branches visually. This node:

- Does not exist in `nodesById`, `rootIds`, or any persistence contract
- Is not a `DraftGraphNode` and has no `internalId`
- Renders as a visible, non-interactive anchor near the top-left of the mindmap canvas so users can read the root-branch origin without treating it as a real node control
- Cannot be selected, edited, deleted, or have children
- Is excluded from all sync, upload, restore, overwrite, and browser write-back operations
- Is excluded from draft mutation, undo history, and checkpoint operations
- Any code that iterates `nodesById` or processes graph content must not encounter or handle this node

## Test Points

- graph builds from nested bookmark data into `nodesById` plus `rootIds`
- duplicate index updates after edit/create/delete using exact URL-string matching only
- local expanded-state and node-position restore changes render output but does not mutate graph content truth
- folders still normalize to `url = null`
- bookmark nodes still fail normalization if URL is missing or empty
- non-root nodes fail normalization if `parentId` points to a missing node
