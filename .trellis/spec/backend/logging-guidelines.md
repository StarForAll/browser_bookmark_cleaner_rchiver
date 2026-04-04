# Logging Guidelines

> How backend-style logging is handled in this project.

---

## Overview

There is no standalone backend logging pipeline in v1.

Current operational visibility comes from:

- user-visible status history inside the extension workspace
- development-time console and test output
- helper-script command output when workflow tooling runs

---

## Current Rules

- do not assume a persistent server log sink exists
- do not treat user-visible status history as an internal debug log stream
- never log WebDAV passwords, authorization headers, or equivalent secret values
- if endpoint URLs or usernames appear in debugging output, keep them intentionally limited and avoid leaking full sensitive context

---

## If Backend Logging Appears Later

When a real backend runtime is introduced later, this file must define:

- log levels
- structured log fields
- secret redaction rules
- correlation or request identifiers
- operational retention assumptions

Until then, keep logging expectations minimal and local.

---

## Common Mistakes

- assuming browser console output is equivalent to backend observability
- sending secret-bearing configuration values into debug output
- duplicating user-facing result messages as if they were a structured server log pipeline
