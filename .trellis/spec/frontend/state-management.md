# State Management

> How state is managed in this project.

---

## Overview

The frontend uses one centralized state layer for the current extension-page session.

The current draft graph is the only editable source of truth. Browser bookmarks are a snapshot input source, not a live synchronized state surface.

---

## State Categories

### Draft content state

- normalized `nodesById`
- root ids
- selected node id
- draft snapshot version
- undo patch history
- checkpoint metadata

### Workspace UI state

- search query
- duplicate-only mode
- active dialog or drawer
- hover target
- latest action result
- newest-three status history
- current external-action running state

### Persisted local state

- current draft snapshot
- expanded/collapsed map
- node positions
- WebDAV profile and test metadata
- WebDAV permission-grant metadata
- latest local backup metadata

### External snapshot inputs

- current browser bookmark tree when explicitly loaded
- WebDAV version snapshots when explicitly listed or restored

These external inputs do not replace the draft as the editable truth after they enter the app.

---

## Core Rules

- keep one centralized session store, not multiple competing global stores
- keep derived values as selectors or mappers instead of duplicating them in state
- keep view-only state separate from draft content state
- keep browser and WebDAV side effects outside raw state mutation code
- allow only one external side-effect action at a time

---

## Persistence Timing

- persist local state after a domain action is committed successfully
- do not rely on broad “any state changed, write everything” listeners as the primary persistence strategy
- startup restores the local session first
- browser reads, browser writes, WebDAV uploads, and WebDAV restores stay explicit actions after startup

---

## Undo Boundary

- `Ctrl+Z` applies only to draft content mutations
- search, duplicate filter, expand/collapse, viewport, and layout-only changes are not undo history entries
- browser sync, WebDAV upload, WebDAV restore, and backup generation are not undo history entries

---

## Common Mistakes

- treating browser bookmarks as a second live source of truth during draft editing
- storing both normalized graph truth and graph-library render truth as primary state
- mixing layout preferences with syncable content state
- letting components mutate durable state without going through explicit domain actions
