# 数据与同步文档

## 1. 目标

本文档描述项目的数据真相、持久化结构、浏览器覆盖 / 写回、WebDAV 版本化、恢复与回滚规则。

## 2. 当前实现快照

- 已定义并校验 `DraftGraphNode`、`DraftGraphSnapshot`、`DraftUndoEntry`、`DraftCheckpoint`、`PersistedDraftSession`。
- 已实现浏览器书签读取、校验、导入草稿、草稿导出浏览器树和受管范围写回。
- 已实现 `chrome.storage.local` 草稿会话读写、undo history、WebDAV 配置、WebDAV 权限状态、本地备份读写。
- 已实现启动阶段本地草稿恢复、首次浏览器导入、本地持久化失败提示。
- 已实现本地备份、撤销覆盖、WebDAV 上传 / 版本保留 / 恢复，以及浏览器写回失败后的 best-effort rollback。
- 仍需发布前在真实 Chrome 书签数据与真实 WebDAV provider 上完成手工验收。

## 3. 数据真相

### 3.1 草稿真相

- 当前草稿是工作区唯一可编辑真相。
- 浏览器书签不是实时编辑真相，只是读取来源和显式写回目标。
- 树视图、图谱视图、搜索结果和重复 URL 分组都从同一份 `DraftGraphSnapshot` 派生。

### 3.2 浏览器书签边界

- 页面启动不会持续监听浏览器书签变化。
- 用户通过“从浏览器覆盖当前草稿”显式重建草稿。
- 用户通过“同步当前草稿到浏览器书签”显式写回浏览器。
- 写回采用受管范围内的覆盖式同步，不做后台自动 merge。

### 3.3 WebDAV 边界

- WebDAV 保存两类快照：浏览器书签快照、草稿快照。
- 两类快照分开存储、分开索引、分开恢复。
- 草稿版本不能恢复到浏览器书签；浏览器书签版本不能恢复到草稿。

## 4. 草稿图谱契约

### 4.1 `DraftGraphNode`

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

- 目录节点 `url = null`。
- 书签节点 `url` 必填。
- `sourceType` 当前取值为 `browser` 或 `draft`。
- `internalId` 是内部实现细节，不在 UI 中展示。

### 4.2 Browser Structural Roots

- Chrome `getTree()` 返回的根节点 `id = '0'` 以及其下结构容器只在适配器边界处理。
- 导入草稿时跳过浏览器结构根，只把真实受管节点转换为草稿节点。
- 结构容器不进入可编辑草稿真相，也不进入本地草稿快照。

### 4.3 `DraftGraphSnapshot`

核心字段：

- `nodesById`
- `rootIds`
- `selectedNodeId`
- `schemaVersion`
- `snapshotVersion`

说明：

- 搜索词、重复过滤、视口位置属于界面辅助状态，不进入草稿内容真相。
- 仅选择节点不触发草稿内容持久化。

## 5. 本地持久化

### 5.1 存储介质

- v1 使用 `chrome.storage.local`。
- 后续只有在出现容量或性能证据时，才考虑把大对象资产迁移到 `IndexedDB`。

### 5.2 Key 分域

工作区状态：

- `draft-snapshot`
- `expanded-state-by-id`
- `node-positions-by-id`

敏感配置：

- `webdav-profile`
- `webdav-permission-state`

持久化资产：

- `draft-undo-history`
- `draft-checkpoints`
- `latest-draft-backup`
- `latest-browser-backup`

### 5.3 草稿会话

`PersistedDraftSession` 包含：

- 草稿快照。
- 展开 / 折叠状态。
- 节点布局坐标。
- undo history。
- checkpoints。

当前图谱编辑、删除、拖拽、键盘重排等草稿变更都会生成 undo entry，并随草稿会话持久化。

## 6. 草稿撤销模型

纳入 `Ctrl+Z`：

- 创建节点。
- 重命名节点。
- 编辑书签 URL。
- 移动节点。
- 删除节点或子树。

不纳入 `Ctrl+Z`：

- 展开 / 折叠。
- 节点坐标。
- 视口移动。
- 搜索词。
- 重复过滤开关。
- 浏览器覆盖或写回。
- WebDAV 上传或恢复。
- 撤销覆盖操作。

当前语义化 mutation type：

