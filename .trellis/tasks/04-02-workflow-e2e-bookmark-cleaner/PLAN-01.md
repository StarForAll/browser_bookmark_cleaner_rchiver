# PLAN-01 方案文档

## 目标

在不进入实际编码的前提下，先把首版工程底座的执行方案、边界、产物和门禁写清，为后续“开始执行 PLAN-01”提供唯一参考。

## 当前定位

- 当前阶段：`plan`
- 当前文档性质：方案文档，不代表已经开始执行
- 当前允许产物：任务计划、方案说明、门禁说明、候选文件清单
- 当前禁止产物：运行时代码、依赖清单、构建配置、manifest、测试脚手架、任何会让仓库从“空白实现仓库”变成“已开始实现”的文件

## 输入依据

- [prd.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/prd.md)
- [task_plan.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/task_plan.md)
- [TAD.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/TAD.md)
- [IDD.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/IDD.md)
- [ODD.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/ODD.md)

## 范围

- 冻结包管理器与依赖管理方式
- 冻结工程目录与入口文件规划
- 冻结自动化验证矩阵
- 冻结 `test-first` 所需的测试目录和命名约定
- 冻结 `finish-work` / `record-session` 的项目化适配要求

## 交付目标

本阶段完成后，应该达到的不是“功能可用”，而是以下规划目标：

- 可以无歧义地说清未来执行 `PLAN-01` 时要先改哪些文件、后改哪些文件
- 可以无歧义地说清哪些文件属于 `PLAN-01`，哪些已经越界到 `PLAN-02`
- 可以无歧义地说清执行后要跑哪些命令、哪些命令允许记为 `not run`
- 可以无歧义地说清什么时候算 `PLAN-01` 完成，什么时候必须停下

## 非目标

- 不创建 `package.json`
- 不创建 `src/`、`public/`、`test/`
- 不创建 `vite.config.ts`、`vitest.config.ts`、`tsconfig*`
- 不创建扩展 `manifest.json`
- 不运行 `pnpm install`
- 不执行 `lint` / `typecheck` / `test` / `build`

## 执行后预期产物

当后续获得“开始执行 PLAN-01”的明确授权后，才允许落地产物。当前只记录候选集合：

- 根目录候选：
  - `package.json`
  - `pnpm-lock.yaml`
  - `tsconfig.json`
  - `tsconfig.node.json`
  - `vite.config.ts`
  - `vitest.config.ts`
  - `eslint.config.mjs`
  - `index.html`
- 目录候选：
  - `public/`
  - `src/`
  - `test/`
- 项目文档候选：
  - `docs/DEVELOPMENT.md`
  - `docs/ARCHITECTURE.md`
  - `docs/TESTING.md`
  - `.trellis/spec/frontend/quality-guidelines.md`
  - `.trellis/worktree.yaml`
  - `.agents/skills/finish-work/SKILL.md`
  - `.agents/skills/record-session/SKILL.md`
  - `.claude/commands/trellis/finish-work.md`
  - `.claude/commands/trellis/record-session.md`
  - `.opencode/commands/trellis/finish-work.md`
  - `.opencode/commands/trellis/record-session.md`

## 执行顺序草案

后续一旦真正开始执行，推荐严格按下面顺序推进，不跳步：

1. 创建根级工程配置
2. 创建最小目录骨架
3. 创建最小扩展页面占位入口
4. 创建最小测试与测试配置
5. 对齐项目文档与 workflow 文档
6. 安装依赖
7. 执行验证矩阵
8. 根据验证结果修正基线

说明：

- 第 1 到 4 步只建立“可验证的空壳”，不实现书签能力
- 第 5 步是为了防止文档仍然声称“仓库没有 scaffold”
- 第 6 到 8 步属于执行阶段，当前 `plan` 阶段只记录，不执行

## 分步执行清单

### Step 1：根级工程配置

目标：

- 让仓库具备明确的前端工程入口和命令矩阵定义

候选文件：

- `package.json`
- `tsconfig.json`
- `tsconfig.node.json`
- `vite.config.ts`
- `vitest.config.ts`
- `eslint.config.mjs`
- `index.html`

完成标准：

