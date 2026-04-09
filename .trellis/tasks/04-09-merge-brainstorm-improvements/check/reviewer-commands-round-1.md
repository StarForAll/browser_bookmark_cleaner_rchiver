# Reviewer Commands Round 1

## Task Summary

Review the shared workflow `brainstorm` sync task for regressions in project-specific gate preservation, cross-CLI parity, and `.new` cleanup decisions.

---

## Task Metadata

- Task ID: `04-09-merge-brainstorm-improvements`
- Round: `1`
- Task dir: `/ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/04-09-merge-brainstorm-improvements`

---

## Review Focus

1. Project-specific gate preservation:
   - `L0/L1/L2`
   - `§2.5 需求变更管理`
   - historical drift protections
2. Cross-CLI parity between:
   - `.agents/skills/brainstorm/SKILL.md`
   - `.claude/commands/trellis/brainstorm.md`
3. Cleanup judgment for reviewed `.new` candidates:
   - were any skipped files actually worth merging?
4. Task metadata truthfulness:
   - `prd.md`
   - `self-review.md`

---

## Target Paths

- `.agents/skills/brainstorm/SKILL.md`
- `.claude/commands/trellis/brainstorm.md`
- `.trellis/tasks/04-09-merge-brainstorm-improvements/prd.md`
- `.trellis/tasks/04-09-merge-brainstorm-improvements/self-review.md`
- deleted reviewed `.new` candidates across `.agents/`, `.claude/`, and `.trellis/`
- `.trellis/workflow.md`
- `.claude/commands/trellis/record-session.md`
- `.claude/commands/trellis/check.md`

---

## Reviewer Commands

```text
/multi-cli-review "Review the shared brainstorm workflow sync task for regressions in project-specific gate preservation, cross-CLI parity between .agents and .claude, and incorrect deletion/retention decisions for reviewed .new candidates. Focus on .agents/skills/brainstorm/SKILL.md, .claude/commands/trellis/brainstorm.md, .trellis/tasks/04-09-merge-brainstorm-improvements/prd.md, .trellis/tasks/04-09-merge-brainstorm-improvements/self-review.md, and the reviewed .new cleanup decisions. Report findings only; do not modify code." /ops/projects/personal/browser_bookmark_cleaner_rchiver --task-dir /ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/04-09-merge-brainstorm-improvements --reviewer-id claude --round 1 --review-focus "项目级门禁保留、双入口文档一致性、.new 清理取舍、任务文档范围一致性"

/multi-cli-review "Review the shared brainstorm workflow sync task for regressions in project-specific gate preservation, cross-CLI parity between .agents and .claude, and incorrect deletion/retention decisions for reviewed .new candidates. Focus on .agents/skills/brainstorm/SKILL.md, .claude/commands/trellis/brainstorm.md, .trellis/tasks/04-09-merge-brainstorm-improvements/prd.md, .trellis/tasks/04-09-merge-brainstorm-improvements/self-review.md, and the reviewed .new cleanup decisions. Report findings only; do not modify code." /ops/projects/personal/browser_bookmark_cleaner_rchiver --task-dir /ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/04-09-merge-brainstorm-improvements --reviewer-id opencode --round 1 --review-focus "项目级门禁保留、双入口文档一致性、.new 清理取舍、任务文档范围一致性"
```

---

## Preconditions

- Each target reviewer CLI must have the `multi-cli-review` skill available before running the command.
- Reviewers must not edit code or create directories; the round directory already exists.
- Reviewers should report only still-valid findings or newly discovered issues.

---

## Expected Output

- `tmp/multi-cli-review/04-09-merge-brainstorm-improvements/review-round-1/claude.md`
- `tmp/multi-cli-review/04-09-merge-brainstorm-improvements/review-round-1/opencode.md`
