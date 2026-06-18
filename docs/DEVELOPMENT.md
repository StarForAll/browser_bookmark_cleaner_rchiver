# 开发文档

## 1. 目标

本文档面向开发人员，说明当前项目的工程基线、实现落点、开发命令、环境变量、约束和发布前验证边界。

## 2. 当前工程状态

- 产品需求、架构边界、交互规则和数据同步契约已经冻结。
- 工程底座采用 Vite + React + TypeScript + pnpm。
- Chrome MV3 manifest、独立扩展页面、service worker 入口已经落地。
- 草稿图谱、浏览器读取 / 导入 / 写回、本地持久化、WebDAV 上传 / 恢复、本地备份、撤销覆盖均已有真实实现。
- 自动化测试覆盖主业务链路；真实 Chrome 扩展加载、真实书签数据和真实 WebDAV provider 仍需要人工验收。

## 3. 快速开始

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

本地加载扩展：

1. 运行 `pnpm build`。
2. 打开 `chrome://extensions`。
3. 开启开发者模式。
4. 加载 `dist/` 目录。

## 4. Sonar

```bash
export SONAR_TOKEN='your-token'
pnpm sonar
```

规则：

- 不要把真实 token 写入仓库文档、源码、测试或提交记录。
- `SONAR_TOKEN` 只能通过环境变量提供。
- `pnpm sonar` 是当前统一入口，内部封装项目固定的 `projectKey`、测试匹配和排除目录。
- Sonar 结果必须按实际执行情况记录为 `pass / fail / not run`。

## 5. 关键目录

```text
public/
  manifest.json
src/
  app/
  adapters/
  domain/
  features/
  shared/
test/
docs/
```

组织原则：

- 按能力 / 领域优先组织。
- 技术层作为模块内子分层。
- React 展示层不直连浏览器 API、WebDAV、持久化。
- 业务真相在 `domain/draft-graph` 的规范化图谱层，不在渲染层节点边对象中。

## 6. 当前实现落点

### 6.1 应用入口

- `public/manifest.json`：Chrome MV3 manifest。
- `src/main.tsx`：扩展页面 React 入口。
- `src/service-worker.ts`：扩展图标入口 service worker。
- `src/app/App.tsx`：工作区壳层、状态入口、外部动作编排。
- `src/app/app.css`：工作区视觉与交互样式。
- `src/shared/copy/appShell.ts`：页面级中文文案集中定义。

### 6.2 浏览器书签

- `src/adapters/browser-bookmarks/readBookmarkTree.ts`：读取并归一 Chrome 书签树。
- `src/adapters/browser-bookmarks/importToDraft.ts`：浏览器树导入草稿图谱。
- `src/adapters/browser-bookmarks/exportDraftToBrowserTree.ts`：草稿导出浏览器树。
- `src/adapters/browser-bookmarks/writeManagedBrowserTree.ts`：受管范围写回与失败回滚。
- `src/features/browser-sync/application/bootstrapWorkspace.ts`：启动恢复 / 导入策略。

### 6.3 草稿图谱

- `src/domain/draft-graph/contracts.ts`：草稿图谱、undo、checkpoint contract。
- `src/domain/draft-graph/editing.ts`：节点编辑、移动、删除、重排等领域逻辑。
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx`：草稿图谱工作区 UI。
- `src/features/bookmark-graph/state/draftUndo.ts`：draft-only undo。
- `src/features/bookmark-graph/state/searchAndFocus.ts`：搜索与重复 URL 聚焦派生状态。

### 6.4 本地持久化

- `src/adapters/local-persistence/contracts.ts`：本地持久化 contract、key 分域和校验。
- `src/adapters/local-persistence/readPersistedDraftSession.ts`：读取草稿会话。
- `src/adapters/local-persistence/writePersistedDraftSession.ts`：写入草稿会话。
- `src/adapters/local-persistence/webdavConfig.ts`：WebDAV 配置与权限状态持久化。
- `src/adapters/local-persistence/localBackupArtifacts.ts`：本地草稿 / 浏览器备份读写。

### 6.5 WebDAV

- `src/adapters/webdav/jsonDocument.ts`：WebDAV JSON 读写、删除、认证和超时处理。
- `src/adapters/webdav/requestHostPermission.ts`：运行时 host 权限请求。
- `src/adapters/webdav/testAvailability.ts`：WebDAV 可用性检测。
- `src/features/webdav/application/uploadVersionedSnapshot.ts`：分类型上传、版本索引、保留策略。
- `src/features/webdav/application/restoreVersionedSnapshot.ts`：版本列表读取与分类型恢复。

## 7. 开发约束

- `tmp/ui/` 只作视觉参考，不得直接复制代码进入生产实现。
- 新增外部副作用必须进入 application 层编排，不能散落在组件事件里。
- 新增浏览器、WebDAV 或本地存储能力必须先定义 adapter contract。
- 覆盖式动作必须保留确认、前置备份、失败状态、回滚边界。
- WebDAV 密码等敏感值不得进入状态记录、日志、测试快照或文档示例。
- 文案集中管理，避免用户可见中文散落在组件逻辑中。

## 8. 常用验证命令

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm sonar
```

说明：

- 前四项是本地默认自动化门禁。
- `pnpm sonar` 依赖 `SONAR_TOKEN` 和可访问 SonarQube 的网络环境。
- Chrome 扩展加载、真实书签写回、WebDAV provider 兼容性必须人工验证补足。
- 所有结果都必须按实际执行情况记录为 `pass / fail / not run`。

## 9. 发布前人工验收

至少覆盖：

- Chrome 加载 `dist/` 后可打开或聚焦工作区页面。
- 首次启动可读取真实浏览器书签并生成草稿。
- 本地草稿存在时刷新后可恢复。
- 图谱编辑、拖拽、键盘操作、搜索、重复 URL 聚焦可用。
- 从浏览器覆盖当前草稿前会生成草稿备份。
- 同步草稿到浏览器书签前会生成浏览器备份。
- 撤销覆盖可恢复最新草稿备份或浏览器备份。
- WebDAV 设置、权限请求、可用性检测、上传、版本列表、恢复可用。
- 失败场景不泄露 WebDAV 密码等敏感信息。

## 10. 后续维护建议

- 新增功能先补领域 / adapter contract，再接 UI。
- 对跨层行为新增测试时，优先覆盖“前置检查 -> 副作用 -> 状态反馈”的完整链路。
- 文档中的“当前实现快照”必须随功能推进更新，不能把冻结目标误写成已实现事实，也不能保留过期未实现说明。
