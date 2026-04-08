# T08A Review Gate Round 1

## 判定

- 结果：`required`

## 触发依据

- 用户显式触发了任务级 `check`，按工作流硬条件进入多 CLI 补充审查
- `T08A` 改动横跨多层：
  - `src/app/App.tsx` 搜索输入、键盘导航状态与事件分流
  - `src/features/bookmark-graph/state/searchAndFocus.ts` 搜索结果与 duplicate-only 分组派生
  - `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx` 搜索聚焦、滚动、重复项视图与视觉状态
  - `src/app/app.css` / 文案 / spec 文档的可见合同同步
- 当前行为包含键盘导航、滚动聚焦、视图切换与视觉区分，blast radius 超过单组件修改
- 自审已发现文档口径漂移，说明仍需要独立 reviewer 再次确认“实现 / 文档 / 验收口径”是否完全一致

## 当前已知状态

- `self-review`：已完成，见 [self-review.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-04-search-duplicate-focus/self-review.md#L1)
- 自动化验证：
  - `pnpm test`：`pass`
  - `pnpm lint`：`pass`
  - `pnpm typecheck`：`pass`
  - `pnpm build`：`pass`
  - `git diff --check`：`pass`
- 真实扩展页手测：`not run`

## 审查重点

- 普通搜索是否严格遵循“输入只高亮，`Enter` 后才聚焦首个结果”
- `ArrowUp / ArrowDown` 是否只在普通搜索导航态下生效，且不会误触发节点重排
- duplicate-only 视图与普通搜索导航的边界是否清晰，没有状态串扰
- `is-selected` / `is-search-match` / `is-search-focus` 的视觉语义是否真正分离
- 文档 / spec / task 口径是否与当前实现一致