- `create-node`
- `move-node`
- `rename-node`
- `delete-subtree`
- `edit-bookmark-url`

## 7. 覆盖、备份与恢复

### 7.1 覆盖前备份

以下动作执行前必须先生成本地备份：

- 从浏览器覆盖当前草稿：备份当前草稿到 `latest-draft-backup`。
- 同步当前草稿到浏览器书签：备份当前浏览器书签到 `latest-browser-backup`。
- 从 WebDAV 草稿版本恢复到当前草稿：备份当前草稿到 `latest-draft-backup`。
- 从 WebDAV 书签版本恢复到浏览器书签：备份当前浏览器书签到 `latest-browser-backup`。

### 7.2 备份保留

- 草稿备份只保留最新 1 份。
- 浏览器书签备份只保留最新 1 份。
- 新备份写入成功后才允许继续覆盖目标对象。

### 7.3 撤销覆盖

- 统一入口：撤销覆盖操作。
- 如果草稿备份可用，可以撤销对当前草稿的覆盖。
- 如果浏览器书签备份可用，可以撤销对浏览器书签的覆盖。
- 浏览器书签恢复失败时沿用写回回滚策略。

## 8. 浏览器写回

### 8.1 触发条件

- 只能由用户显式触发。
- 必须先经过确认框。
- 必须先读取并备份当前浏览器书签。

### 8.2 写回策略

- 草稿图谱先导出为浏览器书签树。
- 采用受管范围内的覆盖式同步。
- 成功语义：受管范围内浏览器书签与当前草稿一致。
- 不做后台自动同步，不做增量 merge。

### 8.3 失败策略

- 写回失败时优先保护当前草稿。
- 浏览器侧尝试 best-effort rollback。
- 状态结果必须区分：
  - 写回失败。
  - 写回失败但自动回滚成功。
  - 写回失败且自动回滚失败。

## 9. WebDAV 版本化

### 9.1 目录结构

当前 WebDAV 数据根为 `bookmark-extension-data`，其下按类型分目录：

```text
bookmark-extension-data/
  bookmarks/
    index.json
    latest.json
    versions/<versionId>.json
  drafts/
    index.json
    latest.json
    versions/<versionId>.json
```

如果用户配置的 endpoint 已经指向 `bookmark-extension-data`，应用不会重复追加该目录名。

### 9.2 版本规则

- 每类最多保留最近 5 个版本。
- `index.json` 是恢复列表、排序和元数据显示的权威索引。
- `latest.json` 保存最新完整快照副本。
- `versions/<versionId>.json` 保存完整快照 envelope，不保存 delta。
- `versionId` 由时间戳安全化生成。

### 9.3 上传顺序

1. 写入新的版本文件。
2. 更新对应 `index.json`。
3. 更新对应 `latest.json`。
4. 清理超出保留数量的旧版本文件。

如果写入版本文件成功但更新索引或 latest 失败，应用会尝试删除本次新版本并恢复旧索引。

## 10. WebDAV 恢复

### 10.1 恢复入口

- 恢复 WebDAV 草稿到当前草稿。
- 恢复 WebDAV 书签到浏览器书签。

### 10.2 前置条件

- WebDAV 配置合法。
- host 权限已授予。
- 最近一次可用性检测成功。
- 远端版本索引可读取。
- 用户选择的版本类型与恢复目标匹配。
- 本地预恢复备份生成成功。

### 10.3 类型边界

- 草稿版本 envelope 必须是 `draft-snapshot` / `draft-graph-snapshot`。
- 浏览器书签版本 envelope 必须是 `bookmark-snapshot` / `browser-bookmark-tree`。
- 类型不匹配时恢复失败，目标对象保持不变。

## 11. 敏感配置与错误

### 11.1 敏感配置

WebDAV 配置属于敏感配置域，包括：

- endpoint
- username
- password
- 授权状态

规则：

- 不和普通草稿 / 布局状态混同。
- 不进入用户可见状态文案。
- 不进入技术详情中的敏感值输出。

### 11.2 错误模型

- 适配器先归一错误。
- 应用层根据动作语义转成可读状态结果。
- UI 层显示“可读错误 + 可展开技术详情”。
- 不把原始 Chrome / WebDAV / 存储错误对象裸露到界面。
