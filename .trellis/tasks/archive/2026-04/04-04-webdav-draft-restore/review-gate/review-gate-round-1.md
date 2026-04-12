---
task-id: webdav-draft-restore
round: 1
decision: required
generated-at: 2026-04-13T07:32:26+08:00
---

# Review Gate Round 1

## Decision

`required`

## Why This Is Required

Hard-condition hits:

- external integration boundary (user-provided WebDAV endpoint, remote `index.json` restore list, and remote version download)
- sensitive persisted recovery artifact (`latest-draft-backup` metadata and payload write before restore)
- cross-layer overwrite contract (WebDAV adapter -> validation -> local backup persistence -> draft replacement -> status history)
- shared app-shell action and availability gating changed across `T10`, `T11`, and `T12A`

These are explicit task-level supplementary review triggers in the workflow, so this round should receive one reviewer pass before `finish-work`.

## Evidence Summary

- `check.md` exists and reports no task-scope deviations
- `pnpm lint` -> `pass`
- `pnpm typecheck` -> `pass`
- `pnpm test` -> `pass`
- `pnpm build` -> `pass`
- manual Chrome extension verification after the latest picker / dialog adjustments -> `pass`
- `pnpm sonar` -> `not run`

## Review Focus

1. Draft-restore safety: backup-before-download ordering and fail-closed behavior when remote payloads are invalid
2. WebDAV restore contract correctness: draft-only version listing, newest-first ordering, and type-boundary enforcement
3. Shared app-shell regression risk: availability gating, shared confirmation dialog wording, and status-history reporting
4. Scope discipline: `T12A` must not absorb browser-bookmark restore execution from `T12B`

## Next Step

Run one reviewer command from `reviewer-commands-round-1.md`, then aggregate results before entering `finish-work`.
