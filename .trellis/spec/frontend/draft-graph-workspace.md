# Draft Graph Workspace

> Executable code-spec for the draft-only graph workspace, including draft mutation entry points, keyboard and drag behavior, hover details, and local persistence boundaries.

---

## Scenario: Draft Graph Editing, Reorder, And Hover

### 1. Scope / Trigger

- Trigger:
  - changing `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
  - changing `src/domain/draft-graph/editing.ts`
  - changing the `onPersistDraftSession` persistence boundary used by draft mutations
  - changing virtual-root behavior, drag-drop semantics, or keyboard reorder / promote behavior
- This requires code-spec depth because the flow crosses:
  - normalized draft graph domain contracts
  - feature UI interaction state
  - local persistence session writes

### 2. Signatures

File paths and functions:

- `src/domain/draft-graph/editing.ts`
  - `selectDraftNode(snapshot, nodeId) => DraftGraphSnapshot`
  - `editDraftNode(snapshot, input) => EditResult`
  - `createDraftChildNode(snapshot, input) => CreateChildResult`
  - `createDraftSiblingNode(snapshot, input) => CreateChildResult`
  - `deleteDraftNodeSubtree(snapshot, nodeId) => DeleteResult`
  - `moveDraftNode(snapshot, input) => EditResult`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
  - `DraftGraphWorkspace({ initialSnapshot, onPersistDraftSession }) => JSX.Element`
  - `deriveVisibleMindmapElements(layout, viewport) => { nodes; branches }`
- `src/adapters/local-persistence/contracts.ts`
  - `PersistedDraftSession`

Verification commands:

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### 3. Contracts

#### Workspace input and persistence

- `initialSnapshot`
  - must be a valid `DraftGraphSnapshot`
  - is copied into workspace-local session state on mount
- `onPersistDraftSession(session)`
  - is called only after successful draft content mutations
  - receives:
    - `schemaVersion: 'local-persistence/v1'`
    - `draftSnapshot: <latest normalized snapshot>`
    - `expandedStateById: {}`
    - `nodePositionsById: {}`
    - `undoHistory: <latest patch-based draft undo entries>`
    - `checkpoints: <latest checkpoint metadata, empty until checkpoint policy is wired>`
- selection-only changes do not call `onPersistDraftSession`

#### Draft-only mutation boundary

- double click opens node edit dialog
  - when viewport width allows and the trigger node is mounted, the dialog card opens beside that node instead of centering the canvas
- `Ctrl+Z`
  - reverts only the latest draft content mutation
  - persists the restored draft snapshot together with the consumed undo history
  - becomes a no-op when undo history is empty
- `Enter` opens create-child only for selected folder nodes
- `Shift + Enter` opens create-sibling for the selected node, including top-level roots
- `Delete / Backspace`
  - deletes immediately for bookmarks and folders with `0` or `1` direct child
  - opens a confirmation dialog for folders with more than `1` direct child
- `ArrowUp / ArrowDown`
  - reorder only when the node is currently selected
  - reorder within the current parent or `rootIds`
- `ArrowLeft`
  - promotes only when the node is currently selected and has a parent
  - becomes a no-op for top-level nodes
- drag and drop
  - folder tail drop zones move into that folder
  - sibling buttons reorder beside the hovered node
  - virtual-root drop zone promotes to the top level or reorders `rootIds`

#### Validation boundary

- folder nodes:
  - can edit title
  - cannot store URL
  - are the only nodes that can own child nodes
- bookmark nodes:
  - can edit title and URL
  - URL is required
- drag / keyboard move rejects:
  - non-folder drop targets for nesting
  - cycles that would move a folder into its own descendant subtree

#### View-layer boundary

- the virtual root is a view-only anchor
- the virtual root:
  - is visible
  - is non-focusable
  - is non-selectable
  - is excluded from `nodesById`, `rootIds`, persistence, sync, upload, restore, and undo contracts
- hover details show:
  - node type
  - full path
  - bookmark URL when the hovered node is a bookmark
- current hover behavior does not show duplicate-URL metadata

#### Large-graph rendering boundary

- `nodeCount >= 400` enables viewport-scoped rendering
- viewport-scoped rendering:
  - keeps visible nodes and nearby overscan nodes
  - keeps branches whose endpoints remain visible
  - keeps the virtual root when any virtual-root branch remains visible
- large-graph optimization must not change draft truth or interaction semantics

#### Status-history boundary

- routine draft edits, create-child, create-sibling, delete, keyboard reorder, keyboard promote, and drag-drop do not write status-history entries
- these interactions remain draft-only and persistence-only until explicit external actions are implemented later
- draft-only content mutations do append patch-based undo history entries

### 4. Validation & Error Matrix

| Boundary | Input / Condition | Output | User-visible result |
|---|---|---|---|
| edit dialog | empty title | `ok: false` + validation error | dialog stays open with inline error |
| edit dialog | bookmark URL empty | `ok: false` + validation error | dialog stays open with inline error |
| create-child | parent is bookmark | `ok: false` + validation error | dialog does not open |
| create-child / sibling | bookmark type without URL | `ok: false` + validation error | dialog stays open with inline error |
| delete | folder with more than one direct child | confirmation required | draft stays unchanged until confirm |
| Ctrl+Z | undo history empty | no-op | no persistence write |
| keyboard reorder | selected node already at first / last position | no-op | no persistence write |
| keyboard promote | selected node already top-level | no-op | no persistence write |
| drag move | non-folder target requested as nesting parent | `ok: false` | inline drag-move error or ignored preview |
| drag move | move would create ancestor cycle | `ok: false` | inline drag-move error |
| hover | bookmark node | hover card includes URL | no persistence write |
| large graph | node count reaches threshold | viewport-scoped subset | selection and drag semantics remain unchanged |

### 5. Good / Base / Bad Cases

#### Good

- double-click edit renames a folder and persists the updated draft session without calling browser APIs
- `Shift + Enter` on a top-level node creates a new top-level sibling and does not reset the canvas scroll position
- dragging a nested node onto the virtual-root drop zone promotes it to `parentId = null`
- dragging inside the same parent reorders siblings without changing the parent relationship

#### Base

- single click only changes `selectedNodeId`
- hover only shows derived view data
- top-level nodes ignore repeated `ArrowLeft`

#### Bad

- treat the virtual root as a real `DraftGraphNode`
- write status-history entries for routine draft-only edits
- call `chrome.bookmarks` from edit / create / delete / drag flows
- reset the canvas scroll position after create, delete, or reorder just to “reveal” the latest change
- silently accept bookmark creation or edit with an empty URL

### 6. Tests Required

Required automated tests:

- `src/domain/draft-graph/editing.test.ts`
  - assert edit invariants
  - assert child and sibling creation
  - assert subtree deletion
  - assert drag-move domain validation
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
  - assert draft-only edit flow
  - assert create-child and create-sibling flows
  - assert delete confirmation behavior
  - assert keyboard reorder and promote behavior
  - assert virtual-root visibility and drag-only semantics
  - assert hover details
  - assert large-graph viewport subset behavior
  - assert drag-drop reorder and nesting rules
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.undo.test.tsx`
  - assert draft-only undo history persistence
  - assert `Ctrl+Z` restore behavior

Manual assertions:

- in the real extension runtime, startup-imported or restored drafts remain editable without triggering browser writes
- create, delete, reorder, and drag changes still persist locally across refresh after the corresponding persistence flows are wired in the runtime environment

### 7. Wrong vs Correct

#### Wrong

- use draft-edit dialogs to mutate browser bookmarks directly
- persist selection-only changes as if they were draft content mutations
- expose the virtual root as a clickable or focusable business node control
- couple folder-body hover or drag previews to unconditional nesting behavior
- treat routine draft edits as completed external actions in the status area

#### Correct

- keep all current workspace mutations draft-only
- persist only successful draft content mutations
- reserve status-history entries for explicit external actions
- keep the virtual root as a non-business, drag-only visual anchor
- reject invalid move targets before mutating the snapshot
