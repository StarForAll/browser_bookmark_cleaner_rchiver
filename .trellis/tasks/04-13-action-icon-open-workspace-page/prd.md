# 扩展图标点击打开工作区页面并保留原入口

## Goal

让用户点击浏览器工具栏中的扩展图标时，直接打开当前工作区页面，同时保留现有 `options_ui` 入口，不影响用户从扩展内部 / 扩展管理页进入同一页面。

## What I Already Know

- 当前 `manifest` 已声明：
  - `action.default_title = "打开书签清理与归档工作区"`
  - `options_ui.page = "index.html"`
  - `options_ui.open_in_tab = true`
  - 文件：`public/manifest.json`
- 当前仓库没有：
  - `background.service_worker`
  - `chrome.action.onClicked`
  - `chrome.tabs.create`
  - `chrome.runtime.openOptionsPage`
- 当前设计冻结点：
  - 正式运行面是独立扩展页面
  - `options_ui` 已是现有入口的一部分
  - background/service worker 可以作为后续内部基础设施加入，但不是当前主运行面
- Chrome 官方文档确认：
  - `chrome.action.onClicked` 只会在没有 popup 时触发
  - 保留 `options_ui` 不会阻止新增 `action.onClicked`
  - `chrome.tabs.create({ url: 'index.html' })` 是官方示例支持路径
  - 多数 `tabs` API 不需要额外权限，但若要用 `tabs.query()` 读取现有 tab 的 `url` 来查找是否已打开工作区，则需要 `tabs` 权限

## Assumptions (Temporary)

- 用户要保留的“原本入口”指的是：
  - 继续保留 `options_ui`
  - 不改变当前工作区页面本身
  - 不新增 popup 作为正式运行面
- 点击扩展图标后的目标页面仍是当前 `index.html` 承载的同一工作区，而不是新页面或 popup。

## Open Questions

- 当前无剩余阻塞问题；实现路径已冻结。

## Requirements (Evolving)

- 点击扩展图标后可进入当前工作区页面
- 当工作区页面已打开时，点击扩展图标应优先切换到该页面；只有未打开时才新开页面
- 现有 `options_ui` 入口必须继续保留
- 不把 popup 引入为主运行面
- 方案应明确是否需要新增 `background.service_worker`
- 若方案需要新增 `tabs` 权限，必须说明原因和用户感知变化

## Acceptance Criteria (Evolving)

- [ ] 已明确图标点击时的目标行为
- [ ] 已明确是否复用已打开的工作区 tab
- [ ] 已明确是否需要新增 `tabs` 权限或更轻量的替代机制
- [ ] 已明确后续 `test-first` 需要覆盖的 manifest / 入口 / 运行时场景

## Out Of Scope

- 不改当前工作区页面的业务功能
- 不新增 popup UI
- 不移除或替代 `options_ui`

## Technical Notes

- 最直接实现是：新增 `background.service_worker`，在 `chrome.action.onClicked` 中执行 `chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })`
- 若要“已打开时优先聚焦现有工作区”，有两个方向：
  - 直接用 `tabs.query()` 查找 extension page tab：实现简单，但需要 `tabs` 权限
  - 由工作区页面向 service worker 自注册 tabId / windowId：权限更轻，但实现和测试更复杂
- 用户已确认选择“已打开时优先聚焦现有工作区 tab，没有时再新开”
- 最终冻结方案：
  - 不新增 `tabs` 权限
  - 新增 `background.service_worker`
  - 工作区页面在 tab 上下文中通过 `chrome.tabs.getCurrent()` 自注册当前 `tabId/windowId`
  - `chrome.action.onClicked` 先尝试聚焦已注册工作区页；若记录缺失或已失效，则新开 `index.html`
  - 继续保留现有 `options_ui` 入口

## Workflow Decisions

- Accuracy Status: 已准确
- Complexity: L1
- Need More Divergence: 否
- Need Sub Tasks: 否
- Next Step: 已完成 `test-first -> implement -> verify`，可进入后续质量检查或人工 Chrome 验证
