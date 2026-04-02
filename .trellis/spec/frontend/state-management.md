# State Management

> How state is managed in this project.

---

## Overview

The project starts with React local state plus domain-level pure functions. Do not introduce a heavy global state library until real cross-feature pressure appears.

---

## State Categories

- View state:
  - selected node
  - hover state
  - modal open state
- Draft content state:
  - normalized bookmark graph
  - undo history
  - search query
  - duplicate-only flag
- Persisted local state:
  - expanded/collapsed map
  - node positions
  - WebDAV profile
  - latest local restore backup metadata
- External state:
  - browser bookmarks
  - WebDAV versions

---

## When to Use Global State

Promote state only when it is shared by multiple distant feature modules and lifting it into the app shell would make code harder to follow.

Until that happens:

- keep page-shell state in `src/app/`
- keep feature-specific state in the feature module
- keep mutation logic in `src/domain/`

---

## Server State

There is no traditional server state in v1. WebDAV is treated as an external persistence adapter, not as a reactive cache layer.

Fetch or restore results should be normalized at the adapter boundary before entering the draft model.

---

## Common Mistakes

- Letting UI components own irreversible side effects
- Storing duplicated derived values instead of recalculating them from source state
- Mixing layout state with content state when only the content should sync
