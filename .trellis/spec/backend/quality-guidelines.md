# Quality Guidelines

> Code quality standards for backend-style code in this project.

---

## Overview

There is no standalone backend implementation in v1, so backend quality rules mainly exist to prevent architectural drift.

If no real backend runtime is being added, do not create work just to satisfy this directory.

---

## Forbidden Patterns

- introducing an API server, queue worker, or database layer without matching PRD and design changes
- moving extension runtime logic into a fake backend abstraction
- inventing backend verification claims when only frontend runtime checks exist
- storing secrets in source-controlled defaults or logging them in helper output

---

## Required Patterns

- keep extension runtime logic under frontend-aligned boundaries unless a real remote system is approved
- treat backend introduction as an architecture change, not a refactor detail
- document new operational commands, env contracts, and verification evidence before claiming backend support exists

---

## Testing Requirements

- if helper scripts are added, verify them with explicit command evidence
- if a real backend runtime is added later, this file must be expanded with concrete lint, typecheck, test, and build commands
- until then, do not claim backend verification coverage that the repository does not actually have

---

## Code Review Checklist

- does this change introduce a real backend boundary or only rename frontend runtime code?
- does the change add any new secret or deployment assumptions?
- are new verification claims backed by actual runnable commands?
- is the current extension-only architecture still represented honestly?