- `package.json` 中出现 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`
- TypeScript、Vite、Vitest、ESLint 的入口文件存在
- 仍未落入任何业务实现

停止条件：

- 如果开始写浏览器书签逻辑、WebDAV 逻辑、图谱领域逻辑，立即停止，因为那已经越界到 `PLAN-02/03`

### Step 2：最小目录骨架

目标：

- 将设计中冻结的目录边界落到仓库中

候选目录：

- `public/`
- `src/app/`
- `src/features/`
- `src/domain/`
- `src/adapters/`
- `src/shared/`
- `test/`

完成标准：

- 目录存在
- 可以支撑后续文件放置
- 目录本身不承载真实业务逻辑

停止条件：

- 如果某个目录中出现超出占位壳范围的业务模块实现，立即停止

### Step 3：最小扩展页面占位入口

目标：

- 建立一个“只证明工程壳存在”的最小页面入口

候选文件：

- `public/manifest.json`
- `src/main.tsx`
- `src/app/App.tsx`
- 最小样式文件
- 最小 copy 占位文件

完成标准：

- 能表明这是 Chrome 扩展页面壳
- 文案仍走集中管理
- 页面只承担底座存在性证明，不承担产品功能

明确禁止：

- 不读取 `chrome.bookmarks`
- 不引入 WebDAV 适配
- 不实现图谱渲染和交互

### Step 4：最小测试与测试配置

目标：

- 让测试命令和测试目录约定可执行

候选文件：

- `test/setup.ts`
- 一个最小 `src/**/*.test.ts` 或 `src/**/*.test.tsx` 示例

完成标准：

- `pnpm test` 有明确执行对象
- 测试只验证 scaffold 级事实，不验证业务能力

### Step 5：项目文档与 workflow 文档对齐

目标：

- 让项目文档与实际基线一致

候选文件：

- `docs/DEVELOPMENT.md`
- `docs/ARCHITECTURE.md`
- `docs/TESTING.md`
- `.trellis/spec/frontend/quality-guidelines.md`
- `.trellis/worktree.yaml`
- `finish-work` / `record-session` 相关文档

完成标准：

- 文档明确区分“本地默认验证门禁”和“环境依赖门禁”
- 文档不再声称“还没有真实工程 scaffold”
- 文档不夸大为“书签功能已经开始实现”

### Step 6：依赖安装

目标：

- 安装执行基线所需依赖

执行命令：

- `pnpm install`

完成标准：

- 依赖安装成功
- 生成锁文件

风险：

- 该步骤会改变仓库状态，因此必须在获得“开始执行 PLAN-01”的明确授权后才允许执行

### Step 7：验证矩阵

执行命令：

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

可选命令：

- `sonar-scanner -Dsonar.projectKey=bbcr -Dsonar.token=$SONAR_TOKEN -Dsonar.host.url=https://sonarqube.xzc.com:13785 -Dsonar.sources=.`

结果记录规则：

- 成功写 `pass`
- 失败写 `fail`
- 未执行写 `not run`

### Step 8：基线修正与收口

目标：

- 根据实际验证结果修正 scaffold，而不是把第一次配置直接当成最终版本

完成标准：

- 本地默认验证门禁全部有真实结果
- 文档、命令、目录三者一致
- `PLAN-01` 的完成与未完成边界可复述

## 规划冻结项

### 工程基线

- package manager：`pnpm`
- UI runtime：React + TypeScript
- build tool：Vite
- graph library：`@xyflow/react`
- WebDAV integration：原生 `fetch`

### 目录规划

```text
public/
src/
  app/
  features/
  domain/
  adapters/
  shared/
test/
```

### 验证矩阵

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `sonar-scanner -Dsonar.projectKey=bbcr -Dsonar.token=$SONAR_TOKEN -Dsonar.host.url=https://sonarqube.xzc.com:13785 -Dsonar.sources=.`

说明：

- 前四项属于本地默认验证门禁
- `sonar-scanner` 属于环境依赖门禁，执行时需要 `SONAR_TOKEN`

### test-first 输入

- unit / application logic tests：`src/**/*.test.ts`
- component tests：`src/**/*.test.tsx`
- shared fixtures / mocks / helpers：`test/`

## 执行门禁

只有满足以下条件，才允许从本方案进入执行：

- 用户明确说“开始执行 PLAN-01”或等价授权
- 当前回合目标不再是“整理方案”或“继续 plan”
- 允许新增工程文件并运行依赖安装 / 构建验证命令

建议追加确认语句：

- “现在开始实际创建工程底座文件，可以修改非文档文件”

只有出现这一层明确语义时，才允许从方案进入执行。

## PLAN-01 与后续阶段的边界

### 属于 PLAN-01

- 工程配置
- 目录骨架
- 占位入口
- 测试框架和最小样例
- workflow / spec / docs 对齐
- 基线验证

### 不属于 PLAN-01

- 真实书签读取
- 图谱标准化
- 草稿持久化
- 节点编辑/拖拽/删除/撤销
- 浏览器写回
- WebDAV 配置、测试、上传、恢复

判断规则：

- 只要代码开始承载产品行为而不只是承载工程基线，就说明已经越界

## 验收口径

当未来真正执行 `PLAN-01` 时，验收应只看下面这些问题：

- 工程脚手架是否真实存在
- 目录边界是否符合设计约束
- 文案是否仍保留集中管理的边界
- 本地默认验证命令是否可执行
- workflow/spec/docs 是否已与新基线对齐

不看下面这些问题：

- 能否读取浏览器书签
- 能否渲染图谱
- 能否同步到 WebDAV
- 能否执行恢复和撤销覆盖

## 风险与注意事项

- 最大风险不是技术选型，而是阶段边界漂移
- 一旦在 `plan` 阶段落下基础代码，会把“方案冻结”和“执行开始”混为一件事
- 因此后续必须先看授权语义，再判断是否允许创建非文档文件

## 防误入规则

- “进入 plan 阶段” = 进入规划，不等于进入执行
- “先进行 PLAN-01”如果没有“开始执行 / 落地 / 实施 / 创建脚手架”这类措辞，默认只整理方案
- 任何会改变工程运行状态的动作，都要在执行前再做一次口头确认
- 如果当前回合的主要输出仍然是文档，就不能顺手补代码
- 如果我准备创建 `package.json`、`src/`、`public/`、`test/` 或运行安装命令，必须先显式说明“下面将进入执行阶段”
