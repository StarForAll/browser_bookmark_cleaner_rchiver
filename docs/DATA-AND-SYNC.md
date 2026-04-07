# 数据与同步文档

## 1. 目标

本文档描述系统中的数据真相、持久化资产、浏览器写回、WebDAV 版本化、恢复与回滚规则。

说明：本文件当前主要是冻结的数据与同步目标契约。除非另有明确说明，以下对象模型、持久化结构和同步规则都还没有在仓库代码中完整实现。

## 2. 当前实现状态

- 当前仓库已经定义真实的 `DraftGraphNode`、`DraftGraphSnapshot`、`DraftUndoEntry`、`DraftCheckpoint` 与 `PersistedDraftSession` 运行时契约
- 当前仓库已经实现浏览器书签读取、校验、导入草稿，以及启动阶段的“本地草稿优先恢复 -> 浏览器导入 -> 首次导入本地持久化”链路
- 当前仓库已经实现 `chrome.storage.local` 的草稿会话读写适配器
- 当前仓库尚未实现浏览器写回、WebDAV 上传 / 恢复、真实 undo 执行、搜索 / 重复聚焦，以及本地备份生成 / 撤销覆盖流

## 3. 数据真相

### 3.1 草稿真相

- 当前草稿是工作区唯一可编辑真相
- 浏览器书签不是当前编辑真相
- 树视图、图视图、搜索结果、重复结果都从同一份规范化图谱派生

### 3.2 浏览器书签边界

- 浏览器书签只作为按需读取的快照来源和显式写回目标
- 页面启动不会自动持续监听浏览器书签变动
- 用户可通过“从浏览器覆盖当前草稿”显式重建当前草稿

## 4. 当前领域对象与契约

### 4.1 DraftGraphNode

核心字段：

- `internalId`
- `sourceType`
- `nodeType`
- `title`
- `url`
- `parentId`
- `childIds`
- `pathTokens`

规则：

- 目录节点 `url = null`
- 网页节点 `url` 必填
- `sourceType` 当前取值为 `browser` 或 `draft`
- `internalId` 是内部实现细节，不在 UI 展示

### 4.2 Browser Structural Roots

- Chrome `getTree()` 返回的根节点 `id = '0'` 与浏览器结构容器节点会先通过读取适配器校验
- 导入草稿时会跳过 `id = '0'` 以及其下的浏览器结构容器，只把真实受管节点转成草稿图谱
- 这些结构容器不进入可编辑的草稿真相，也不进入本地持久化快照

### 4.3 DraftGraphSnapshot

- `nodesById`
- `rootIds`
- `selectedNodeId`
- `schemaVersion`
- `snapshotVersion`

说明：

- `searchQuery` 与 `duplicateFilterEnabled` 仍属于冻结目标，不在当前已落地的草稿快照结构中
- 当前节点选择是会话态的一部分，但仅选择节点不会触发持久化写入

### 4.4 Undo / Checkpoint Contracts

- `DraftUndoEntry`
  - `timestamp`
  - `mutationType`
  - `affectedNodeIds`
  - `beforeStatePayload`
  - `afterStatePayload`
  - `storageMode = 'patch'`
- `DraftCheckpoint`
  - `createdAt`
  - `snapshotVersion`
  - `storageKey`
  - `sizeBytes`

说明：

- 当前语义化 mutation type 已冻结为：
  - `create-node`
  - `move-node`
  - `rename-node`
  - `delete-subtree`
  - `edit-bookmark-url`
- 这些 contract 已存在并受校验保护，但当前运行时尚未接入 `Ctrl+Z` 执行链路

## 5. 当前本地持久化实现

### 5.1 逻辑分域

本地持久化逻辑上分为三类，且对应 key 已冻结：

- 普通工作区状态
- 敏感配置
- 持久化资产

### 5.2 冻结目标物理存储

- v1 当前物理存储使用 `chrome.storage.local`
- 后续若出现容量/性能证据，大对象资产可迁往 `IndexedDB`

### 5.3 目标持久化内容

- 当前草稿快照
- 撤销 patch 历史
- 周期性 checkpoint
- 展开 / 折叠状态
- 节点布局坐标
- WebDAV 配置与授权状态
- 本地最新备份元数据

当前已落地行为：

- `readPersistedDraftSession()` 从 `chrome.storage.local` 读取：
  - `draft-snapshot`
  - `expanded-state-by-id`
  - `node-positions-by-id`
  - `draft-undo-history`
  - `draft-checkpoints`
- `writePersistedDraftSession()` 会把当前会话写回上述 key
- 当前 `DraftGraphWorkspace` 在每次成功的草稿变更后会持久化整份 `PersistedDraftSession`
- 由于展开态、坐标、undo 执行链路、checkpoint 生成尚未接入，当前运行时写入的是：
  - `expandedStateById = {}`
  - `nodePositionsById = {}`
  - `undoHistory = []`
  - `checkpoints = []`

当前仅冻结 contract、尚未接入执行流的保留位：

- `webdav-profile`
- `webdav-permission-state`
- `latest-draft-backup`
- `latest-browser-backup`

