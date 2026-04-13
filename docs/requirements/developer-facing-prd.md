# 开发向需求文档：界面交互与视觉全面优化

## 概述

为 `src/app/app.css` 全面补充交互状态和视觉细节，覆盖审计发现的 57 个改进点中的 **P0-P2 全量项（约 46 项）**，预计新增 ~300 行 CSS。

### 用户确认
- 范围：全量执行 P0-P2（选项 A）
- 拖拽节点样式：半透明"幽灵"效果（选项 A）
- 动画强度：适中 — slide-up + fade，200-280ms（选项 B）

## 技术实现

### 修改文件
- `src/app/app.css` — 唯一需要修改的文件

### P0：核心交互反馈（必须完成）

#### 1. 顶部动作区按钮
```css
/* 选择器: .action-grid button, .secondary-actions button, .search-placeholder button */
/* 需添加: transition, :hover, :active, :focus-visible */
```

#### 2. 对话框按钮（含所有变体）
```css
/* 选择器: .draft-dialog-button, .draft-dialog-button.is-primary, .draft-dialog-button.is-primary.is-danger */
/* 需添加: transition, :hover, :active, :focus-visible, :disabled */
```

#### 3. 搜索输入框
```css
/* 选择器: .search-placeholder input */
/* 需添加: transition, :hover, :focus-visible, :disabled, ::placeholder */
```

#### 4. 表单输入框
```css
/* 选择器: .draft-field input */
/* 需添加: transition, :hover, :focus-visible, :disabled, ::placeholder */
```

#### 5. 拖拽中节点（JS 已添加类，CSS 缺失）
```css
/* 选择器: .draft-node-button.is-dragging */
/* 需添加: opacity 降低, 虚线边框或旋转效果, 阴影变化 */
```

#### 6. 拖拽放置区
```css
/* 选择器: .draft-node-drop-zone.is-active */
/* 需添加: 背景高亮或虚线边框 */
```

### P1：重要视觉增强

#### 7. 补全 active 态（已有 hover/focus 的元素）
- `.draft-node-button:active` — 图谱节点按下态
- `.page-back-to-top-button:active` — 回到顶部按下态
- `.local-recovery-choice:active` — 恢复选择按下态
- `.status-close:active` — 状态关闭按下态
- `.status-anchor:active` — 状态锚点按下态
- `.draft-layout-popover-close:active` — 布局关闭按下态

#### 8. 弹窗入场动画
```css
/* .draft-dialog-backdrop — fade-in */
/* .draft-dialog-card — slide-up + fade-in (translateY(12px) scale(0.98) → 0 1) */
```

#### 9. 悬浮层展开按钮
```css
/* 选择器: .draft-hover-expand-button */
/* 需添加: transition, :hover, :active, :focus-visible */
```

#### 10. 节点图标和 URL 预览 hover 增强
```css
/* .draft-node-button:hover .draft-node-icon — opacity: 1, filter: none */
/* .draft-node-button:hover .draft-node-url-preview — opacity: 1 */
```

### P2：精致细节

#### 11. 滚动条统一
```css
/* 需添加自定义滚动条的元素: */
/* .draft-dialog-card::-webkit-scrollbar */
/* .draft-hover-duplicates-list::-webkit-scrollbar */
/* .draft-layout-popover::-webkit-scrollbar */
/* .draft-graph-tree — 添加 Firefox scrollbar-width/scrollbar-color */
```

#### 12. 入场动画
```css
/* .status-popover — slide-in + fade */
/* .hint-overlay — fade-in */
/* .canvas-draft-card — fade-in + scale-up */
/* .draft-empty-state — emoji @keyframes float + 文字 fade-in */
/* .draft-search-empty-state — fade-in */
/* .page-back-to-top-button — fade-in + slide-up */
```

#### 13. 列表项 hover 高亮
- `.status-history-list li:hover`
- `.startup-preview li:hover`
- `.draft-hover-duplicates-path:hover`
- `.duplicate-focus-card:hover`
- `.duplicate-focus-group-item:hover`

#### 14. 错误/警告横幅样式
- `.draft-form-error` — 添加左边框 accent + 背景色
- `.draft-dialog-warning` — 添加警告背景
- `.overwrite-confirmation-caution` — 区别于 warning 的 caution 样式

#### 15. 禁用按钮统一样式
```css
button:disabled {
  opacity: 0.5;
  filter: saturate(0.5);
  cursor: not-allowed;
}
```

#### 16. 其他细节
- `.action-note` — 添加 transform 滑入效果
- `.webdav-settings-result` — 按测试状态着色
- `.status-close` — 添加 hover 圆形背景（与 `.draft-layout-popover-close` 一致）

### 设计约束

复用现有设计系统的交互参数：
- **hover 效果**：`translateY(-1px)` ~ `translateY(-2px)`，阴影加深，边框色加深
- **active 效果**：`translateY(0)` 或 `translateY(1px)`，阴影减小
- **focus-visible 效果**：`box-shadow: 0 0 0 2px rgba(49, 109, 114, 0.35)` 或 `0 0 0 3px`
- **过渡参数**：`transition: all 160ms cubic-bezier(0.22, 1, 0.36, 1)` 或 `ease`
- **动画参数**：200-280ms（适中强度），`cubic-bezier(0.22, 1, 0.36, 1)`
- **禁用态**：`opacity: 0.5` + `filter: saturate(0.5)`
- **拖拽态**：`opacity: 0.6` + `border-style: dashed`

### 实现顺序建议

1. 先做 P0（核心交互反馈）— 约 120 行 CSS
2. 再做 P1（重要视觉增强）— 约 60 行 CSS
3. 最后做 P2（精致细节）— 约 120 行 CSS

每完成一个优先级后运行 `pnpm test` 确认无回归。

## 验收标准

- [ ] 所有 P0 项完成（6 个核心交互反馈）
- [ ] 所有 P1 项完成（active 补全 + 弹窗动画 + 展开按钮 + 节点 hover 增强）
- [ ] 所有 P2 项完成（滚动条 + 入场动画 + 列表 hover + 错误横幅 + 禁用态 + 其他细节）
- [ ] `pnpm test` 全部通过
- [ ] `pnpm lint` 无错误
- [ ] `pnpm typecheck` 无错误
- [ ] 手动验证：Tab 导航可见焦点环，鼠标悬停/点击有反馈，弹窗有动画，拖拽有区分

## 测试策略

- 纯 CSS 变更，无需新增单元测试
- 现有 React 组件测试应不受影响
- 建议手动验证以下场景：
  - Tab 键遍历所有可交互元素
  - 鼠标悬停/点击动作区按钮、对话框按钮
  - 拖拽节点时的视觉区分
  - 弹窗打开/关闭动画
  - 空态页面呈现
  - 滚动条样式一致性

## 风险

- 极低风险：仅 CSS 变更，不影响功能逻辑
- 回归风险：需确认 `.draft-node-button` 的现有 hover 效果未被覆盖
- 浏览器兼容：`::-webkit-scrollbar` 仅 Chrome/Safari，Firefox 需 `scrollbar-width`/`scrollbar-color`
