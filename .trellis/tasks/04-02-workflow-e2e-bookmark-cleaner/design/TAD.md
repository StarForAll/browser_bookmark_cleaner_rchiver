# TAD

## Architecture Overview

The first release is designed as a Chrome extension with a dedicated extension page as the main workspace.

### Frozen Product Constraints

- Product shell: Chrome extension
- Main workspace surface: dedicated extension page
- Storage:
  - `chrome.bookmarks` for on-demand browser bookmark snapshot input and confirmed browser write-back target
  - `chrome.storage.local` for v1 local settings, view state, draft state, undo history, backup metadata, and other persisted assets
  - WebDAV over HTTPS for cloud version storage

### Engineering Baseline Status

- The repo now has a real implementation scaffold created by `T01`
- The MV3 manifest, dedicated extension page entry, and React shell now exist as the real runtime host boundary created by `T03`
- Later tasks must build on this scaffold instead of re-deciding the runtime shell
- The target package manager is `pnpm`
- The target verification matrix is frozen as a design-stage command set and now exists as an executable local baseline:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `pnpm sonar`
- The Sonar token must be provided through the `SONAR_TOKEN` environment variable at execution time and must not be frozen as a real secret in repository docs

### Frozen Technical Selections

- UI runtime: React + TypeScript
- Build tool: Vite
- Package manager target: `pnpm`
- Graph rendering strategy: product-owned React + SVG mindmap renderer behind replaceable layout and render interfaces
- Graph library: no third-party node-editor library is part of the frozen v1 rendering baseline
- Node movement strategy: current baseline is selection/edit/create/delete on the draft mindmap; any later movement interaction must remain product-owned and domain-validated
- State management direction: lightweight centralized store
- Local persistence direction: logical storage domains are frozen now, while v1 physically uses `chrome.storage.local`; large-object persisted assets may move to `IndexedDB` later if storage pressure or performance evidence appears
- WebDAV integration direction: native `fetch` with a minimal WebDAV action surface
- Runtime topology: dedicated extension page as the only required v1 runtime surface
- Permission direction: `bookmarks` + `storage` as required capabilities, WebDAV host access requested at runtime
- Browser write-back strategy: full reconstruction write-back inside the managed scope
- Layout strategy: controlled tree layout behind a replaceable layout interface

### Evidence

- Chrome officially exposes bookmark management through the `chrome.bookmarks` extension API and supports dedicated extension pages and side panels; the chosen surface here is a dedicated page.
- Chrome officially supports runtime-requested optional permissions and optional host permissions, which matches the user-configured WebDAV endpoint requirement.
- Vite officially supports multi-page builds through multiple HTML entry points in build input configuration.
- React officially fits interactive local-state-heavy UIs through declarative state-driven rendering.
- React and SVG provide enough controlled rendering primitives for a product-owned mindmap canvas while keeping bookmark-tree semantics inside application code.

Evidence sources:

- https://developer.chrome.com/docs/extensions/reference/api
- https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions?hl=en
- https://developer.chrome.com/docs/extensions/reference/permissions
- https://vite.dev/guide/build.html
- https://react.dev/learn/managing-state

Implementation note:

- Current Vite docs describe multi-entry builds with `build.rolldownOptions.input`.
- If an older Vite major is selected during implementation, the equivalent configuration may be `build.rollupOptions.input`.

### Runtime Boundaries

1. Extension Page
   - Hosts the React + TypeScript application
   - Owns visual state, keyboard interactions, drag/drop, and draft editing
   - Calls application services and adapter layer

2. Application Core
   - Bookmark tree normalization
   - Duplicate detection
   - Draft mutations
   - Undo history
   - Restore planning

3. Adapter Layer
   - Chrome bookmarks adapter
   - Local persistence adapter
   - WebDAV adapter

4. Optional Background Worker
   - Not required for v1 core flows
   - Deliberately excluded from the required runtime topology unless a later implementation constraint proves it necessary
   - Reserved for future alarms, background sync, or extension lifecycle hooks if later needed

## Key Technical Decisions

### Decision 1: Draft-first editing

- Browser bookmark data is loaded into a normalized draft graph.
- All UI edits apply to the draft graph first.
- Sync back to browser bookmarks requires an explicit confirm step.

Reason:
- Separates smooth editing from external side effects
- Simplifies undo behavior
- Reduces accidental bookmark corruption

### Decision 2: Local-first view state

- Expanded/collapsed state is stored locally only
- Node positions are stored locally only
- These states are not part of WebDAV versions

Reason:
- They are user-specific workspace preferences, not content truth

### Decision 3: Split cloud artifacts by data type

- Bookmark snapshots and draft snapshots are stored as different WebDAV files
- Each category keeps the newest five versions

Reason:
- Avoids mixing browser truth with editable workspace state
- Keeps restore semantics explicit

### Decision 4: Single WebDAV profile in v1

- One active WebDAV configuration
- Stored locally in extension storage
- Includes a dedicated availability test action

Reason:
- Reduces setup complexity
- Keeps first-release sync flows understandable

### Decision 5: Runtime-granted host access for user-defined WebDAV endpoints