## 6. 草稿撤销模型

说明：当前代码已经冻结了 undo patch contract，但尚未把 `Ctrl+Z` 接入运行时执行流。

### 6.1 基本规则

- 当前草稿持久化为完整快照
- 撤销历史使用 patch 记录
- 系统允许周期性 checkpoint

### 6.2 Undo 范围

纳入撤销：

- 创建节点
- 重命名节点
- 编辑 URL
- 移动节点
- 删除节点或子树

不纳入撤销：

- 展开/折叠
- 节点坐标
- 视口移动
- 搜索词
- 重复过滤开关
- 浏览器写回
- WebDAV 上传
- WebDAV 恢复

### 6.3 Patch 语义

patch 应采用语义化动作表达，例如：

- `create-node`
- `move-node`
- `rename-node`
- `delete-subtree`
- `edit-bookmark-url`

当前状态：

- 这些 patch 语义已经在 contract 中冻结并受校验保护
- 当前图谱编辑、删除、拖拽等运行时变更还不会真正生成可回放的 undo patch

## 7. 当前启动恢复 / 导入链路

- 启动时先尝试恢复本地草稿会话
- 若本地草稿可恢复，则本次启动不再读取浏览器书签
- 若本地草稿为空，则显式读取浏览器书签树
- 浏览器叶子书签必须带非空 `url`；不合法数据会在适配器边界报错
- 首次导入成功后，会立即把导入得到的 `DraftGraphSnapshot` 持久化到本地
- 若导入成功但本地持久化失败，当前草稿仍可进入编辑，但状态区会提示“已导入但未保存”

## 8. 覆盖、备份与恢复目标

### 8.1 覆盖前备份

以下动作在执行前必须先生成对应对象的本地最新备份：

- 从浏览器覆盖当前草稿
- 同步当前草稿到浏览器书签
- 从 WebDAV 草稿版本恢复到当前草稿
- 从 WebDAV 书签版本恢复到浏览器书签

### 8.2 备份保留

- 草稿最新备份：只保留 1 份
- 浏览器最新备份：只保留 1 份
- 新备份写成功后，才替换旧备份

### 8.3 撤销覆盖入口

- 统一入口：撤销覆盖操作
- 二次选择目标：
  - 撤销对当前草稿的覆盖
  - 撤销对浏览器书签的覆盖

## 9. 浏览器写回目标

说明：本节是冻结写回规则；当前仓库还没有浏览器写回实现。

### 9.1 触发条件

- 只能由用户显式触发
- 必须先经过确认框
- 必须先完成浏览器侧本地备份

### 9.2 写回策略

- 首版采用受管范围内的全量重建写回
- 成功语义：受管范围内浏览器书签与当前草稿一致
- 不做增量 merge

### 9.3 失败策略

- 失败优先保护当前草稿
- 浏览器侧尝试 `best-effort rollback`
- 失败结果要区分：
  - 写回失败但自动回滚成功
  - 写回失败且自动回滚失败

## 10. WebDAV 版本化目标

说明：本节是冻结 WebDAV 版本契约；当前仓库还没有对应网络、索引和版本管理实现。

### 10.1 分类型存储

- 浏览器书签快照
- 草稿快照

二者分开存储、分开保留、分开恢复。

### 10.2 目录结构

```text
/bookmarks/index.json
/bookmarks/latest.json
/bookmarks/versions/<timestamp>.json
/drafts/index.json
/drafts/latest.json
/drafts/versions/<timestamp>.json
```

### 10.3 版本规则

- 每类最多保留最近 5 个版本
- `index.json` 是恢复列表、排序、元数据显示的权威索引
- `latest.json` 保存最新完整快照副本
- 版本文件保存完整快照，而不是 delta

### 10.4 上传顺序

1. 写入新的版本文件
2. 更新对应 `index.json`
3. 更新对应 `latest.json`
4. 清理超出的旧版本并同步清理索引

## 11. WebDAV 恢复目标

说明：本节是冻结恢复规则；当前仓库还没有恢复流程实现。

### 11.1 恢复入口

- 下载 WebDAV 草稿版本到当前草稿
- 下载 WebDAV 书签版本并覆盖浏览器书签

### 11.2 恢复前置条件

- WebDAV 已配置
- URL 合法
- host 权限已授予
- 最近一次连通性测试成功
- 远端版本列表加载成功
- 类型与恢复目标匹配
- 本地预恢复备份生成成功

### 11.3 类型边界

- 草稿版本只能恢复到当前草稿
- 浏览器书签版本只能恢复到浏览器书签
- 不允许跨类型恢复

## 12. 敏感配置与错误目标

### 12.1 敏感配置

WebDAV 配置属于敏感配置域，包括：

- endpoint
- username
- password
- 授权状态

规则：

- 不和普通草稿/布局状态混同
- 不进入用户可见状态文案
- 不进入技术详情中的敏感值输出

### 12.2 错误模型

- 适配器先归一错误
- UI 层显示“可读错误 + 可展开技术详情”
- 不直接把原始 Chrome/WebDAV/存储错误对象裸露到界面
