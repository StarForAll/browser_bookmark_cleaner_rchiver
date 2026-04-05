# T05 Check Gate Round 3

## Gate Result

`required`

## Reason

Round 3 is a user-requested extra verification pass after round-2 fixes landed.

Focus:

1. verify no regression was introduced by round-2 policy-reason refinements
2. verify localized unsaved-import messaging remains consistent with startup states
3. verify no new cross-layer contract drift appears between adapter/application/UI

## Scope For This Round

- `src/features/browser-sync/application/bootstrapWorkspace.ts`
- `src/features/browser-sync/application/resolveStartupImportPolicy.ts`
- `src/shared/copy/appShell.ts`
- `src/adapters/browser-bookmarks/importToDraft.ts`
- `src/adapters/browser-bookmarks/contracts.ts`
- related tests:
  - `src/features/browser-sync/application/bootstrapWorkspace.test.ts`
  - `src/features/browser-sync/application/resolveStartupImportPolicy.test.ts`
  - `src/adapters/browser-bookmarks/importToDraft.test.ts`
  - `src/adapters/browser-bookmarks/readBookmarkTree.test.ts`
  - `src/app/App.startup.test.tsx`

## Current Verification Evidence

- `pnpm test`: `pass`
- `pnpm typecheck`: `pass`
- `pnpm lint`: `pass`
- `pnpm build`: `pass`

## Next Step

Use `.trellis/tasks/04-04-browser-import-to-draft/check/reviewer-commands-round-3.md`.
