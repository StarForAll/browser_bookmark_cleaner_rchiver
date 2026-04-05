# 技术架构文档

## 1. 目标

本文档面向开发人员，描述首版浏览器书签清理与归档器的系统边界、运行面、分层结构、关键技术选型和实现约束。

## 2. 系统边界

- 产品形态：Chrome MV3 扩展
- 正式运行面：独立扩展页面
- 非正式运行面：如后续存在 background/service worker，只作为内部基础设施，不作为首版正式架构层
- 云端能力：用户自带 WebDAV
- 当前不包含：独立后端服务、数据库、账号系统、后台自动任务框架

## 3. 核心架构原则

- 草稿优先编辑：当前可编辑真相始终是草稿，而不是浏览器实时书签
- 单一运行面：首版只围绕扩展页面组织主链
- 单一中心化状态层：当前页面使用一个中心化状态核心承载会话状态
- 单一编辑真相：规范化图谱是唯一可编辑内容真相
- 显式副作用：浏览器写回、WebDAV 上传、恢复、撤销覆盖都必须经显式动作触发
- 串行外部动作：任一时刻只允许一个外部副作用动作运行
- 失败优先保草稿：外部动作失败时，优先保护当前草稿，浏览器侧回滚采用 `best-effort rollback`

## 4. 分层结构

### 4.1 Extension Page

- 承载 React + TypeScript 应用
- 负责展示、交互、页面级状态入口
- 不直接调用 `chrome.*`、原始 `fetch` 或原始本地存储接口

### 4.2 Application / Use Case Layer

- 编排显式用户动作
- 统一执行业务校验、前置检查、执行保护
- 调用状态层与适配器层

### 4.3 Centralized State Layer

- 保存当前草稿、搜索、重复聚焦、状态区、对话框、当前执行态等运行时状态
- 不直接承担原始浏览器 API 或原始 WebDAV 协议处理

### 4.4 Adapter Layer

- Chrome bookmarks adapter
- WebDAV adapter
- Local persistence adapter

适配器职责：

- 屏蔽原始外部协议细节
- 返回结构化领域结果
- 将外部错误归一为领域错误模型

### 4.5 Composition Root

- 在扩展页面入口统一完成依赖装配
- 不允许业务模块分散直连具体底层实现

## 5. 核心技术选型

- UI runtime：React + TypeScript
- Build tool：Vite
- Package manager：`pnpm`
- Graph library：`@xyflow/react`
- WebDAV integration：原生 `fetch`
- Local persistence：v1 物理上使用 `chrome.storage.local`

## 6. 浏览器与扩展能力边界

- 必需权限：`bookmarks`、`storage`
- WebDAV host access：运行时按需申请
- 浏览器能力边界按浏览器无关 contract 设计，Chrome 是首个实现
- 未来 Firefox 支持应在适配器层补实现，而不是重写应用层契约

## 7. 页面与模块组织

建议目录方向：

```text
src/
  app/
  features/
  domain/
  adapters/
  shared/
  test/
```

组织原则：

- 按能力/领域优先组织
- 技术层作为模块内子分层
- 不采用纯 `components/stores/adapters` 顶层平铺的大杂烩结构

## 8. 图渲染与布局边界

- `@xyflow/react` 只作为渲染适配层
- 规范化图谱是业务真相，渲染节点边是派生结果
- 自动归位使用受控树布局
- 布局器位于可替换接口之后，不让渲染库反向主导布局真相

## 9. 浏览器写回边界

- “同步当前草稿到浏览器书签”是显式确认后的覆盖式写回
- 首版采用受管范围内的全量重建写回
- 成功语义：受管范围内浏览器书签与当前草稿一致
- 不做后台自动同步

## 10. 存储边界

- `chrome.storage.local`：v1 当前物理存储介质
- 逻辑上分为：
  - 普通工作区状态
  - 敏感配置
  - 持久化资产
- 若后续出现容量或性能证据，大对象持久化资产可迁往 `IndexedDB`

## 11. 当前实现状态

- 需求、架构、交互与数据同步边界已冻结
- `T01` 已建立工程 scaffold、目录结构、构建脚本和基础验证矩阵
- `T03` 已建立 MV3 manifest、独立扩展页面入口和 React 应用壳
- 当前仍未落地草稿图谱、浏览器同步、WebDAV 和恢复链路
