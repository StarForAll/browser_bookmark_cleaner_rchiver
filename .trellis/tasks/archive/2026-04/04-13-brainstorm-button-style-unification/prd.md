# brainstorm: ui-polish-and-button-interaction

## Goal

全面美化主工作区的视觉体验，包含两个层次：
1. **交互反馈补全**（基础层）：为所有按钮、输入框、可交互元素添加 hover / active / focus-visible 状态
2. **视图美化增强**（进阶层）：优化空态动画、弹窗入场、滚动条统一、拖拽反馈、状态提示等视觉细节

整体目标：让界面"活起来"——每个交互都有反馈，每个状态变化都有过渡，整体风格保持暖亮色 / 低饱和 slate 设计系统的一致性。

## What I Already Know

### 技术栈
- React 19 + TypeScript + Vite
- 纯 CSS（无 UI 组件库），样式集中在 `src/app/app.css`（~1678 行）
- Chrome 扩展（MV3）

### 全面 UI 审计结果（57 个改进点）

#### A. 交互反馈缺失（22 项）

| 元素 | CSS 选择器 | 缺失状态 | 优先级 |
|------|-----------|---------|--------|
| 顶部动作区按钮 | `.action-grid button` 等 | hover + active + focus-visible | P0 |
| 对话框按钮 | `.draft-dialog-button` 及变体 | hover + active + focus-visible + disabled | P0 |
| 悬浮层展开按钮 | `.draft-hover-expand-button` | hover + active + focus-visible | P1 |
| 搜索输入框 | `.search-placeholder input` | hover + focus + focus-visible + disabled + placeholder | P0 |
| 表单输入框 | `.draft-field input` | hover + focus + focus-visible + disabled + placeholder | P0 |
| 图谱节点按钮 | `.draft-node-button` | active | P1 |
| 回到顶部按钮 | `.page-back-to-top-button` | active + 入场动画 | P2 |
| 本地恢复选择 | `.local-recovery-choice` | active | P1 |
| 状态弹窗关闭 | `.status-close` | active + hover 背景 | P2 |
| 状态锚点 | `.status-anchor` | active | P2 |
| 布局弹窗关闭 | `.draft-layout-popover-close` | active | P2 |
| 拖拽中节点 | `.draft-node-button.is-dragging` | **整类缺失 CSS** | P0 |
| 拖拽放置区 | `.draft-node-drop-zone.is-active` | 保持功能命中区，但不额外增加高亮遮挡 | P1 |

#### B. 滚动条不统一（4 项）

| 元素 | 问题 | 优先级 |
|------|------|--------|
| `.draft-dialog-card` | 无自定义滚动条 | P2 |
| `.draft-hover-duplicates-list` | 无自定义滚动条 | P2 |
| `.draft-layout-popover` | 无自定义滚动条 | P2 |
| `.draft-graph-tree` | 缺少 Firefox 兼容 | P2 |

#### C. 缺少入场/过渡动画（8 项）

| 元素 | 建议动画 | 优先级 |
|------|---------|--------|
| `.draft-dialog-card` | slide-up + fade-in（12px → 0, 0.98 → 1） | P1 |
| `.draft-dialog-backdrop` | fade-in | P1 |
| `.status-popover` | slide-in + fade | P2 |
| `.hint-overlay` | fade-in | P2 |
| `.canvas-draft-card` | fade-in + scale-up | P2 |
| `.draft-empty-state` | emoji 浮动动画 + 文字 fade-in | P2 |
| `.draft-search-empty-state` | fade-in + 图标 | P2 |
| `.page-back-to-top-button` | fade-in + slide-up | P2 |

#### D. 视觉细节增强（12 项）

| 元素 | 建议增强 | 优先级 |
|------|---------|--------|
| `.action-note` | 添加 transform 滑入效果 | P2 |
| `.webdav-settings-result` | 按测试状态着色（成功/失败） | P2 |
| `.duplicate-focus-card` | hover 浮起效果 | P2 |
| `.status-history-list li` | hover 高亮 | P2 |
| `.startup-preview li` | hover 高亮 | P2 |
| `.draft-hover-duplicates-path` | hover 高亮 | P2 |
| `.duplicate-focus-group-item` | hover 高亮 | P2 |
| `.draft-form-error` | 错误横幅样式 + 图标 | P2 |
| `.draft-dialog-warning` | 警告横幅样式 | P2 |
| `.draft-type-switch` | 自定义单选按钮样式 | P3 |
| `.draft-node-icon` | hover 时去饱和恢复 | P2 |
| `.draft-node-url-preview` | hover 时透明度恢复 | P2 |

