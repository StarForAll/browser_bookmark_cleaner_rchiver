# Directory Structure

> How backend-style code is organized in this project.

---

## Overview

There is no standalone backend directory in v1 because the product currently has no standalone backend runtime.

The existing runtime shape is:

- extension UI and app shell in frontend code
- browser, WebDAV, and persistence adapters in frontend-facing runtime modules
- no `server/`, `api/`, or `db/` package

---

## Current Rule

Do not create backend folders or pseudo-service layers for features that already belong to:

- extension UI composition
- application orchestration
- browser adapter logic
- WebDAV adapter logic
- local persistence adapter logic

These belong to frontend runtime boundaries, not backend boundaries.

---

## If Backend Code Is Added Later

If a real backend surface is introduced in the future, isolate it clearly from extension runtime code.

Recommended future target:

```text
backend/
  src/
    application/
    adapters/
    contracts/
    infra/
  test/
```

Rules for that future state:

- keep remote-service contracts separate from extension-page contracts
- do not mix server-side secrets or deployment config into frontend runtime folders
- define the new backend boundary in PRD and design docs before implementation starts

---

## Common Mistakes

- creating a fake `services/` layer that is still just frontend runtime code
- moving WebDAV client logic into a “backend” folder even though it still executes inside the extension
- introducing backend naming without a real server boundary
