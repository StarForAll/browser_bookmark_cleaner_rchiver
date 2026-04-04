---
name: finish-work
description: "Pre-commit quality checklist covering verification readiness, code-spec sync, API changes, database migrations, cross-layer verification, and manual testing. Blocks commit if infra or cross-layer specs lack executable depth. Use when code is written and tested but not yet committed, before submitting changes, or as a final review before git commit."
---

# Finish Work - Pre-Commit Checklist

Before submitting or committing, use this checklist to ensure work completeness.

**Timing**: After code is written and tested, before commit

---

## Checklist

### 1. Code Quality

Current project target matrix after `PLAN-01` scaffold exists:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `sonar-scanner -Dsonar.projectKey=bbcr -Dsonar.token=$SONAR_TOKEN -Dsonar.host.url=https://sonarqube.xzc.com:13785 -Dsonar.sources=.`

Checklist:

- [ ] Project verification commands are already frozen for the current architecture?
- [ ] The frozen verification matrix was executed and results were recorded truthfully as `pass / fail / not run`?
- [ ] If the real engineering scaffold is not ready yet, did you explicitly record that this section is `deferred` or `not run` instead of pretending success?
- [ ] No `console.log` statements (use logger)?
- [ ] No non-null assertions (the `x!` operator)?
- [ ] No `any` types?

### 1.5. Test Coverage

Current project testing conventions:

- unit or application logic tests: `src/**/*.test.ts`
- React component tests: `src/**/*.test.tsx`
- shared fixtures, mocks, and helpers: `test/`
- no mandatory `tests/evals/EVAL-<id>.yaml` in v1 unless a later task explicitly introduces it

Checklist:

- [ ] New pure function or domain mutation → test added or updated?
- [ ] Component behavior change → corresponding component test added or updated?
- [ ] No logic change (text/data/spec-only) → no test required and reason is clear?

### 2. Code-Spec Sync

**Code-Spec Docs**:
- [ ] Does `.trellis/spec/backend/` need updates?
  - New patterns, new modules, new conventions
- [ ] Does `.trellis/spec/frontend/` need updates?
  - New components, new hooks, new patterns
- [ ] Does `.trellis/spec/guides/` need updates?
  - New cross-layer flows, lessons from bugs
- [ ] If this is a Trellis-related change, were all linked current-entry hidden directories checked and synchronized as needed?
  - `.trellis/`
  - `.claude/`
  - `.opencode/`
  - `.agents/skills/`
  - `.codex/`

**Key Question**: 
> "If I fixed a bug or discovered something non-obvious, should I document it so future me (or others) won't hit the same issue?"

If YES -> Update the relevant code-spec doc.

### 2.5. Code-Spec Hard Block (Infra/Cross-Layer)

If this change touches infra or cross-layer contracts, this is a blocking checklist:

- [ ] Spec content is executable (real signatures/contracts), not principle-only text
- [ ] Includes file path + command/API name + payload field names
- [ ] Includes validation and error matrix
- [ ] Includes Good/Base/Bad cases
- [ ] Includes required tests and assertion points

**Block Rule**:
If infra/cross-layer changed but the related spec is still abstract, do NOT finish. Run `$update-spec` manually first.

### 3. API Changes

If you modified API endpoints:

- [ ] Input schema updated?
- [ ] Output schema updated?
- [ ] API documentation updated?
- [ ] Client code updated to match?

### 4. Database Changes

If you modified database schema:

- [ ] Migration file created?
- [ ] Schema file updated?
- [ ] Related queries updated?
- [ ] Seed data updated (if applicable)?

### 5. Cross-Layer Verification

If the change spans multiple layers:

- [ ] Data flows correctly through all layers?
- [ ] Error handling works at each boundary?
- [ ] Types are consistent across layers?
- [ ] Loading states handled?

### 6. Manual Testing

- [ ] Feature works in browser/app?
- [ ] Edge cases tested?
- [ ] Error states tested?
- [ ] Works after page refresh?

---

## Quick Check Flow

1. Confirm whether the project's verification commands are frozen.
2. If yes, run the frozen verification matrix and record real outcomes.
3. Review changed files with `git status` and `git diff --name-only`.
4. Based on changed files, check the relevant items above.
5. If the task is the current session's final close-out, archive the completed task and then use `record-session-helper.py`.

---

## Common Oversights

| Oversight | Consequence | Check |
|-----------|-------------|-------|
| Code-spec docs not updated | Others don't know the change | Check .trellis/spec/ |
| Spec text is abstract only | Easy regressions in infra/cross-layer changes | Require signature/contract/matrix/cases/tests |
| Migration not created | Schema out of sync | Check db/migrations/ |
| Types not synced | Runtime errors | Check shared types |
| Verification matrix not frozen yet but treated as complete | False confidence | Mark verification as deferred until architecture/commands are frozen |
| Console.log left in | Noisy production logs | Search for console.log |

---

## Relationship to Other Commands

```
Development Flow:
  Write code -> Test -> $finish-work -> git commit -> $record-session
                          |                              |
                   Ensure completeness              Record progress
                   
Debug Flow:
  Hit bug -> Fix -> $break-loop -> Knowledge capture
                       |
                  Deep analysis
```

- `$finish-work` - Check work completeness (this skill)
- `$record-session` - Record session and commits
- `$break-loop` - Deep analysis after debugging

---

## Core Principle

> **Delivery includes not just code, but also documentation, verification, and knowledge capture.**

Complete work = Code + Docs + Tests + Verification
