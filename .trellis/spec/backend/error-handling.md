# Error Handling

> How backend-style errors are handled in this project.

---

## Overview

The current project has no standalone backend service, so there is no server-response error contract in v1.

The live product error model is frontend-owned and should remain aligned with:

- adapter-level failure normalization
- readable Chinese user feedback
- expandable technical details
- secret-safe logging and status reporting

---

## Current Rules

- do not invent HTTP API error envelopes for flows that currently run entirely inside the extension
- do not reclassify browser or WebDAV adapter errors as “server errors” unless a real remote service exists
- if helper scripts or backend-style utilities are added later, they must still map errors into explicit typed results rather than ad hoc string throwing

---

## Future Backend Rule

If a real backend service is introduced later, this file must be extended to define:

- error classes or typed error categories
- transport-safe response envelopes
- validation failure behavior
- retryable versus non-retryable errors
- secret redaction requirements

Until then, frontend error contracts remain the source of truth.

---

## Common Mistakes

- writing backend-style error docs before a backend exists
- exposing credentials or endpoint secrets in debugging output
- assuming WebDAV transport failures should be modeled like first-party API failures
