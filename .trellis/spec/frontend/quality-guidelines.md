# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

The first release must keep verification lightweight but real. Every implemented change should be able to point to a concrete command or manual check.

Baseline commands:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

---

## Forbidden Patterns

- Copying code from `tmp/ui/` into the production app
- Calling `chrome.bookmarks` directly from React presentation components
- Mixing draft-only mutations with browser-write side effects in the same function
- Introducing `any` without a documented reason
- Hiding failed sync or restore actions without user-visible feedback

---

## Required Patterns

- Keep draft mutations inside domain or feature-state modules
- Keep browser API access and WebDAV access behind adapter modules
- Use TypeScript strict mode
- Make user-facing error states explicit
- Treat verification results as `pass` / `fail` / `not run`

---

## Testing Requirements

- Unit tests use Vitest
- React component tests use Testing Library with `jsdom`
- New domain mutation logic should have at least one automated test
- High-risk flows still require manual verification in Chrome extension runtime

---

## Code Review Checklist

- Does the change keep draft state and browser side effects separated?
- Are cloud-disabled reasons visible when WebDAV is unavailable?
- Did the change add or update relevant tests?
- Does the code follow the feature/domain/adapter boundary?
