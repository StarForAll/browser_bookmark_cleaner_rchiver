# T04 Reviewer Commands Round 1

## Task Summary

- Task: `T04 / Define Draft Graph Contracts And Local Persistence`
- Round: `1`
- Reviewer count: `1`
- Reviewer ID: `claude`

## Review Goal

Review the new `T04` contract slice as an independent reviewer. Focus on whether the draft-graph and local-persistence validators actually match the frozen design docs, whether any boundary is still too permissive or too restrictive, and whether the current tests miss any high-value contract gap that would hurt downstream tasks.

## Review Focus

- draft graph schema boundary and invariants
- local persistence domain separation
- undo/checkpoint/backup metadata contract accuracy
- `artifactType ↔ sourceOrigin` matrix correctness
- downstream compatibility risk for `T05+`

## Target Paths

- `src/domain/draft-graph/contracts.ts`
- `src/domain/draft-graph/contracts.test.ts`
- `src/adapters/local-persistence/contracts.ts`
- `src/adapters/local-persistence/contracts.test.ts`
- `src/shared/contracts/validation.ts`
- `.trellis/tasks/04-04-draft-graph-contracts-persistence/self-review.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/DDD.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md`

## Output Path

- `tmp/multi-cli-review/draft-graph-contracts-persistence/review-round-1/claude.md`

## Copy-Paste Command

```text
/multi-cli-review "Review T04 draft-graph and local-persistence contracts after self-review fixes. Focus on schema boundary correctness, validation strictness, draft-vs-browser truth separation, backup metadata pairing rules, and whether current tests miss any contract drift that could break downstream tasks." src/domain/draft-graph/contracts.ts src/domain/draft-graph/contracts.test.ts src/adapters/local-persistence/contracts.ts src/adapters/local-persistence/contracts.test.ts src/shared/contracts/validation.ts .trellis/tasks/04-04-draft-graph-contracts-persistence/self-review.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/DDD.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md --task-dir tmp/multi-cli-review/draft-graph-contracts-persistence --reviewer-id claude --round 1 --review-focus "T04 contract correctness, backup metadata boundary, and downstream compatibility risk"
```
