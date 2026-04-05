# Browser Bookmark Cleaner Rchiver

一个面向 Chrome 扩展场景的浏览器书签清理与归档工作区项目。当前仓库已经落地工程 scaffold、扩展运行壳、独立页面入口，以及基础验证链路；书签草稿图谱、浏览器覆盖写回、WebDAV 同步与恢复等业务能力仍在后续任务中持续实现。

## 当前状态

- 已有最小可执行工程基线：Vite + React + TypeScript + pnpm
- 已有 Chrome 扩展壳与独立页面入口
- 已冻结自动化验证矩阵与测试目录约定
- 已接入 `pnpm sonar` 作为统一 Sonar 扫描入口
- 核心业务功能仍未全部完成，不能把当前仓库视为功能完整版本

## 技术栈

- React 19
- TypeScript
- Vite
- Vitest + Testing Library
- ESLint
- Chrome Extension MV3
- WebDAV 通过原生 `fetch` 接入

## 常用命令

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

如果需要执行 Sonar：

```bash
export SONAR_TOKEN='your-token'
pnpm sonar
```

说明：

- `SONAR_TOKEN` 只能通过环境变量提供，不要写入仓库
- `pnpm sonar` 内部已经固定项目级 SonarScanner 参数
- Sonar 结果和其他验证项一样，必须按实际执行结果记录为 `pass / fail / not run`

## 目录概览

```text
public/
src/
  app/
  adapters/
  domain/
  features/
  shared/
test/
docs/
.trellis/
```

约束：

- `tmp/ui/` 仅作为设计参考，不能直接复制到生产实现
- 浏览器 API、WebDAV 和本地持久化不能直接耦合到 React 展示组件
- 当前业务真相应保持在规范化草稿图谱层，而不是渲染层节点边对象

## 文档

- [开发文档](./docs/DEVELOPMENT.md)
- [测试与验证文档](./docs/TESTING.md)
- [项目指令与工作流](./AGENTS.md)

## 开发说明

- 包管理器固定为 `pnpm`
- 自动化基线命令为 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`pnpm sonar`
- Chrome 扩展运行时相关能力仍需要人工验证补足，不能只依赖本地自动化命令
