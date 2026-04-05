# 开发文档

## 1. 目标

本文档面向开发人员，说明当前项目的工程基线、已实现内容、冻结目标、环境变量、构建入口和开发约束。

## 2. 当前状态

- 产品需求、技术架构、交互边界和数据同步规则已经冻结
- `T01` 已落地最小工程 scaffold 和自动化验证命令基线
- `T03` 已落地 Chrome 扩展运行壳、独立页面入口和五区工作区占位 UI
- 当前页面已有状态弹窗开关、禁用动作按钮和集中管理的中文文案
- 草稿图谱、浏览器同步、WebDAV、恢复与本地持久化适配逻辑仍待后续任务继续实现

## 3. 当前实际技术栈

- UI runtime：React + TypeScript
- Build tool：Vite
- Package manager：`pnpm`
- Test runner：Vitest + Testing Library
- Lint：ESLint

## 4. 冻结目标但当前尚未接入的技术选择

- Graph library target：`@xyflow/react`
- WebDAV integration target：原生 `fetch`
- Local persistence target：`chrome.storage.local`

这些属于设计冻结项，不应被当作当前代码已经接入的事实。

## 5. 当前工程落点

当前仓库已经具备：

- `public/manifest.json`
- `index.html` + `src/main.tsx` 扩展页面入口
- `src/app/App.tsx` 五区工作区壳层
- `src/app/app.css` 壳层样式
- `src/shared/copy/appShell.ts` 中文文案集中定义
- `src/engineeringBaseline.test.ts` 工程基线断言
- `src/extensionShellPageEntry.test.tsx` 扩展入口与页面壳断言
- `src/uiReferenceConstraints.test.ts` UI 参考约束断言

当前仍未具备：

- 浏览器书签读取与写回
- 规范化草稿图谱与节点编辑
- WebDAV 设置、上传、恢复
- 本地持久化适配器
- 真实布局、搜索、重复聚焦和撤销链路

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
- `src/features/`、`src/domain/`、`src/adapters/` 目前还是骨架目录，不要把它们误认为已实现业务层

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

- 业务能力对应的单元测试与组件测试补齐
- 真实草稿图谱、同步与恢复功能
- 浏览器书签适配器与本地持久化适配器
- WebDAV 配置、连通性测试与版本化恢复
- 自动归位、搜索与重复聚焦、撤销历史

## 11. 后续实现顺序建议

1. 建立数据层与适配器层
2. 建立图谱工作区
3. 接入浏览器写回与 WebDAV
4. 补齐测试与验证链路
