# Self Review

## Scope
- Current task: `04-09-page-back-to-top-control`
- Reviewed files:
  - [App.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/App.tsx#L418)
  - [app.css](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/app.css#L954)
  - [App.undoHistory.test.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/App.undoHistory.test.tsx#L186)
  - [appShell.ts](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/shared/copy/appShell.ts#L15)

## Verification
- `pnpm test -- --run src/app/App.undoHistory.test.tsx`: pass
- `pnpm lint`: pass
- `pnpm typecheck`: pass
- `pnpm build`: pass
- `self-review-check.py`: pass for test/lint/typecheck input set

## Findings
- `L1` Potential overlay collision remains unverified. The page-level back-to-top button is fixed at bottom-right with `z-index: 20` in [app.css](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/app.css#L954), while status popover/anchor uses a lower floating layer (`z-index: 19`) and is also positioned near the lower-right visible canvas area. In long-page scenarios the new button can visually cover the status anchor or status popover entry point. Current tests only verify presence, fixed positioning, and click behavior in [App.undoHistory.test.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/App.undoHistory.test.tsx#L186); there is no regression that asserts non-overlap with the existing floating status UI.

## Spec Check
- Component responsibility: pass
  - page-level viewport helper stays in app shell and does not mutate draft state
- View-only boundary: pass
  - button only reads `window.scrollY` and calls `window.scrollTo`
- Accessibility baseline: pass
  - icon-only control keeps `aria-label` and `title`
- Security / sharp edges: no security footgun found in this change

## Residual Risks
- Manual browser verification is still needed for coexistence with the bottom-right status popup/anchor on long pages.
- The older exploratory task [prd.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-09-draft-canvas-back-to-top/prd.md#L1) remains in the repo and now no longer describes the shipped behavior; this is task-history drift, not runtime drift.

## Recommendation
- Before entering supplementary review, either:
  - manually verify the page-level button does not cover the status popup/anchor in the real extension page, or
  - move the button to a non-conflicting corner / add collision-aware offset logic and cover it with a regression test.
