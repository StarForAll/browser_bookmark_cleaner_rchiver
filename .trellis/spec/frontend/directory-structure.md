# Directory Structure

> How frontend code is organized in this project.

---

## Overview

This project uses a feature-first React + TypeScript structure for a Chrome extension page.

Keep runtime code under `src/` and separate it by responsibility:

- `app/` for application shell and page composition
- `features/` for user-facing feature modules
- `domain/` for pure business models and mutation logic
- `adapters/` for browser APIs, local persistence, and WebDAV integration
- `shared/` for reusable UI primitives, utilities, and shared types

---

## Directory Layout

```text
public/
  manifest.json
src/
  app/
  features/
  domain/
  adapters/
  shared/
  test/
```

---

## Module Organization

- UI composition belongs in `src/app/` or `src/features/`
- Browser-specific logic belongs in `src/adapters/`
- Bookmark graph shape, draft mutation rules, undo rules, and sync contracts belong in `src/domain/`
- Do not let feature components call `chrome.*` or raw WebDAV fetch logic directly

---

## Naming Conventions

- React components: `PascalCase.tsx`
- Utilities, adapters, hooks: `camelCase.ts` or `<feature>.ts`
- Feature folders: `kebab-case`
- Prefer one concept per file unless co-location improves readability

---

## Examples

- App shell entry: `src/app/App.tsx`
- Feature module example target: `src/features/bookmark-graph/`
- Adapter example target: `src/adapters/chrome-bookmarks/`
