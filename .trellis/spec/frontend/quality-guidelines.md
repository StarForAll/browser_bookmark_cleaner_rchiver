# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

The first release must keep verification lightweight but real. Every implemented change should point to a concrete command or manual check.

Current target verification commands:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm sonar`

These commands are the expected frontend baseline and should be treated as the target verification matrix for `PLAN-01`.

Current status:

- package manager target: `pnpm`
- typecheck script target: `pnpm typecheck`
- Sonar token must not be committed as a real secret value in spec text; provide it through the `SONAR_TOKEN` environment variable at execution time
- the engineering scaffold now defines executable local command gates, but every run still needs fresh pass / fail / not run evidence

---

## Forbidden Patterns

- copying code from `tmp/ui/` into the production app
- calling `chrome.bookmarks` directly from React presentation components or generic hooks
- mixing draft-only mutations with browser-write side effects in the same function
- introducing `any` without a documented reason
- hiding failed sync or restore actions without user-visible feedback
- letting raw WebDAV or persistence transport details leak into UI copy generation
- masking a graph-visibility bug by imperatively resetting canvas scroll position after every structural change

---

## Required Patterns

- keep draft mutations inside domain, feature-state, or application-action modules
- keep browser API access, WebDAV access, and persistence access behind adapter modules
- keep overwrite-risk actions behind explicit confirmation plus execution-side eligibility checks
- keep user-facing copy centralized and Chinese-first in v1
- treat verification results as `pass` / `fail` / `not run`

---

## Testing Requirements

- unit tests use Vitest
- React component tests use Testing Library with `jsdom`
- new domain mutation logic should have at least one automated test
- graph view changes that alter decorative nodes, viewport behavior, or layout-only helpers must add a component test for both the visible contract and the non-interactive / non-reset side effect boundary
- page-level viewport helper changes must also cover coexistence with existing fixed overlays or anchors so a new floating control cannot silently block status, hint, or other shell-level affordances
- high-risk flows still require manual verification in real Chrome extension runtime
- backup, restore, and browser-write boundaries must not be claimed as safe without either automated evidence or explicit manual evidence
- if Sonar scanning is part of the acceptance path for a change, report it truthfully as `pass`, `fail`, or `not run` just like the other commands

## Test-First Inputs

Freeze these as the current project test-first baseline:

- package manager: `pnpm`
- unit or application logic test file naming: `src/**/*.test.ts`
- React component test file naming: `src/**/*.test.tsx`
- shared fixtures, mocks, and runtime helpers: `test/`
- mandatory automated command gate before claiming test pass: `pnpm test`
- no mandatory eval suite or contract-test directory in v1 unless a later task introduces one explicitly
- Chrome extension runtime behaviors still require explicit manual verification in addition to unit/component coverage
- these inputs are frozen once at project level and act as the shared test-first baseline
- when execution is split into a parent coordinator task and child execution tasks, create the actual test gate one child task at a time in dependency order
- do not claim whole-plan test coverage from the parent coordination task alone

## Child Task Closeout Record Sync

When execution is split into one parent coordinator task and multiple child execution tasks, a child task is not fully closed out until the parent-side progress records are updated in the same change scope.

Required parent-side record sync after a child task reaches completed / archived status:

- update the parent `task_plan.md` summary blocks that describe the completed frontier, pending frontier, completed-count text, and the next explicitly selectable child task
- update the parent `task.json` narrative fields such as `notes` when they describe the latest completed child task or the next serial child task
- update any other non-derived record that still names the previous frontier or an outdated completed-count snapshot

Boundary rules:

- treat `python3 ./.trellis/scripts/task.py list` as an active-children view, not as proof that parent narrative records are already synchronized
- if the CLI summary and the parent summary intentionally describe different scopes, the parent summary must state that scope explicitly
- do not leave parent records pointing at an older frontier after a newer child task has already been archived

Validation matrix for split child-task closeout:

- Good: the archived child task, parent `task_plan.md`, and parent `task.json` all name the same latest completed frontier and the same next pending child task
- Base: derived CLI output may still count only active children, but the parent summary text clearly states the full serial progress without stale frontier references
- Bad: a child task is archived as completed while the parent summary still says execution only progressed through an earlier child task or still names the already-finished task as the next entry

Wrong vs Correct:

- Wrong: archive `T09B`, but leave the parent summary saying execution only progressed through `T08A` and that `T08B` is still the next serial task
- Correct: archive `T09B`, then update the parent summary in the same round so it says execution progressed through `T09B`, moves `T10` to the next serial task, and refreshes the completed / pending count snapshot

## PLAN-01 Scaffold Baseline

The engineering scaffold baseline introduced by `T01` is defined by these concrete files and paths:

- root command contract: `package.json`
- TypeScript configs: `tsconfig.json`, `tsconfig.node.json`
- build config: `vite.config.ts`
- test config: `vitest.config.ts`
- lint config: `eslint.config.mjs`
- shared test setup: `test/setup.ts`
- scaffold baseline assertion file: `src/engineeringBaseline.test.ts`
- required top-level paths: `public/`, `src/app/`, `src/features/`, `src/domain/`, `src/adapters/`, `src/shared/`, `test/`

Required command expectations:

- `package.json` must expose `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
- `pnpm test` must execute the scaffold baseline assertions before later feature tasks build on top
- `pnpm build` must prove the repository has one concrete Vite entry and can emit a production bundle without requiring bookmark or WebDAV behavior

Validation matrix for the scaffold baseline:

- Good: all required files and directories exist; `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all return exit code `0`
- Base: only scaffold facts are asserted; no manifest, bookmark import, graph editing, or WebDAV behavior is required yet
- Bad: command scripts are missing, config files are absent, required directories are absent, or validation commands fail

Required assertion points for `T01`:

- `src/engineeringBaseline.test.ts` asserts the command contract in `package.json`
- `src/engineeringBaseline.test.ts` asserts the required root config files exist
- `src/engineeringBaseline.test.ts` asserts the required directory skeleton exists
- command results must still be reported as `pass`, `fail`, or `not run` even after the scaffold becomes executable

---

## Code Review Checklist

- does the change keep draft state and browser side effects separated?
- does the change preserve one normalized draft truth rather than duplicating render truth?
- are cloud-disabled reasons visible when WebDAV is unavailable?
- did the change keep user-facing copy out of adapter and transport code?
- did the change add or update relevant tests or clearly label them as not run?
