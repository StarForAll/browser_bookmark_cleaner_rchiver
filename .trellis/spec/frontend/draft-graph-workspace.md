# Draft Graph Workspace

> Executable code-spec for the draft-only graph workspace, including draft mutation entry points, keyboard and drag behavior, search / duplicate focus, hover details, and local persistence boundaries.

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
  - `DraftGraphWorkspace({ initialSnapshot, onPersistDraftSession, searchQuery, duplicateOnly }) => JSX.Element`
  - `deriveVisibleMindmapElements(layout, viewport) => { nodes; branches }`
- `src/features/bookmark-graph/state/searchAndFocus.ts`
  - `deriveSearchResults(snapshot, { searchQuery, duplicateOnly }) => DerivedSearchResult[]`
  - `deriveDuplicateNodeIds(snapshot) => string[]`
  - `deriveDuplicateHoverDetails(snapshot, nodeId) => DuplicateHoverDetails | null`
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
- `searchQuery` and `duplicateOnly`
  - are workspace UI state only
  - do not create undo entries
  - do not call `onPersistDraftSession`

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
- bookmark hover cards for duplicate URLs also show:
  - duplicate total count
  - the first two human-readable duplicate paths by default
  - an inline expand-more action when more than two duplicate paths exist
- duplicate expand-more state resets after the hover card closes
- duplicate-only mode swaps the tree canvas into a dedicated duplicate-focused list grouped by exact URL and surfaces full paths directly
- title or URL search never matches path helper text or hidden internal IDs
- non-duplicate search keeps the tree view and updates result highlighting as the query changes; pressing `Enter` activates result navigation and centers the viewport on the first matching result without mutating draft content
- non-duplicate search supports keyboard navigation only while the search input is active:
  - `Enter` activates result navigation when matches exist
  - `ArrowUp / ArrowDown` cycle the focused result with wrap-around
  - query changes reset active search navigation back to the first result
  - search navigation never mutates `selectedNodeId` or draft content
- `is-selected`, `is-search-match`, and `is-search-focus` must remain visually distinguishable, including when a node carries both selected and focused-search state

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
| duplicate hover | bookmark has duplicate URL peers | hover card includes count + path slice + inline expand | no persistence write |
| duplicate-only | duplicate-only toggle enabled | workspace shows duplicate-focused list grouped by exact URL | no persistence write |
| search | query has no matches in full graph | friendly no-match state | no persistence write |
| search navigation | search input active + `Enter` + matches exist | focused result cycles with `ArrowUp / ArrowDown` | no persistence write |
| search + duplicate-only | query has no matches inside duplicate set | duplicate-only no-match copy | no persistence write |
| large graph | node count reaches threshold | viewport-scoped subset | selection and drag semantics remain unchanged |

### 5. Good / Base / Bad Cases

#### Good

- double-click edit renames a folder and persists the updated draft session without calling browser APIs
- `Shift + Enter` on a top-level node creates a new top-level sibling and does not reset the canvas scroll position
- dragging a nested node onto the virtual-root drop zone promotes it to `parentId = null`
- dragging inside the same parent reorders siblings without changing the parent relationship
- enabling duplicate-only mode groups duplicate bookmarks by exact URL and shows their paths directly without persisting view-only state
- search focuses the first matching bookmark node without creating undo history
- active normal-search navigation cycles matching bookmarks without changing the current selected node

#### Base

- single click only changes `selectedNodeId`
- hover only shows derived view data
- duplicate-only and search remain view-only helpers
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
  - assert normal-search keyboard navigation and state separation
  - assert virtual-root visibility and drag-only semantics
  - assert hover details
  - assert duplicate hover expansion behavior
  - assert large-graph viewport subset behavior
  - assert drag-drop reorder and nesting rules
- `src/features/bookmark-graph/state/searchAndFocus.test.ts`
  - assert title-before-URL search ranking
  - assert duplicate-only derivation uses exact URL equality
  - assert duplicate hover path payloads remain human-readable
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
- let search or duplicate-only toggles enter draft undo history or persistence payloads

#### Correct

- keep all current workspace mutations draft-only
- persist only successful draft content mutations
- reserve status-history entries for explicit external actions
- keep the virtual root as a non-business, drag-only visual anchor
- reject invalid move targets before mutating the snapshot
- keep search / duplicate focus as derived view state over the current draft snapshot
