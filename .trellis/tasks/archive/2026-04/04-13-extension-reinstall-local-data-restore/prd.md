# 扩展卸载后本地数据保留与重装恢复

## Goal

在当前 Chrome 扩展存储边界下，为“卸载后数据丢失”补充明确页面说明与 WebDAV 预先上传 / 重装后恢复指引，作为自动恢复 companion 方案之前的降级闭环。

## What I Already Know

- 当前工作区启动链路会优先读取本地持久化草稿会话，再决定是否读取浏览器书签：
  - `src/features/browser-sync/application/bootstrapWorkspace.ts`
- 当前草稿会话物理上保存在 `chrome.storage.local`：
  - `src/adapters/local-persistence/readPersistedDraftSession.ts`
  - `src/adapters/local-persistence/writePersistedDraftSession.ts`
  - `src/adapters/local-persistence/contracts.ts`
- 当前本地持久化内容至少包括：
  - `draftSnapshot`
  - `expandedStateById`
  - `nodePositionsById`
  - `undoHistory`
  - `checkpoints`
- 当前 WebDAV 配置、权限状态、本地覆盖备份元数据也都保存在扩展本地持久化域中。
- 项目文档已明确：v1 当前实际物理存储介质是 `chrome.storage.local`；若未来有容量/性能压力，大对象可迁往 `IndexedDB`，但这只是容量方向，不是卸载保留方案。
- Chrome 官方 `chrome.storage` 文档明确说明：
  - `storage.local` 数据在扩展被移除时会被清除。
  - `storage.sync` 配额约 100 KB，且未开启同步时行为退化为 `storage.local`。
- Chrome 官方文档还表明：
  - 可设置的卸载相关官方能力是 `runtime.setUninstallURL()`，用于卸载后打开网页。
  - `runtime.onSuspend` 中启动的异步操作不保证完成。
- 结论：不能把“卸载前自动上传到 WebDAV”作为可靠产品承诺。
- 结论：当前实现和当前默认存储介质都无法单独满足“卸载后仍直接恢复完整本地数据”的目标。

## Assumptions (Temporary)

- 用户要求中的“本地数据”至少不只是浏览器书签本身，还可能包括未同步草稿、布局、撤销历史、WebDAV 配置、恢复备份等扩展专属状态。
- 若要求“卸载后重装零操作直接恢复”，则需要扩展沙箱之外的持久化载体；仅靠扩展自身存储域不可达成。
- 浏览器书签本身属于浏览器数据，不随扩展卸载而消失，因此“从浏览器重新导入”只能恢复浏览器现状，不能恢复未同步草稿与扩展工作区状态。
- `IndexedDB` 只可能改善容量/性能，不解决卸载后保留问题，因为它仍属于扩展作用域存储。
- 用户已确认：接受新增扩展外持久化机制，不再把方案限制在扩展内部存储结构中。

## Open Questions

- 当前降级方案无剩余阻塞问题。
- 若未来要重启“卸载后自动恢复”的高保证方案，应单独新建任务收敛：
  - companion 的安装与交付形式
  - WebDAV 凭据的扩展外保存策略
  - 重装后的自动探测 / 恢复触发方式

## Requirements (Evolving)

- 先收敛方案，再建立测试门禁，不提前实现。
- 方案必须基于当前代码与 Chrome 扩展存储边界，不假设不存在的平台能力。
- 若方案需要放宽“直接恢复”的语义，必须明确用户需要承担的最小额外动作。
- 若方案引入新的持久化载体，必须明确：
  - 保存什么
  - 何时写入
  - 重装后如何发现并恢复
  - 失败时如何提示
- 方案 3 已选定为目标方向：高保证恢复，允许新增扩展外持久化机制。
- 在当前 Chrome 扩展平台下，默认主线应收敛为“Native Messaging + 本机 companion 持久化层”，而不是继续尝试调整 `chrome.storage.*`、`IndexedDB`、`Cache Storage` 或其他扩展内存储。
- 若用户不接受 companion 安装成本，则本轮可接受降级方案为：
  - 不承诺卸载后保留扩展本地数据
  - 在页面内明确提示卸载会清除本地数据
  - 指引用户在卸载前先把当前草稿或当前浏览器书签上传到 WebDAV
  - 重装后重新配置 WebDAV，再执行恢复
- 当前任务冻结为上述降级方案，不在本轮实现 Native Messaging companion。

## Acceptance Criteria (Evolving)

- [ ] 已明确“恢复什么数据”和“恢复过程允许多少用户动作”
- [ ] 已在当前仓库约束下选定一个可实现方案
- [ ] 已定义后续 `test-first` 门禁所需的可验证场景
- [ ] 已为实现阶段识别出受影响模块与边界

## Out of Scope

- 不在需求未冻结前直接改实现
- 不把“容量优化”误当成“卸载后持久化”方案
- 不默认引入自建后端、原生宿主程序或企业托管能力，除非讨论后明确选中

## Technical Notes

- 当前最接近恢复入口的是 `bootstrapWorkspace()`；任何重装恢复方案都大概率需要影响“无本地草稿时的启动决策”。
- 当前 WebDAV 能力已具备上传、版本保留和恢复流，可作为潜在的跨卸载恢复载体，但它不是当前启动链路的默认恢复源。
- 若未来考虑 `storage.sync`，只能作为极小型配置或恢复指针候选，不适合承载完整草稿会话。
- Chrome 官方文档已确认：
  - `storage.local` 在扩展移除时会被清除。
  - `storage.sync` 仅约 100 KB，且用户关闭同步时行为退化为 `storage.local`。
  - `IndexedDB`、`Local Storage`、`Cache Storage` 等 web storage 仍属于 extension origin 范围，不构成扩展外持久化。
- 因此，若要实现高保证自动恢复，必须引入扩展外组件；当前最直接的官方支持链路是 `nativeMessaging`。

## Workflow Decisions

- Accuracy Status: 已准确
- Complexity: L1
- Need More Divergence: 否
- Need Sub Tasks: 否
- Next Step: 当前降级方案的文案与测试已完成，可归档；若未来重启 companion 自动恢复方案，需单独立项