- Browser bookmark APIs use named extension permissions.
- WebDAV networking uses host permissions because the endpoint is user-defined.
- The extension requests runtime host access after the user enters a WebDAV URL instead of hard-wiring one fixed origin.
- Cloud actions stay disabled until both host access and connectivity test succeed.

Reason:
- Matches the requirement that WebDAV is user-configured, not pre-bundled
- Reduces unnecessary install-time permission surface
- Gives a concrete contract for enabling or disabling cloud actions

### Decision 6: Centralized Chinese-first copy boundary

- All system-visible UI copy is defined through centralized local copy resources
- The first release ships only Chinese product copy
- Component logic should consume copy keys or structured copy modules instead of scattering inline UI strings

Reason:
- Satisfies the v1 Chinese-only interface constraint
- Preserves room for future multilingual support without changing domain logic, page structure, or adapter contracts
- Reduces the risk of English placeholder text leaking into production UI

### Decision 7: React + Vite frontend baseline

- The implementation will use React + TypeScript as the UI runtime
- The build path will use Vite
- The extension page is treated as a frontend application entry rather than as a popup-sized utility shell

Reason:
- Matches the interaction density of the product
- Keeps the implementation surface mainstream and well-documented
- Works well with the selected product-owned graph-rendering direction

### Decision 8: Graph editor based on a product-owned React + SVG mindmap renderer

- The graph canvas is built from product-owned React components plus SVG branch rendering
- Custom bookmark/folder node rendering stays inside product-owned React components
- Layout calculation and branch rendering sit behind replaceable product-owned interfaces instead of being delegated to a generic node-editor runtime
- If node movement is added later, it must still be enforced by domain rules rather than raw canvas behavior

Reason:
- Preserves product-specific control over bookmark-tree semantics and virtual-root behavior
- Keeps large-graph performance controls, viewport culling, and hover behavior in product code
- Avoids coupling future bookmark-specific interactions to a generic graph editor abstraction

### Decision 9: Lightweight centralized state management

- Draft graph, search/filter state, selected node, status history, and restore flow state should be coordinated through a lightweight centralized store
- The store choice should stay light enough to avoid framework-level ceremony
- The workspace uses one centralized state layer for the current session rather than multiple competing stores

Reason:
- The workspace has shared state across many interaction surfaces
- Pure component-local state would fragment the editing model
- A heavier state framework is not justified yet

### Decision 10: Native `fetch` WebDAV adapter

- WebDAV integration should be implemented with native `fetch`
- Only the minimal action surface needed by v1 should be supported:
  - connectivity test
  - list versions
  - upload snapshot
  - download snapshot
  - prune historical versions

Reason:
- Keeps the cloud boundary narrow
- Avoids bringing in a large SDK before proving the real interoperability needs
- Matches the current product direction of local-first extension + user-provided WebDAV

### Decision 11: Snapshot draft state + patch undo history + periodic checkpoints

- The current draft state is persisted as one complete snapshot
- `Ctrl+Z` history is stored as patch-based draft-only undo entries
- The system may create periodic checkpoint snapshots to cap replay depth and reduce recovery risk
- Undo storage strategy is optimized for `chrome.storage.local` limits rather than for perfect historical duplication of full draft payloads

Reason:
- A full snapshot is the simplest and most reliable representation of the current draft state
- Patch-based undo avoids multiplying full-tree storage cost on every small edit
- Periodic checkpoints give a practical recovery anchor without forcing every undo step to store a complete graph snapshot
- This hybrid model fits the product's single-node edit, move, rename, and delete patterns better than pure snapshot history

### Decision 12: Browser-independent contracts with Chrome-first implementation

- Application and domain layers consume browser-independent bookmark and permission contracts
- Chrome is the first implementation of those contracts in v1
- Future browser support should be added at the adapter boundary rather than by rewriting domain and UI contracts

Reason:
- Preserves future Firefox expansion space without adding a second runtime surface in v1
- Keeps Chrome-specific raw API shapes out of the application core

### Manifest-Level Contract

- Required capability contract:
  - `bookmarks`
  - `storage`
- Expected host-access strategy:
  - `optional_host_permissions` for user-entered WebDAV origins
- v1 does not require a background worker for the main product loop
- A background script may still be added later for alarms or background sync without changing the domain model

## Planned Directory Shape

```text
<project-root>/
  package.json
  vite.config.ts
  index.html
  public/
    manifest.json
  src/
    app/
    features/
    domain/
    adapters/
    shared/
  tests-or-src-test/
```

Rules:

- This is the planned shape implied by the frozen React + Vite direction
- Exact subdirectory names remain implementation-detail scope for PLAN-01

## Validation Matrix

### Good

- User reads bookmarks, edits the draft, syncs to WebDAV, and later restores one version to draft mode

### Base

- User reads bookmarks, edits or deletes draft nodes, and sees the restored draft/layout state preserved after reload

### Bad

- WebDAV is misconfigured, but cloud actions are still enabled
- WebDAV host permission is missing, but network actions are still enabled
- Restore overwrites browser bookmarks without first generating a local backup
- Undo changes browser bookmarks directly
