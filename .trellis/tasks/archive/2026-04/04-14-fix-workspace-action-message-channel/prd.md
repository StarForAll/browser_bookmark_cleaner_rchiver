# 修复 workspace action 消息通道关闭报错

## Goal

修复扩展 workspace 页面启动时的 runtime messaging 报错，消除 `A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received.`，同时保持 workspace action target 注册能力不回退。

## Root Cause

- `src/features/workspace-entry/application/actionWorkspaceServiceWorker.ts` 中的 `chrome.runtime.onMessage` 监听器返回了 `true`
- 该返回值表示监听器会异步调用 `sendResponse`
- 当前实现并未调用 `sendResponse`，导致浏览器在消息通道关闭时抛出错误
- 项目规范同时声明这条注册消息是 fire-and-forget，发送方不依赖响应载荷

## Requirements

- 保持 `workspace-action-target/register` 消息仍能把当前 tab/window 写入 `chrome.storage.session`
- 修复监听器与 Chrome messaging 契约不一致的问题
- 不新增 `tabs` 权限，不改变 manifest 入口设计
- 只修改 workspace action 消息链路相关实现和测试

## Acceptance Criteria

- [ ] `installWorkspaceActionServiceWorker()` 安装的消息监听器不再通过“返回 true 但不响应”制造通道关闭错误
- [ ] `handleWorkspaceActionMessage()` 仍能在合法注册消息下写入 session storage
- [ ] 补充自动化测试覆盖监听器安装后的返回行为与异步注册处理
- [ ] `pnpm test`
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm build`

## Technical Notes

- 优先遵循 Chrome `runtime.onMessage` 官方契约，而不是继续依赖发送端吞错
- 变更应保持在 `src/features/workspace-entry/application/` 范围内
