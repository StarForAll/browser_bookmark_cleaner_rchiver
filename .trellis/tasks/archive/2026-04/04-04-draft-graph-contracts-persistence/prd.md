# Define Draft Graph Contracts And Local Persistence

## Goal
Define the single source-of-truth draft graph model and its local persistence boundaries for later UI and sync tasks.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T04`
- 功能依赖任务：`T03`
- 串行前序任务：`T03`
- 主要设计输入：`design/DDD.md`, `design/specs/bookmark-graph.md`, `design/specs/history-and-recovery.md`

## In Scope
- Define normalized graph model and schema version
- Define local persistence contract for draft, layout, expand state, and undo history

## Out Of Scope
- No Chrome bookmark import execution
- No graph interaction UI
- No browser writeback or WebDAV

## Start Conditions
- `T03` shell boundaries are stable
- `T03` has completed `test-first -> implement -> check` closeout
- `T04` is explicitly selected as the next and only execution task

## Waiting Conditions
- Cannot finalize contracts before extension runtime shell exists
- Wait until `T03` is closed out in the frozen serial chain

## Requirements
- Draft graph must be the only editable truth
- Persistence boundaries must distinguish draft truth from browser snapshots

## Acceptance Criteria
- [ ] Domain contracts are explicit and versioned
- [ ] Local persistence contract is stable enough for downstream tasks

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - contract-focused unit tests
  - schema and persistence round-trip checks

## Technical Notes
- This task is domain-contract heavy and should remain UI-light
- Undo storage model must align with the frozen hybrid checkpoint strategy
