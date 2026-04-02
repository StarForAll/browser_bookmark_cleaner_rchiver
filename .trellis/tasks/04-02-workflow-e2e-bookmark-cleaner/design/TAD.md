# TAD

## Architecture Overview

The first release uses a Chrome Manifest V3 extension with a dedicated extension page as the main workspace.

### Chosen Stack

- UI runtime: React + TypeScript
- Build tool: Vite
- Extension target: Chrome MV3
- Storage:
  - `chrome.bookmarks` for browser bookmark source-of-truth
  - `chrome.storage.local` for local settings, view state, draft state, and undo history
  - WebDAV over HTTPS for cloud version storage

### Evidence

- Vite officially supports multi-page builds through multiple HTML entry points in build input configuration.
- React officially fits interactive local-state-heavy UIs through declarative state-driven rendering.
- Chrome officially exposes bookmark management through the `chrome.bookmarks` extension API and supports dedicated extension pages and side panels; the chosen surface here is a dedicated page.

### Runtime Boundaries

1. Extension Page
   - Hosts the React application
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
   - Not required for first-release business logic
   - Reserved for future alarms, background sync, or extension lifecycle hooks

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

## Proposed Directory Shape

```text
extension/
  index.html                # extension page entry
src/
  app/
    App.tsx
    routes/
    layout/
  features/
    bookmark-graph/
    search-filter/
    sync-status/
    webdav-settings/
  domain/
    bookmark/
    draft/
    sync/
    history/
  adapters/
    chrome-bookmarks/
    local-storage/
    webdav/
  shared/
    ui/
    utils/
    types/
manifest.json
vite.config.ts
```

## Validation Matrix

### Good

- User reads bookmarks, edits the draft, syncs to WebDAV, and later restores one version to draft mode

### Base

- User reads bookmarks, drags a node, presses `Ctrl+Z`, and sees the layout preserved after reload

### Bad

- WebDAV is misconfigured, but cloud actions are still enabled
- Restore overwrites browser bookmarks without first generating a local backup
- Undo changes browser bookmarks directly
