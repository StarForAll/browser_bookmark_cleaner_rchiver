# Reviewer Commands Round 2

## Task Summary

This round is a targeted re-review after round-1 fixes. Focus only on whether the accepted reviewer concerns were actually closed and whether the follow-up task records remain internally consistent.

---

## Task Metadata

- Task ID: `04-09-merge-brainstorm-improvements`
- Round: `2`
- Task dir: `/ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/04-09-merge-brainstorm-improvements`

---

## Review Scope

- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-09-merge-brainstorm-improvements/prd.md`
- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-09-merge-brainstorm-improvements/self-review.md`
- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-09-merge-brainstorm-improvements/.new-cleanup-decisions.md`
- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/04-09-merge-brainstorm-improvements/summary-round-1.md`
- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/04-09-merge-brainstorm-improvements/action.md`

## Review Focus

- check whether `self-review.md` now states verification scope and evidence accurately
- check whether `.new-cleanup-decisions.md` is complete enough to audit all reviewed `.new` candidate decisions
- check whether round-1 summary/action files match the actual accepted fixes and ignored suggestions
- report only still-valid or newly introduced findings after round-1 fixes

## Reviewer Constraints

- default reviewer set for this round: `claude` + `opencode`
- reviewer may only run `multi-cli-review`
- reviewer must not modify code
- reviewer must not create directories

## Reviewer Commands

```text
/multi-cli-review "Re-review 04-09-merge-brainstorm-improvements after round-1 fixes. Focus on whether self-review.md now states verification evidence accurately, whether .new-cleanup-decisions.md fully captures merge/skip/delete decisions for all reviewed .new candidates, and whether summary-round-1/action.md truthfully reflect accepted fixes and ignored suggestions. Report only still-valid or newly introduced findings; do not modify code." /ops/projects/personal/browser_bookmark_cleaner_rchiver --task-dir /ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/04-09-merge-brainstorm-improvements --reviewer-id claude --round 2 --review-focus "round-1 修复闭环、自审证据表述、.new 清理决策可追溯性、任务记录一致性"

/multi-cli-review "Re-review 04-09-merge-brainstorm-improvements after round-1 fixes. Focus on whether self-review.md now states verification evidence accurately, whether .new-cleanup-decisions.md fully captures merge/skip/delete decisions for all reviewed .new candidates, and whether summary-round-1/action.md truthfully reflect accepted fixes and ignored suggestions. Report only still-valid or newly introduced findings; do not modify code." /ops/projects/personal/browser_bookmark_cleaner_rchiver --task-dir /ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/04-09-merge-brainstorm-improvements --reviewer-id opencode --round 2 --review-focus "round-1 修复闭环、自审证据表述、.new 清理决策可追溯性、任务记录一致性"
```

## Expected Output

- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/04-09-merge-brainstorm-improvements/review-round-2/claude.md`
- `/ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/multi-cli-review/04-09-merge-brainstorm-improvements/review-round-2/opencode.md`
