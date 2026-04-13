# Frontend Development Guidelines

> Project-specific frontend implementation rules for the browser bookmark cleaner extension.

---

## Overview

This project ships a Chrome extension with one dedicated workspace page as the formal v1 runtime surface.

The frontend layer must preserve the frozen architecture:

- one extension page shell, not a multi-route app
- one application orchestration layer for explicit user actions
- one centralized state layer for the current session
- adapter boundaries for browser APIs, WebDAV, and local persistence
- one normalized draft graph as the only editable source of truth
- Chinese-first UI copy with future locale expansion kept possible

---

## Pre-Development Checklist

Read these files before changing frontend code or frontend-facing specs:

1. [Directory Structure](./directory-structure.md)
2. [State Management](./state-management.md)
3. [Component Guidelines](./component-guidelines.md)
4. [Hook Guidelines](./hook-guidelines.md)
5. [Type Safety](./type-safety.md)
6. [Extension Action Entry](./browser-import-startup.md#scenario-extension-action-entry-and-workspace-refocus)
7. [Browser Import Startup](./browser-import-startup.md)
8. [Draft Graph Workspace](./draft-graph-workspace.md)
9. [Quality Guidelines](./quality-guidelines.md)
10. [Guides Index](../guides/index.md)

Use the task `design/` package as the contract source for feature behavior, especially:

- `TAD.md` for runtime and layering boundaries
- `DDD.md` for domain objects and snapshot assets
- `IDD.md` for adapter contracts
- `AID.md` for workspace interaction rules
- `ODD.md` for execution and recovery flows

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Capability-first module layout and shared boundaries | Project-specific |
| [Component Guidelines](./component-guidelines.md) | UI component responsibilities and forbidden coupling | Project-specific |
| [Hook Guidelines](./hook-guidelines.md) | Hook scope, side-effect boundaries, and composition rules | Project-specific |
| [State Management](./state-management.md) | Centralized state model, persistence timing, and external-action rules | Project-specific |
| [Extension Action Entry](./browser-import-startup.md#scenario-extension-action-entry-and-workspace-refocus) | Executable contract for action-icon open/focus, workspace self-registration, and service-worker fallback | Project-specific |
| [Browser Import Startup](./browser-import-startup.md) | Executable startup bootstrap, restore, import, and error-state contracts | Project-specific |
| [Draft Graph Workspace](./draft-graph-workspace.md) | Executable draft editing, drag-move, keyboard, hover, and persistence contracts | Project-specific |
| [Quality Guidelines](./quality-guidelines.md) | Verification baseline, required patterns, and review checklist | Project-specific |
| [Type Safety](./type-safety.md) | Domain contracts, adapter validation, and versioned payload rules | Project-specific |

---

## Current Frontend Boundaries

- Do not treat browser bookmarks as live editable state after initial load.
- Do not let React presentation code call `chrome.*`, raw `fetch`, or persistence APIs directly.
- Do not spread user-visible Chinese copy across feature logic.
- Do not mix draft mutations with browser-write or WebDAV side effects in one unstructured function.

---

**Language**: All spec text in this directory should remain in English.
