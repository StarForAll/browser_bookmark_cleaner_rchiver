# T08A Reviewer Commands Round 2

## Task Summary

- 任务：`T08A` / `search-duplicate-focus`
- 目标：复核 round-1 修复后，Enter-only 普通搜索导航、文档合同同步、以及“搜索导航不改变 selected”门禁是否真正收口

## Review Focus

- round-1 修复后的文档 / spec / task 口径是否已完全一致
- 普通搜索是否仍严格遵循“输入只高亮，Enter 后才聚焦首个结果”
- `ArrowUp / ArrowDown` 是否只在搜索导航态工作，且门禁已明确锁住“不改变当前选中节点”
- round-1 关闭项是否合理，没有遗漏新的实现缺陷

## Target Paths

- `src/app/App.tsx`
- `src/app/App.searchFocus.test.tsx`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
- `src/features/bookmark-graph/state/searchAndFocus.ts`
- `src/shared/copy/appShell.ts`
- `.trellis/tasks/04-04-search-duplicate-focus/self-review.md`
- `.trellis/tasks/04-04-search-duplicate-focus/check/review-gate-round-1.md`
- `.trellis/tasks/04-04-search-duplicate-focus/check/reviewer-commands-round-1.md`
- `tmp/multi-cli-review/04-04-search-duplicate-focus/summary-round-1.md`
- `tmp/multi-cli-review/04-04-search-duplicate-focus/action.md`
- `.trellis/spec/frontend/draft-graph-workspace.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/search-and-focus.md`
- `docs/UI-INTERACTION.md`
- `docs/PRD.md`

## Commands

### Claude

```text
/multi-cli-review "Review T08A round-2 after the round-1 doc-sync and gate hardening. Focus on src/app/App.tsx, src/app/App.searchFocus.test.tsx, src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx, src/features/bookmark-graph/state/searchAndFocus.ts, src/shared/copy/appShell.ts, .trellis/tasks/04-04-search-duplicate-focus/self-review.md, .trellis/tasks/04-04-search-duplicate-focus/check/review-gate-round-1.md, .trellis/tasks/04-04-search-duplicate-focus/check/reviewer-commands-round-1.md, tmp/multi-cli-review/04-04-search-duplicate-focus/summary-round-1.md, tmp/multi-cli-review/04-04-search-duplicate-focus/action.md, .trellis/spec/frontend/draft-graph-workspace.md, .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/search-and-focus.md, docs/UI-INTERACTION.md, and docs/PRD.md. Check whether the Enter-only normal-search focus contract is now consistently documented, whether ArrowUp/ArrowDown remain isolated to active search navigation without changing the selected node, and whether any round-1 issue was incorrectly closed or only cosmetically addressed." . --task-dir tmp/multi-cli-review/04-04-search-duplicate-focus --reviewer-id claude --round 2 --review-focus "round-1 fix verification, doc/spec convergence, selected-vs-search-nav boundary"
```

### OpenCode

```text
/multi-cli-review "Review T08A round-2 after the round-1 doc-sync and gate hardening. Focus on src/app/App.tsx, src/app/App.searchFocus.test.tsx, src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx, src/features/bookmark-graph/state/searchAndFocus.ts, src/shared/copy/appShell.ts, .trellis/tasks/04-04-search-duplicate-focus/self-review.md, .trellis/tasks/04-04-search-duplicate-focus/check/review-gate-round-1.md, .trellis/tasks/04-04-search-duplicate-focus/check/reviewer-commands-round-1.md, tmp/multi-cli-review/04-04-search-duplicate-focus/summary-round-1.md, tmp/multi-cli-review/04-04-search-duplicate-focus/action.md, .trellis/spec/frontend/draft-graph-workspace.md, .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/search-and-focus.md, docs/UI-INTERACTION.md, and docs/PRD.md. Check whether the Enter-only normal-search focus contract is now consistently documented, whether ArrowUp/ArrowDown remain isolated to active search navigation without changing the selected node, and whether any round-1 issue was incorrectly closed or only cosmetically addressed." . --task-dir tmp/multi-cli-review/04-04-search-duplicate-focus --reviewer-id opencode --round 2 --review-focus "round-1 regression audit, gate sufficiency, hidden drift risk"
```
