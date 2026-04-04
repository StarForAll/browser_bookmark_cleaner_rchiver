# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

The first release must keep verification lightweight but real. Every implemented change should point to a concrete command or manual check.

Current target verification commands:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `sonar-scanner -Dsonar.projectKey=bbcr -Dsonar.token=$SONAR_TOKEN -Dsonar.host.url=https://sonarqube.xzc.com:13785 -Dsonar.sources=.`

These commands are the expected frontend baseline and should be treated as the target verification matrix for `PLAN-01`.

Current status:

- package manager target: `pnpm`
- typecheck script target: `pnpm typecheck`
- Sonar token must not be committed as a real secret value in spec text; provide it through the `SONAR_TOKEN` environment variable at execution time
- until the real engineering scaffold exists, this matrix is a frozen target rather than already-proven executable evidence

---

## Forbidden Patterns

- copying code from `tmp/ui/` into the production app
- calling `chrome.bookmarks` directly from React presentation components or generic hooks
- mixing draft-only mutations with browser-write side effects in the same function
- introducing `any` without a documented reason
- hiding failed sync or restore actions without user-visible feedback
- letting raw WebDAV or persistence transport details leak into UI copy generation

---

## Required Patterns

- keep draft mutations inside domain, feature-state, or application-action modules
- keep browser API access, WebDAV access, and persistence access behind adapter modules
- keep overwrite-risk actions behind explicit confirmation plus execution-side eligibility checks
- keep user-facing copy centralized and Chinese-first in v1
- treat verification results as `pass` / `fail` / `not run`

---

## Testing Requirements

- unit tests use Vitest
- React component tests use Testing Library with `jsdom`
- new domain mutation logic should have at least one automated test
- high-risk flows still require manual verification in real Chrome extension runtime
- backup, restore, and browser-write boundaries must not be claimed as safe without either automated evidence or explicit manual evidence
- if Sonar scanning is part of the acceptance path for a change, report it truthfully as `pass`, `fail`, or `not run` just like the other commands

## Test-First Inputs

Freeze these as the current project test-first baseline:

- package manager: `pnpm`
- unit or application logic test file naming: `src/**/*.test.ts`
- React component test file naming: `src/**/*.test.tsx`
- shared fixtures, mocks, and runtime helpers: `test/`
- mandatory automated command gate before claiming test pass: `pnpm test`
- no mandatory eval suite or contract-test directory in v1 unless a later task introduces one explicitly
- Chrome extension runtime behaviors still require explicit manual verification in addition to unit/component coverage

---

## Code Review Checklist

- does the change keep draft state and browser side effects separated?
- does the change preserve one normalized draft truth rather than duplicating render truth?
- are cloud-disabled reasons visible when WebDAV is unavailable?
- did the change keep user-facing copy out of adapter and transport code?
- did the change add or update relevant tests or clearly label them as not run?
