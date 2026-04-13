# 开发文档

## 1. 目标

本文档面向开发人员，说明当前项目的工程基线、已实现内容、冻结目标、环境变量、构建入口和开发约束。

## 2. 当前状态

- 产品需求、技术架构、交互边界和数据同步规则已经冻结
- `T01` 已落地最小工程 scaffold 和自动化验证命令基线
- `T03` 已落地 Chrome 扩展运行壳、独立页面入口和五区工作区
- `T04` 至 `T05` 已落地草稿图谱契约、本地持久化适配器、浏览器书签读取与启动导入
- `T06` 至 `T08B` 已落地图谱基础编辑、删除、同级 / 子级创建、拖拽移动、键盘重排 / 提升、悬浮信息、draft-only `Ctrl+Z`、搜索 / 重复聚焦，以及状态反馈与禁用态说明
- `T09B` 至 `T12B` 已落地本地备份与撤销覆盖恢复边界、WebDAV 配置 / 上传 / 恢复
- 当前已通过 service worker 接入“点击扩展图标打开或聚焦工作区页面”的扩展入口
- 当前页面已有状态弹窗开关、最近 3 条状态历史持久化、统一禁用动作说明和集中管理的中文文案
- 浏览器覆盖写回的真实执行链路与最终验收收尾仍待后续任务继续实现

## 3. 当前实际技术栈

- UI runtime：React + TypeScript
- Build tool：Vite
- Package manager：`pnpm`
- Test runner：Vitest + Testing Library
- Lint：ESLint

## 4. 冻结目标但当前尚未接入的技术选择

- Graph library target：`@xyflow/react`
- WebDAV integration target：原生 `fetch`

这些属于尚未全部接入的设计冻结项；其中本地持久化已通过 `chrome.storage.local` 适配器落地。

## 5. 当前工程落点

当前仓库已经具备：

- `public/manifest.json`
- `index.html` + `src/main.tsx` 扩展页面入口
- `src/service-worker.ts` 扩展图标点击入口的 service worker 装配点
- `src/app/App.tsx` 五区工作区壳层与启动状态区
- `src/app/app.css` 壳层样式
- `src/shared/copy/appShell.ts` 中文文案集中定义
- `src/adapters/browser-bookmarks/*` 浏览器书签读取与导入适配器
- `src/adapters/local-persistence/*` 本地持久化契约与读写适配器
- `src/domain/draft-graph/*` 规范化草稿图谱契约与编辑领域逻辑
- `src/features/browser-sync/application/bootstrapWorkspace.ts` 启动引导编排
- `src/features/workspace-entry/application/actionWorkspaceServiceWorker.ts` 扩展图标点击后的工作区聚焦 / 新建逻辑
- `src/features/workspace-entry/application/registerWorkspaceActionTarget.ts` 工作区页面自注册当前 tab 目标
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.tsx` 草稿图谱工作区
- `src/engineeringBaseline.test.ts` 工程基线断言
- `src/extensionShellPageEntry.test.tsx` 扩展入口与页面壳断言
- `src/app/App.startup.test.tsx` 启动状态区断言
- `src/features/browser-sync/application/bootstrapWorkspace.test.ts` 启动恢复 / 导入断言
- `src/features/bookmark-graph/ui/DraftGraphWorkspace.test.tsx` 图谱编辑与拖拽断言
- `src/uiReferenceConstraints.test.ts` UI 参考约束断言

当前仍未具备：

- 浏览器覆盖写回、覆盖确认与回滚保护
- 更完整的状态历史保留

## 6. 目录方向

当前目录骨架：

```text
src/
  app/
  features/
  domain/
  adapters/
  shared/
test/
public/
docs/
```

约束：

- 按能力/领域组织
- 技术层作为模块内子分层
- 不把浏览器 API、WebDAV、持久化直接耦合到展示组件
- `src/features/`、`src/domain/`、`src/adapters/` 已承载真实业务代码；新增逻辑应继续沿既有边界扩展，而不是回退成壳层占位结构

## 7. 环境变量

### 7.1 Sonar

如果需要执行 Sonar 扫描，使用：

```bash
export SONAR_TOKEN='your-token'
pnpm sonar
```

规则：

- 不要把真实 token 写入仓库文档或源码
- 通过环境变量提供凭据
- `pnpm sonar` 是当前统一入口；其内部封装了项目固定的 `projectKey`、测试匹配和排除目录

## 8. 自动化命令

当前统一命令入口：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm sonar
```

说明：

- 前四项是本地默认验证门禁
- `pnpm sonar` 依赖 `SONAR_TOKEN` 和可访问 SonarQube 的网络环境
- 所有结果都必须按实际执行情况记录为 `pass / fail / not run`

## 9. 本地开发约束

- `tmp/ui/` 只作设计参考，不得直接复制代码进入生产实现
- 业务真相是规范化图谱，不是渲染层节点边对象
- 浏览器写回是显式确认后的覆盖式写回
- WebDAV 版本列表由显式索引驱动
- React 展示层不直接调用 `chrome.*`、原始 `fetch` 或持久化接口

## 10. 当前尚未落地的工程项

以下内容是已冻结但尚未在代码中完全落地的目标：

- 剩余业务能力对应的单元测试、组件测试与人工验证补齐
- 浏览器覆盖写回、覆盖确认与恢复边界
- WebDAV 配置、连通性测试与版本化恢复
- 本地备份 / 撤销覆盖恢复

## 11. 后续实现顺序建议

1. 接入浏览器覆盖 / 写回与本地备份保护
2. 接入 WebDAV 配置、上传、恢复与版本保留
3. 补齐人工验证与收尾文档
