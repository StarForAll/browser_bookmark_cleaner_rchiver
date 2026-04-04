# Freeze UI Reference Constraints

## Goal
Convert approved `tmp/ui` reference assets into explicit implementation constraints without copying or evolving prototype code.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T02`
- 依赖任务：无
- 主要设计输入：`design/specs/visual-system.md`, `tmp/ui/`, `PLAN-01A.md`

## In Scope
- Extract layout, tone, hierarchy, and visual-system constraints
- Record what may be inherited and what must not be reused

## Out Of Scope
- No React component implementation
- No CSS implementation
- No runtime asset import from `tmp/ui`

## Start Conditions
- `tmp/ui` reference assets are present and approved as reference-only evidence

## Waiting Conditions
- None at planning level

## Requirements
- Constraints must be implementation-facing, not mood-board-only
- Reuse boundary must be explicit and enforceable

## Acceptance Criteria
- [ ] Allowed inheritance boundary is documented
- [ ] Forbidden code reuse boundary is documented

## Verification Plan
- `not run` in pure plan stage
- Later validation:
  - document review against `tmp/ui`
  - implementation review against the frozen no-reuse boundary

## Technical Notes
- This is a docs-only task
- The output constrains later UI tasks rather than shipping UI by itself