#### E. 设计系统一致性（5 项）

| 项目 | 问题 | 建议 |
|------|------|------|
| 垂直间距 | 间距值不系统（2px~24px 无规律） | 采用 4px 基准间距刻度 |
| 最小字号 | 10px 过小（辅助文本） | 提升至 11px 最小值 |
| 行高 | 1~1.55 范围过大 | 正文 1.5，标题 1.25-1.3，UI 元素 1 |
| 禁用态按钮 | 仅 `cursor: not-allowed` | 添加 `opacity: 0.5` + `filter: saturate(0.5)` |
| 提示区对比度 | 文字对比度偏低 | 提升文字颜色深度或添加微妙背景 |

### 现有设计系统特征（需保持一致）
- 主色：低饱和 slate/blue-green（`#14333a`, `#2d4a50`, `#316d72`）
- 背景：暖亮色渐变（`#f8f4ea` → `#f1ece0`）
- 卡片：半透明毛玻璃 + 圆角（14-24px）
- 按钮形状：药丸形（`border-radius: 999px`）或圆角矩形
- 交互风格：柔和位移（`translateY(-2px)`）、阴影加深、边框色加深
- 过渡时间：160-180ms，缓动曲线 `cubic-bezier(0.22, 1, 0.36, 1)`
- 焦点环：`0 0 0 2px` 或 `0 0 0 3px` + `rgba(49, 109, 114, 0.35)`

### 用户确认的偏好
- **范围裁剪**：选项 A — 全量执行 P0-P2（约 46 项），L1 标准任务
- **active 态强度**：选项 A — 微妙（`translateY(0)` 或 `translateY(1px)`，阴影减小）
- **焦点环颜色**：选项 A — 项目主色 `rgba(49, 109, 114, 0.35)`
- **拖拽节点样式**：选项 A — 半透明"幽灵"效果（`opacity: 0.6` + 阴影抬升）
- **动画强度**：选项 B — 适中（slide-up + fade，200-280ms，有存在感但不抢注意力）

## Assumptions (Temporary)

1. 用户期望的是"可感知"的交互反馈和"精致"的视觉细节，而非大幅 redesign
2. 所有动画应保持柔和、不抢注意力（160-280ms 范围）
3. 不需要引入新的 CSS 变量或设计 token，直接复用现有色值
4. P3 项（自定义单选按钮）可能超出本轮范围，可作为后续任务

## Open Questions

1. **范围裁剪**：审计发现 57 个改进点，全做会是一个 L1 任务。你是否希望：
   - 选项 A：全量执行（P0-P2，约 46 项）— L1 标准任务
   - 选项 B：只做 P0+P1（约 20 项）— 介于 L0/L1 之间
   - 选项 C：只做 P0（约 10 项，核心交互反馈）— L0 简单任务
   - **推荐**：选项 B，覆盖核心交互反馈 + 重要视觉增强，控制在合理范围

2. **拖拽中节点样式**（`.is-dragging`）：当前 JS 已添加该类但 CSS 缺失。你希望拖拽中的节点表现为：
   - 选项 A：半透明"幽灵"效果（`opacity: 0.6` + 阴影抬升）
   - 选项 B：轻微旋转 + 阴影加深（模拟"被拿起"的感觉）
   - 推荐：选项 A，更直观

3. **动画强度**：入场动画（弹窗、空态等）你偏好：
   - 选项 A：微妙 — 快速 fade-in（160ms），几乎不察觉
   - 选项 B：适中 — slide-up + fade（200-280ms），有存在感但不抢注意力
   - 推荐：选项 B，与现有 `.draft-node-button` 的 `xmind-node-fade-in` 动画风格一致

## Requirements (Evolving)

