# T04 Check Gate Round 1

## Task

- Task ID: `T04`
- Task Dir: `.trellis/tasks/04-04-draft-graph-contracts-persistence`
- Title: `Define Draft Graph Contracts And Local Persistence`

## Decision

- Result: `required`
- Round: `1`

## Why This Review Is Required

### Hard Conditions Hit

- cross-layer contract work:
  - `T04` defines the draft-graph schema boundary that later editing, import, sync, and recovery tasks will consume
  - `T04` defines the local-persistence contract for draft snapshot, layout, expand state, undo history, checkpoints, and backup metadata
- external-system boundary preparation:
  - this slice freezes the local contract that will later sit between application logic and `chrome.storage.local`
- shared-core blast radius:
  - downstream tasks such as `T05`, `T06`, `T09B`, `T10`, `T11`, `T12A`, and `T12B` will all inherit these contracts or metadata assumptions

### Soft Conditions

- current file count is still small, but the semantic blast radius is high because these files are foundational
- current tests are contract-focused and green, but they are still authored by the implementing CLI and do not yet include an independent reviewer pass
- a permissive or under-specified validator here would propagate silent drift into later tasks

## Evidence Read

- `.trellis/tasks/04-04-draft-graph-contracts-persistence/self-review.md`
- `.trellis/tasks/04-04-draft-graph-contracts-persistence/prd.md`
- `src/domain/draft-graph/contracts.ts`
- `src/domain/draft-graph/contracts.test.ts`
- `src/adapters/local-persistence/contracts.ts`
- `src/adapters/local-persistence/contracts.test.ts`
- `src/shared/contracts/validation.ts`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/DDD.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md`

## Current Verification Evidence

- `pnpm test -- src/domain/draft-graph/contracts.test.ts src/adapters/local-persistence/contracts.test.ts`: `pass`
- `pnpm lint`: `pass`
- `pnpm typecheck`: `pass`
- `pnpm build`: `pass`
- `self-review-check.py`: `pass`

## Review Focus

- contract under-validation vs over-validation
- schema versioning and forward-compatibility boundaries
- draft truth vs persisted view-state separation
- backup metadata pairing rules and downstream recovery compatibility
- hidden spec drift that current tests may not cover

## Capability Check

- coordinator capability present: `multi-cli-review-action`
- reviewer protocol expected: `multi-cli-review`
- if the target reviewer CLI does not yet have `multi-cli-review`, stop and install that skill first

## Next Action

- generate reviewer command package and send one reviewer through round 1
