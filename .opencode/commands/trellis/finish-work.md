# Finish Work - Pre-Commit Checklist

Before submitting or committing, use this checklist to ensure work completeness.

**Timing**: After code is written and tested, before commit

---

## Checklist

### 1. Code Quality

<!-- finish-work-projectization-patch -->

Current project target matrix after `PLAN-01` scaffold exists:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm sonar`

Checklist:

- [ ] Project verification commands are already frozen for the current architecture?
- [ ] The frozen verification matrix was executed and results were recorded truthfully as `pass / fail / not run`?
- [ ] If the real engineering scaffold is not ready yet, did you explicitly record that this section is `deferred` or `not run` instead of pretending success?
- [ ] No `console.log` statements (use logger)?
- [ ] No non-null assertions (the `x!` operator)?
- [ ] No `any` types?

### 1.5. Test Coverage

Check if your change needs new or updated tests (see `.trellis/spec/frontend/quality-guidelines.md`):

- [ ] New pure function or domain mutation → test added in `src/**/*.test.ts`?
- [ ] Component behavior change → test added or updated in `src/**/*.test.tsx`?
- [ ] Shared fixtures or runtime helpers needed → placed under `test/`?
- [ ] No logic change (text/data only) → no test needed

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

### 2.2. Parent / Child Task Record Sync

If the current task is a child task under a parent coordinator task:

- [ ] After this child task reaches completed / archived status, will the parent `task_plan.md` summary be updated in the same round?
- [ ] If the parent `task.json` `notes` or other narrative metadata names the latest completed frontier or next serial child task, will that metadata be updated too?
- [ ] Are you relying on `python3 ./.trellis/scripts/task.py list` only for active-child visibility, rather than treating it as proof that parent narrative records are already synchronized?

**Block Rule**:
Do not treat child-task closeout as complete if the parent coordinator records still point at an older completed frontier or still name the just-finished child task as the next task.

### 2.5. Code-Spec Hard Block (Infra/Cross-Layer)

If this change touches infra or cross-layer contracts, this is a blocking checklist:

- [ ] Spec content is executable (real signatures/contracts), not principle-only text
- [ ] Includes file path + command/API name + payload field names
- [ ] Includes validation and error matrix
- [ ] Includes Good/Base/Bad cases
- [ ] Includes required tests and assertion points

**Block Rule**:
In pipeline mode, the finish agent will automatically detect and execute spec updates when gaps are found.
If running this checklist manually, ensure spec sync is complete before committing — run `/trellis:update-spec` if needed.

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

1. Confirm whether the project's verification commands are frozen (check `.trellis/spec/` quality guidelines).
2. If yes, run the frozen verification matrix and record real outcomes.
3. Review changed files with `git status` and `git diff --name-only`.
4. Based on changed files, check the relevant items above.
5. Report the checklist result; post-commit operations (task archive, session recording) are handled by the close-out stage, not by this command.

---

## Common Oversights

| Oversight | Consequence | Check |
|-----------|-------------|-------|
| Code-spec docs not updated | Others don't know the change | Check .trellis/spec/ |
| Spec text is abstract only | Easy regressions in infra/cross-layer changes | Require signature/contract/matrix/cases/tests |
| Migration not created | Schema out of sync | Check db/migrations/ |
| Types not synced | Runtime errors | Check shared types |
| Tests not updated | False confidence | Run full test suite |
| Child task archived but parent summary still points to the old frontier | Workflow drift and misleading progress | Sync parent `task_plan.md` and `task.json` in the same round |
| Console.log left in | Noisy production logs | Search for console.log |

---

## Relationship to Other Commands

```
Development Flow:
  Write code -> Test -> /trellis:check -> /trellis:review-gate -> /trellis:finish-work -> git commit -> /trellis:delivery -> /trellis:record-session
                         |                   |                        |                              |
                  Quality check        Multi-CLI review        Ensure completeness           Acceptance & handoff

Debug Flow:
  Hit bug -> Fix -> /trellis:break-loop -> Knowledge capture
                       |
                  Deep analysis
```

- `/trellis:finish-work` - Check work completeness (this command)
- `/trellis:delivery` - Acceptance testing, deliverables, changelog, knowledge capture
- `/trellis:record-session` - Record session and commits
- `/trellis:break-loop` - Deep analysis after debugging

---

## Core Principle

> **Delivery includes not just code, but also documentation, verification, and knowledge capture.**

Complete work = Code + Docs + Tests + Verification
