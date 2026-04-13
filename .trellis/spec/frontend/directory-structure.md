# Directory Structure

> How frontend code is organized in this project.

---

## Overview

This project uses a capability-first React + TypeScript structure for one Chrome extension workspace page.

Top-level runtime code stays under `src/`, but feature capabilities are the primary organization unit. Technical roles such as `ui`, `application`, `state`, or `view-mapper` should exist inside a capability module when they improve clarity.

---

## Required Top-Level Layout

```text
public/
  manifest.json
src/
  app/
  features/
  adapters/
  shared/
  test/
```

Meaning:

- `app/`: composition root, app shell, workspace bootstrap
- `features/`: capability modules such as workspace, bookmark graph, browser sync, WebDAV flows, history and recovery
- `adapters/`: reusable implementations for browser APIs, WebDAV transport, and local persistence
- `shared/`: cross-feature copy resources, shared types, UI primitives, error helpers, layout interfaces
- `test/`: shared test helpers, fixtures, and runtime mocks

---

## Capability Module Rule

Inside `src/features/`, organize by user-facing capability first.

Example target shape:

```text
src/features/
  workspace-entry/
    application/
  workspace/
    ui/
    application/
    state/
  bookmark-graph/
    ui/
    state/
    view-mapper/
  browser-sync/
    application/
  webdav/
    application/
    ui/
  history-recovery/
    application/
    state/
```

Rules:

- prefer keeping one business capability together
- add sublayers only when the capability needs them
- avoid dumping unrelated files into global `components/`, `stores/`, or `hooks/` folders

---

## Boundary Rules

- `src/app/` owns dependency assembly and page bootstrap
- React presentation code belongs in `src/app/` or `src/features/*/ui/`
- explicit user-action orchestration belongs in `application/`
- centralized session state belongs in feature state modules, not in ad hoc component state
- browser APIs, WebDAV requests, and persistence writes belong in `src/adapters/`
- shared copy resources must live outside individual components

---

## Naming Conventions

- React components: `PascalCase.tsx`
- hooks: `useXxx.ts`
- application actions and mappers: `camelCase.ts`
- feature folders: `kebab-case`
- keep one concept per file unless co-location reduces boundary crossing

---

## Forbidden Layout Patterns

- putting raw `chrome.bookmarks` calls inside `src/features/*/ui/`
- storing application orchestration logic inside generic `utils/`
- creating global top-level `components/` or `stores/` directories as a default dumping ground
- coupling rendered graph-library node objects with the domain source-of-truth shape
