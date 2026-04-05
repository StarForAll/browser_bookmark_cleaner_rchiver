# 开发文档

## 1. 目标

本文档面向开发人员，说明当前项目的工程基线、技术栈、环境变量、构建目标和实现约束。

## 2. 当前状态

- 产品需求、架构和设计边界已冻结
- `T01` 已落地最小工程 scaffold 和验证命令基线
- `T03` 已落地 Chrome 扩展运行壳与独立页面入口
- 草稿图谱、浏览器同步和 WebDAV 行为仍待后续任务继续实现

## 3. 技术栈

- UI runtime：React + TypeScript
- Build tool：Vite
- Package manager：`pnpm`
- Graph library：`@xyflow/react`
- WebDAV：原生 `fetch`

## 4. 当前工程目标

首版目标是构建一个 Chrome 扩展工程，至少包含：

- 扩展 manifest
- 独立扩展页面入口
- React 应用壳
- 图谱工作区基础目录
- 浏览器、WebDAV、本地持久化适配层

## 5. 目录方向

当前推荐方向：

```text
src/
  app/
  features/
  domain/
  adapters/
  shared/
test/
public/
```

约束：

- 按能力/领域组织
- 技术层作为模块内子分层
- 不把浏览器 API、WebDAV、持久化直接耦合到展示组件

## 6. 扩展能力

### 6.1 必需权限

- `bookmarks`
- `storage`

### 6.2 可选权限

- 用户配置的 WebDAV host access

规则：

- WebDAV host 权限运行时按需申请
- host 权限被拒绝时，本地草稿编辑仍应完整可用

## 7. 环境变量

### 7.1 Sonar

如果需要执行 Sonar 扫描，使用：

```bash
export SONAR_TOKEN='your-token'
sonar-scanner -Dsonar.projectKey=bbcr -Dsonar.token=$SONAR_TOKEN -Dsonar.host.url=https://sonarqube.xzc.com:13785 -Dsonar.sources=.
```

规则：

- 不要把真实 token 写入仓库文档或源码
- 通过环境变量提供凭据

## 8. 本地开发约束

- `tmp/ui/` 只作设计参考，不得直接复制代码进入生产实现
- 业务真相是规范化图谱，不是 `@xyflow/react` 的渲染节点边
- 浏览器写回是显式确认后的覆盖式写回
- WebDAV 版本列表由显式索引驱动

## 9. 当前尚未落地的工程项

以下内容是已冻结但尚未在代码中完全落地的目标：

- 业务能力对应的单元测试与组件测试
- Sonar 扫描接入
 - 真实草稿图谱、同步与恢复功能

## 10. 后续实现顺序建议

1. 建立数据层与适配器层
2. 建立图谱工作区
3. 接入浏览器写回与 WebDAV
4. 补齐测试与验证链路
