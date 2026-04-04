# Type Safety

> Type safety patterns in this project.

---

## Overview

This project uses TypeScript strict mode.

Type safety must protect the boundaries between:

- browser-agnostic bookmark contracts
- normalized draft graph models
- local persistence assets
- WebDAV snapshot envelopes
- domain error results

---

## Contract Organization

- domain types live with the domain module they describe
- adapter input and output contracts live with the adapter unless reused across modules
- component prop types stay beside the component
- versioned snapshot envelopes should be shared contracts, not ad hoc inline shapes

---

## Required Type Patterns

- use discriminated unions for node kinds and result states
- include explicit `schemaVersion` on persisted and exchanged snapshot assets
- model external action results as structured success or failure objects
- use explicit nullable fields instead of magic empty strings
- keep browser-facing contracts separate from Chrome-native raw response shapes

---

## Boundary Validation

- normalize and validate browser API data before it enters the draft graph
- validate restored WebDAV snapshots and local backup assets before treating them as trusted internal state
- map raw adapter failures into a unified domain error model before they reach UI code
- keep runtime validation at adapter boundaries or import boundaries, not deep inside presentational components

---

## Forbidden Patterns

- `any`
- blind `as` assertions on external payloads
- using raw `BookmarkTreeNode`-shaped objects as application state
- passing raw HTTP response bodies upward and letting UI code decode transport details
- storing unversioned backup or snapshot payloads when the asset is intended to survive app restarts
