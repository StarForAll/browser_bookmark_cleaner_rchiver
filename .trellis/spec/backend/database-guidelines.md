# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

There is no project-owned database in v1.

Current product storage surfaces are:

- browser bookmark tree through Chrome extension capabilities
- local extension persistence through frontend-controlled storage contracts
- WebDAV file storage for versioned snapshots

None of these should be documented or treated as a relational database layer.

---

## Current Rules

- do not introduce ORM assumptions into this project baseline
- do not describe WebDAV snapshot storage as a database
- do not create migration terminology for local extension snapshot evolution; use versioned snapshot contracts instead
- use explicit `schemaVersion` evolution rules for persisted assets rather than DB-style migrations

---

## If a Real Database Is Added Later

Before introducing a database, first freeze:

- ownership of the new remote system
- what data moves out of extension-local storage
- migration and rollback strategy
- verification and operational commands

Only after that should this file be expanded into real query and migration guidance.

---

## Common Mistakes

- calling WebDAV version files “database records”
- treating local snapshot upgrades as SQL migration work
- adding persistence complexity that the current extension-only architecture does not need
