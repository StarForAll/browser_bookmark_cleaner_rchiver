# T08A Reviewer Commands Round 1

## Task Summary

- 任务：`T08A` / `search-duplicate-focus`
- 目标：补充审查普通搜索的 Enter-only 聚焦导航、duplicate-only 分组视图、以及三种节点视觉状态的实现与文档一致性

## Review Focus

- 普通搜索输入与 `Enter` 激活导航的状态边界
- `ArrowUp / ArrowDown` 与节点排序快捷键的互斥关系
- duplicate-only 分组视图与普通搜索导航是否串扰
- `is-selected` / `is-search-match` / `is-search-focus` 的视觉合同
- 文档 / spec / task 描述是否仍残留“默认自动聚焦第一条”的漂移

## Target Paths

- `src/app/App.tsx`
- `src/app/App.searchFocus.test.tsx`
- `src/app/app.css`
- `src/features/bookmark-graph/state/searchAndFocus.ts`
- `src/features/bookmark-graph/state/searchAndFocus.test.ts`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx`
- `src/shared/copy/appShell.ts`
- `.trellis/tasks/04-04-search-duplicate-focus/self-review.md`
- `.trellis/tasks/04-04-search-duplicate-focus/prd.md`
- `.trellis/spec/frontend/draft-graph-workspace.md`
- `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/search-and-focus.md`
- `docs/UI-INTERACTION.md`
- `docs/PRD.md`

## Commands

### Claude

```text
/multi-cli-review "Review T08A search and duplicate focus after the Enter-only normal-search navigation update. Focus on src/app/App.tsx, src/app/App.searchFocus.test.tsx, src/app/app.css, src/features/bookmark-graph/state/searchAndFocus.ts, src/features/bookmark-graph/state/searchAndFocus.test.ts, src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx, src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx, src/shared/copy/appShell.ts, .trellis/tasks/04-04-search-duplicate-focus/self-review.md, .trellis/tasks/04-04-search-duplicate-focus/prd.md, .trellis/spec/frontend/draft-graph-workspace.md, .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/search-and-focus.md, docs/UI-INTERACTION.md, and docs/PRD.md. Check whether normal search now updates matches without focusing until Enter, whether ArrowUp/ArrowDown only navigate while search navigation is active and never trigger reorder behavior, whether duplicate-only stays isolated from normal-search navigation, whether selected/search-match/search-focus visual states remain distinct, and whether docs/specs still contain wording drift about automatic focus." . --task-dir tmp/multi-cli-review/04-04-search-duplicate-focus --reviewer-id claude --round 1 --review-focus "Enter-only focus contract, keyboard-nav vs reorder boundary, doc/spec drift"
```

### OpenCode

```text
/multi-cli-review "Review T08A search and duplicate focus after the Enter-only normal-search navigation update. Focus on src/app/App.tsx, src/app/App.searchFocus.test.tsx, src/app/app.css, src/features/bookmark-graph/state/searchAndFocus.ts, src/features/bookmark-graph/state/searchAndFocus.test.ts, src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx, src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx, src/shared/copy/appShell.ts, .trellis/tasks/04-04-search-duplicate-focus/self-review.md, .trellis/tasks/04-04-search-duplicate-focus/prd.md, .trellis/spec/frontend/draft-graph-workspace.md, .trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/search-and-focus.md, docs/UI-INTERACTION.md, and docs/PRD.md. Check whether normal search now updates matches without focusing until Enter, whether ArrowUp/ArrowDown only navigate while search navigation is active and never trigger reorder behavior, whether duplicate-only stays isolated from normal-search navigation, whether selected/search-match/search-focus visual states remain distinct, and whether docs/specs still contain wording drift about automatic focus." . --task-dir tmp/multi-cli-review/04-04-search-duplicate-focus --reviewer-id opencode --round 1 --review-focus "cross-layer search-state drift, duplicate-only isolation, regression risk"
```
