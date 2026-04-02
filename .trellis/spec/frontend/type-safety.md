# Type Safety

> Type safety patterns in this project.

---

## Overview

This project uses TypeScript strict mode. Data contracts between browser adapters, local persistence, WebDAV payloads, and the draft graph must be explicit.

---

## Type Organization

- Shared domain types belong close to the domain module they model
- Adapter input/output types should live with the adapter unless reused broadly
- UI-only prop types stay beside the component

---

## Validation

- Browser API results should be normalized before entering the draft graph
- Restored WebDAV payloads should not be treated as trusted internal state without validation
- If runtime validation is introduced later, keep it at adapter boundaries rather than deep inside UI components

---

## Common Patterns

- Prefer discriminated unions for node kinds such as `folder` vs `bookmark`
- Use explicit nullable fields instead of overloaded empty strings
- Use narrow helper functions for adapter-to-domain mapping

---

## Forbidden Patterns

- `any`
- Blind `as` assertions on external payloads
- Reusing browser-native shapes directly as UI state without normalization
