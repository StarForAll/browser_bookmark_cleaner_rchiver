---
task-id: webdav-browser-restore
round: 1
decision: required
generated-at: 2026-04-13T09:15:00+08:00
---

# Review Gate Round 1

## Decision

`required`

## Why This Is Required

Hard-condition hits:

- external integration boundary: user-provided WebDAV endpoint, remote `index.json` version listing, and remote snapshot download
- high-risk overwrite target: successful execution mutates real browser bookmarks rather than draft-only state
- cross-layer overwrite contract: WebDAV adapter -> restore validation -> local browser backup persistence -> managed browser writer -> status history
- shared core module changed: `writeManagedBrowserTree.ts` now handles bookmark reordering and stale-id avoidance, which also affects other browser-write and browser-recovery flows

Additional escalation factors:

- this round fixed two real behavior bugs discovered during manual testing: top-level order was not restored, and a stale browser bookmark id could trigger `Can't find bookmark for id.`
- the latest stale-id fix has automated coverage, but real Chrome extension runtime has not been re-run after the final patch

These signals exceed the task-level supplementary review threshold, so this round should receive one reviewer pass before `finish-work`.

## Evidence Summary

- `check.md` exists and reports no task-scope deviations
- `pnpm lint` -> `pass`
- `pnpm typecheck` -> `pass`
- `pnpm test` -> `pass`
- `pnpm build` -> `pass`
- task-scope browser restore gate tests -> `pass`
- managed browser writer reorder / stale-id regression tests -> `pass`
- manual Chrome extension verification after the final stale-id fix -> `not run`

## Review Focus

1. Browser-restore safety: backup-before-overwrite ordering, fail-closed behavior, and current-draft non-mutation guarantee
2. Writer correctness: top-level reorder semantics, stale-id handling after remove-and-recreate, and rollback compatibility
3. Shared regression risk: changes to `writeManagedBrowserTree.ts` must not break `sync-draft-to-browser` or local browser-backup recovery
4. Scope discipline: `T12B` should stay inside WebDAV bookmark restore and not absorb broader closeout or unrelated runtime behavior

## Capability Check

- current CLI has `multi-cli-review-action` capability available
- reviewer capability `multi-cli-review` is available in this project skill set

## Next Step

Run one reviewer command from `reviewer-commands-round-1.md`, then aggregate results before entering `finish-work`.
