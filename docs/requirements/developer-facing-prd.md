# 开发向需求文档：工作区交互与视觉质量优化

## 1. 目标

在不改变业务逻辑和信息架构的前提下，补齐 `src/app/app.css` 中的交互状态、动效、滚动条、错误提示和细节视觉表现，让主工作区达到可交付产品级的界面质量。

## 2. 用户确认范围

- 范围：全量执行 P0-P2。
- 拖拽节点样式：半透明“幽灵”效果，不增加会干扰放置判断的边框高亮。
- 动画强度：适中，使用 slide-up + fade，持续时间约 200-280ms。
- 改动类型：CSS 优化为主，不新增依赖，不改业务行为。

## 3. 修改文件

主要修改：

- `src/app/app.css`

配套验证：

- 现有 React 组件测试。
- 现有交互和样式相关断言。
- 手动检查 hover、active、focus-visible、拖拽、弹窗、空态和滚动条。

## 4. P0：核心交互反馈

必须完成：

- `.action-grid button`
- `.secondary-actions button`
- `.search-placeholder button`
- `.draft-dialog-button`
- `.search-placeholder input`
- `.draft-field input`
- `.draft-node-button.is-dragging`
- `.draft-node-drop-zone.is-active`

要求：

- 补齐 transition。
- 补齐 hover、active、focus-visible、disabled。
- 拖拽节点使用透明度、阴影和轻微位移体现“正在拖拽”。
- 放置区保持命中能力，不添加强干扰背景或虚线边框。

## 5. P1：重要视觉增强

必须完成：

- 为已有 hover / focus 的元素补齐 active 态。
- 弹窗 backdrop fade-in。
- 弹窗 card slide-up + fade-in。
- 悬浮层展开按钮 hover / active / focus-visible。
- 节点图标和 URL 预览在 hover 时增强可读性。

重点选择器：

- `.draft-node-button:active`
- `.page-back-to-top-button:active`
- `.local-recovery-choice:active`
- `.status-close:active`
- `.status-anchor:active`
- `.draft-layout-popover-close:active`
- `.draft-dialog-backdrop`
- `.draft-dialog-card`
- `.draft-hover-expand-button`

## 6. P2：精致细节

必须完成：

- 主要滚动区域滚动条统一，并包含 Firefox 兼容。
- 状态弹窗、操作提示、草稿卡片、空态、搜索空态、回到顶部按钮入场动画。
- 状态历史、启动预览、重复路径、重复聚焦卡片列表项 hover 高亮。
- `.draft-form-error`、`.draft-dialog-warning`、`.overwrite-confirmation-caution` 形成明确层级。
- 禁用按钮统一 `opacity`、`filter` 和 `cursor`。
- `.action-note`、`.webdav-settings-result`、`.status-close` 补齐细节反馈。

## 7. 设计约束

- hover 位移控制在 `translateY(-1px)` 到 `translateY(-2px)`。
- active 态回到 `translateY(0)` 或轻微下压。
- focus-visible 使用清晰但不刺眼的 teal ring。
- 动效使用 160-280ms，避免慢动画影响编辑效率。
- 拖拽态不增加虚线边框，避免与可投放命中状态混淆。
- 不引入紫色主导、纯白后台感或装饰性过强的视觉主题。

## 8. 验收标准

- 所有 P0 项完成。
- 所有 P1 项完成。
- 所有 P2 项完成。
- `pnpm test` 通过。
- `pnpm lint` 无错误。
- `pnpm typecheck` 无错误。
- 手动验证 Tab 导航焦点环、按钮 hover / active、弹窗动画、拖拽视觉区分、空态、滚动条。

## 9. 测试策略

- 纯 CSS 变更通常不需要新增业务单元测试。
- 如样式变更影响可访问名称、DOM 结构、按钮启用条件或交互流程，必须补充组件测试。
- 保留现有组件测试作为回归门禁。
- 人工检查必须覆盖键盘、鼠标、拖拽、弹窗和 WebDAV 设置反馈。

## 10. 风险

- CSS 选择器过宽可能影响无关按钮。
- 动画可能影响对话框焦点和测试时序。
- 拖拽态可能干扰 drop zone 命中判断。
- 滚动条样式在不同浏览器上的支持不同，需要分别处理 WebKit 与 Firefox。
