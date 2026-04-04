# Backend Development Guidelines

> Project-specific backend guidance for this repository.

---

## Overview

This project does not ship a standalone backend service in v1.

The product is a Chrome extension with:

- one dedicated extension workspace page
- browser bookmark access through extension capabilities
- cloud version storage through user-provided WebDAV
- no project-owned API server
- no project-owned database
- no account system

This directory remains in the repo to prevent future drift if backend-like code, helper services, or infrastructure scripts are introduced later.

---

## Current Applicability

Read this directory only when a change introduces one of the following:

- a project-owned remote service
- a database or migration system
- a server-side synchronization component
- backend-style infrastructure helpers that expose contracts beyond local build scripts

Until then, frontend and universal-domain specs are the primary implementation source of truth.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Current backend boundary and future isolation rules | Project-specific |
| [Database Guidelines](./database-guidelines.md) | Current database status and future introduction gate | Project-specific |
| [Error Handling](./error-handling.md) | Error rules if backend-style execution surfaces are added | Project-specific |
| [Quality Guidelines](./quality-guidelines.md) | Verification and review rules for non-frontend runtime code | Project-specific |
| [Logging Guidelines](./logging-guidelines.md) | Logging boundaries, especially for secrets and WebDAV credentials | Project-specific |

---

## Boundary Reminder

- do not treat the MV3 extension runtime as a traditional backend service
- do not invent API, database, or queue layers unless the PRD and design package explicitly add them
- do not move browser, WebDAV, or local-persistence logic into a pseudo-backend abstraction just because it feels “more layered”

---

**Language**: All spec text in this directory should remain in English.
