# T05 Reviewer Commands Round 1

## Task Summary

Review `T05 / Implement Browser Bookmark Import To Draft`.

The task reads the browser bookmark tree, normalizes it into draft truth, persists the imported draft session locally, and on refresh/startup restores local draft before any further browser read.

## Review Scope

- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/adapters/browser-bookmarks`
- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/adapters/local-persistence`
- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/features/browser-sync/application`
- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/App.tsx`
- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/shared/copy/appShell.ts`
- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-04-browser-import-to-draft/prd.md`
- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-04-browser-import-to-draft/self-review.md`

## Review Focus

- startup import/restore determinism
- persisted draft session write/read contract consistency
- browser root stripping and normalization boundaries
- unhandled error paths or misleading state/result copy
- missing regression coverage around refresh behavior

## Reviewer Constraints

- reviewer count for this round: `1`
- round: `1`
- reviewer may only run `multi-cli-review`
- reviewer must not modify code
- reviewer must not create directories

## Reviewer Assignment

- suggested reviewer-id: `claude`

## Command

```text
/multi-cli-review "Review T05 browser import to draft for bugs, regressions, startup restore determinism, persistence contract mismatches, and misleading UI states. Report findings only; do not modify code." /ops/projects/personal/browser_bookmark_cleaner_rchiver --task-dir /ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/browser-import-to-draft --reviewer-id claude --round 1 --review-focus "startup import vs local restore, persistence symmetry, normalization boundaries, UI state diagnostics"
```

## Expected Output

Reviewer report path:

`/ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/browser-import-to-draft/review-round-1/claude.md`
