# T13 Test-First Gate

## Goal

Freeze the executable verification and closeout gate for `T13` before writing closeout artifacts.

## Scope

- Re-run the frozen local verification matrix for the current repository state
- Record the outcome of `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm sonar` truthfully as `pass`, `fail`, or `not run`
- Run repository-level static hygiene scans that support `finish-work`
- Capture the status of manual Chrome extension acceptance without fabricating evidence
- Prepare `check`, `finish-work`, and `delivery` artifacts for the final child-task closeout
- Sync parent-task progress records so the active frontier reflects `T13`

## Out Of Scope In This Gate

- Any new product feature, UI polish, or behavior expansion
- Silent hotfixes hidden inside closeout to force the matrix green
- Claiming manual Chrome runtime validation that did not actually happen in this round
- Archiving `T13` or running `record-session` before the human confirms the final closeout point

## Planned Verification Matrix

| Item | Command / Method | Expected handling |
|---|---|---|
| Lint | `pnpm lint` | record exit result truthfully |
| Typecheck | `pnpm typecheck` | record exit result truthfully |
| Test | `pnpm test` | record file / test counts when available |
| Build | `pnpm build` | record bundle success or failure truthfully |
| Sonar | `pnpm sonar` | run if environment allows; otherwise record `fail` or `not run` with reason |
| `console.log` scan | `rg -n "console\\.log" src test public` | `pass` when no matches |
| Non-null assertion scan | `rg -nP "(?:\\)|\\]|[A-Za-z0-9_])!(?![=])" src` | `pass` when no matches |
| Explicit `any` scan | `rg -nP "\\bany\\b|<any>|as any" src test` | `pass` when no matches |
| Formatting | `git diff --check` | `pass` when no whitespace error is reported |
| Manual Chrome acceptance | human walkthrough | truthfully record `pass`, `fail`, or `not run` |

## Gate Cases

### Automated verification gate

1. Good: the frozen repository matrix (`lint`, `typecheck`, `test`, `build`) completes successfully and is recorded with concrete evidence
2. Base: `pnpm sonar` cannot be executed because of environment or credential limits, but the reason is recorded explicitly without pretending success
3. Bad: any failing command is omitted from the report or rewritten as successful

### Manual acceptance gate

1. Good: at least one full Chrome extension main flow is confirmed by a human and the covered path is named explicitly
2. Base: no fresh manual walkthrough occurs in this round, and the report keeps manual acceptance as `not run` or references only earlier human evidence with scope limits
3. Bad: the closeout artifacts imply fresh human runtime validation that did not actually happen

### Parent / child sync gate

1. Good: parent records show that `T13` is the current active closeout frontier
2. Bad: parent records still describe `T13` as merely “next” after this task has started

## Planned Closeout Artifacts

- `check.md`
- `finish-work-checklist.md`
- `delivery/test-report.md`
- `delivery/acceptance.md`
- `delivery/deliverables.md`
- `delivery/transfer-checklist.md`
- `delivery/retrospective.md`

## Verification

- Expected result after this gate is executed: closeout artifacts exist and every verification item is labeled `pass`, `fail`, or `not run`
- `record-session` remains deferred until the human confirms the final closeout point and a real commit exists