### R1: 补全所有可交互元素的交互状态（P0）
- 顶部动作区按钮：hover + active + focus-visible
- 对话框按钮（含所有变体）：hover + active + focus-visible + disabled
- 搜索输入框：hover + focus-visible + disabled + placeholder 样式
- 表单输入框：hover + focus-visible + disabled + placeholder 样式
- 拖拽中节点（`.is-dragging`）：完整的拖拽态样式
- 放置区（`.is-active`）：保持低干扰的功能命中区，不额外增加高亮背景

### R2: 补全已有 hover/focus 元素的 active 态（P1）
- 图谱节点按钮、回到顶部、本地恢复选择、状态锚点、状态关闭、布局关闭

### R3: 统一滚动条样式（P2）
- 对话框、悬浮层列表、布局弹窗添加自定义滚动条
- 图谱树添加 Firefox 兼容滚动条

### R4: 添加入场/过渡动画（P1-P2）
- 弹窗：slide-up + fade-in
- 弹窗背景：fade-in
- 空态：emoji 浮动 + 文字 fade-in
- 回到顶部按钮：fade-in + slide-up

### R5: 视觉细节增强（P2）
- 可交互列表项添加 hover 高亮
- 错误/警告文本添加横幅样式
- 节点图标和 URL 预览在 hover 时增强
- 禁用按钮添加统一的禁用态样式

### R6: 保持设计系统一致性
- 所有新增样式复用现有色值、过渡参数、缓动曲线
- 不改变任何元素的默认（idle）外观

## Acceptance Criteria (Evolving)

- [ ] 鼠标悬停在任意按钮/输入框上时，有可见的视觉变化
- [ ] 点击任意按钮时，有可见的按下反馈
- [ ] 使用 Tab 键导航时，聚焦的元素有可见的焦点环
- [ ] 拖拽节点时，拖拽源有明确的视觉区分
- [ ] 弹窗打开时有平滑的入场动画
- [ ] 空态页面有精致的视觉呈现（动画 + 图标）
- [ ] 所有滚动条样式统一
- [ ] 所有交互过渡流畅，无闪烁
- [ ] 新增样式不破坏现有元素的默认外观
- [ ] 通过 `pnpm test` 所有现有测试
- [ ] 通过 `pnpm lint` 和 `pnpm typecheck`

## Out of Scope

- 不改变任何元素的默认（idle）外观
- 不引入新的 UI 组件库或 CSS 框架
- 不涉及移动端触摸交互优化
- P3 项（自定义单选按钮样式）留待后续
- 不修改 SVG 分支线动画（需额外 JS 配合）

## Technical Notes

### 设计 token 复用
- hover 位移：`translateY(-1px)` ~ `translateY(-2px)`
- active 位移：`translateY(0)` 或 `translateY(1px)`
- 过渡时长：`160ms`（交互状态）
- 动画时长：`200ms` ~ `280ms`（入场动画，适中强度）
- 缓动：`cubic-bezier(0.22, 1, 0.36, 1)` 或 `ease`
- 焦点环：`0 0 0 2px rgba(49, 109, 114, 0.35)` 或 `0 0 0 3px`
- 禁用态：`opacity: 0.5` + `filter: saturate(0.5)`
- 拖拽态：`opacity: 0.6` + 阴影抬升 + 轻微位移

### 需要修改的文件
- `src/app/app.css` — 主要修改目标（预计新增 ~300 行 CSS）

### 测试策略
- 纯 CSS 变更，无需新增单元测试
- 现有 React 组件测试应不受影响
- 建议手动验证：Tab 导航、鼠标悬停/点击、拖拽、弹窗动画

## Workflow Decisions
- Accuracy Status: 已准确 — 目标清晰，范围已扩展为全量 P0-P2，验收可测试
- Complexity: L1 — 全量执行约 46 项改进，预计新增 ~300 行 CSS，但单文件可闭环
- Need More Divergence: 否 — 审计已完成，57 个改进点已分类，用户已确认范围
- Need Sub Tasks: 否 — 单个上下文可闭环（只改 app.css），按 P0 → P1 → P2 顺序执行
- Next Step: 进入 /trellis:start 直接实现，按 P0 → P1 → P2 分阶段修改 app.css
- 项目级双需求文档: 已更新 — customer-facing 和 developer-facing PRD 已同步全量范围
- 用户确认: 范围 A（全量 P0-P2）+ 拖拽 A（幽灵效果）+ 动画 B（适中 200-280ms）
