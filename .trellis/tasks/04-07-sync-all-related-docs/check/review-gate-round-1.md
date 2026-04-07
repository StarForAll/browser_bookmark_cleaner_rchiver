# Review Gate — Sync All Related Docs

## Task Context

- **Task ID**: `04-07-sync-all-related-docs`
- **Review Round**: 1
- **Date**: 2026-04-07
- **Reviewer**: Current CLI (Codex)

---

## Current Delta Summary

- This task is a repository-wide implementation-to-documentation sync, not a single-doc edit.
- The current delta crosses five active surfaces:
  - root docs such as `README.md`
  - `docs/` current-state documents
  - active frontend code-spec in `.trellis/spec/frontend/`
  - active task/design docs under `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/`
  - user-visible copy in `src/shared/copy/appShell.ts`
- Self-review already found and fixed three drift classes:
  - user-visible copy still describing drag and old hint/status placement as future or old-layout behavior
  - active docs/spec/design pages still containing stale left-bottom / bottom-right / top-right wording
  - parent task summary ambiguity between `implementation` and historical `test-first` wording

---

## Inputs Read

- `.trellis/tasks/04-07-sync-all-related-docs/prd.md`
- `.trellis/tasks/04-07-sync-all-related-docs/self-review.md`
- `git diff --stat`
- current changed-file inventory from `git status --short`
- fresh verification evidence already recorded in self-review:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `git diff --check`

---

## Hard Conditions Check

| Condition | Hit? | Notes |
|-----------|------|-------|
| Authentication / authorization / secrets | ❌ | No |
| Data migration / schema change | ❌ | No |
| Public API / external integration contract | ❌ | No runtime external API changed |
| Payment / queue / cache consistency | ❌ | No |
| Core shared module with clear blast radius | ✅ | Drift touches canonical docs/spec/design surfaces used by later implementation tasks |
| User explicitly requested task-level multi-CLI review | ✅ | Current turn explicitly triggered `$check` |

**Hard-condition result**: triggered

---

## Soft Conditions Assessment

| Factor | Assessment | Notes |
|--------|------------|-------|
| Complexity | Medium | 18 tracked file deltas plus one new spec file and one task folder |
| Impact surface | High | README, product docs, architecture docs, testing docs, active spec, active design pages, task-plan summary, and user-visible copy |
| Uncertainty | Medium | Self-review already removed known drift, but the remaining risk is omission across multiple document layers rather than code breakage |
| Blast radius | High | Any missed drift here becomes future implementation misinformation rather than an isolated typo |

---

## Determination: **REQUIRED**

### Why `required`

1. The user explicitly requested the task-level `/check` gate.
2. This task changes canonical documentation surfaces that future implementation tasks depend on.
3. The main remaining risk is missed omission across multiple active doc/spec/design layers, which benefits from independent reviewers more than from repeated self-review.
4. Fresh verification is green, but green automation does not prove repository-wide narrative consistency.

---

## Capability Check

- Current CLI `multi-cli-review-action` capability: available in project skill set
- Reviewer-side `multi-cli-review` capability: available in project skill set
- Reviewer command package: `.trellis/tasks/04-07-sync-all-related-docs/check/reviewer-commands-round-1.md`

---

## Review Focus

1. Whether any active document still states outdated current behavior after the sync.
2. Whether any doc still mixes target-state requirements with shipped-state claims unclearly.
3. Whether the new frontend spec captures only implemented draft-graph behavior and correctly leaves planned features as future scope.
4. Whether user-visible shell copy now matches the shipped layout and shipped interaction scope.
5. Whether any active task/design docs still contradict the updated root/docs/spec narrative.

---

## Next Step

- Execute round-1 reviewer commands with:
  - `--reviewer-id claude`
  - `--reviewer-id opencode`
- After both reviewer reports are available, return here and process them with `multi-cli-review-action`
