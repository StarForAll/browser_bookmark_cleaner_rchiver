# 测试与验证文档

## 1. 目标

本文档描述项目的自动化验证矩阵、测试目录约定、现有覆盖范围和必须保留的人工验证边界。

## 2. 验证原则

- 没有执行就记录为 `not run`。
- 不把目标命令写成“已通过”的事实。
- 自动化测试证明代码路径，不替代真实 Chrome 扩展和真实 WebDAV 服务验收。
- 高风险外部动作必须验证前置备份、执行结果、失败状态和回滚边界。

## 3. 自动化验证矩阵

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm sonar
```

说明：

- `pnpm lint`：ESLint。
- `pnpm typecheck`：应用与 node 配置 TypeScript 检查。
- `pnpm test`：Vitest 全量测试。
- `pnpm build`：Vite 构建。
- `pnpm sonar`：SonarScanner，依赖 `SONAR_TOKEN` 与网络环境。

## 4. 测试目录约定

- 单元 / 应用逻辑测试：`src/**/*.test.ts`
- React 组件测试：`src/**/*.test.tsx`
- 共享 fixtures / mocks / setup：`test/`

## 5. 当前自动化覆盖

当前测试已经覆盖：

- 工程基线、manifest、扩展页面入口、service worker 工作区入口。
- 浏览器书签读取、导入草稿、草稿导出浏览器树、受管范围写回和失败回滚。
- 本地草稿会话读写、contract 校验、WebDAV 配置持久化、本地备份读写。
- 启动阶段本地草稿恢复、浏览器导入和导入持久化失败提示。
- 草稿图谱编辑、创建、删除、拖拽、键盘重排 / 提升、draft-only undo。
- 搜索、普通结果导航、重复 URL 聚焦和悬浮详情。
- 状态弹窗、状态历史、禁用态说明、外部动作串行锁。
- 浏览器覆盖草稿、同步草稿到浏览器、覆盖前备份、撤销覆盖。
- WebDAV 可用性检测、host 权限门禁、上传、版本保留、草稿恢复、浏览器书签恢复。

## 6. 高风险验证点

以下内容不能只靠“看起来没问题”判断：

- 从浏览器覆盖草稿前是否先写入 `latest-draft-backup`。
- 同步草稿到浏览器前是否先写入 `latest-browser-backup`。
- WebDAV 草稿恢复前是否先生成草稿备份。
- WebDAV 浏览器书签恢复前是否先生成浏览器备份。
- 浏览器写回失败后是否区分自动回滚成功 / 自动回滚失败。
- WebDAV 未配置、未授权、不可用时相关动作是否禁用。
- `Ctrl+Z` 是否只影响草稿，不回退已完成的外部写操作。
- WebDAV 密码、用户名、endpoint 中的敏感部分是否不会泄露到状态详情。

## 7. 人工验证清单

发布前必须人工验证：

- Chrome 扩展加载 `dist/`。
- 扩展图标点击后打开或聚焦工作区。
- 真实浏览器书签读取、导入、覆盖草稿。
- 真实浏览器书签写回与失败场景下的回滚表现。
- WebDAV host 权限请求。
- 真实 WebDAV 服务可用性检测、上传、版本保留、恢复。
- 覆盖前备份与撤销覆盖。
- 状态区成功 / 失败 / 阻断反馈。
- Tab 焦点、对话框焦点陷阱、键盘操作。

## 8. 提交前记录格式

每项结果必须写成：

- `pass`
- `fail`
- `not run`

建议记录：

```text
pnpm lint: not run
pnpm typecheck: not run
pnpm test: not run
pnpm build: not run
pnpm sonar: not run
Chrome manual: not run
WebDAV manual: not run
```

## 9. 新增测试建议

新增或修改功能时，优先补齐以下维度：

- 领域 contract：输入校验、非法结构、边界字段。
- Adapter：外部 API 不可用、返回异常、部分成功、敏感值不泄露。
- Application：前置检查、备份顺序、副作用顺序、状态记录。
- UI：按钮启用 / 禁用、确认框、焦点、可访问名称、用户可见文案。
- 回归：历史 bug 的最小复现用例。
