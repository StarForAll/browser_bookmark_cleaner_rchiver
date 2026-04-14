# 任务拆分策略设计

## 目标

把当前“单一总 task + 大型 `task_plan.md`”的规划方式，重构为“一个总览 task + 多个真实 Trellis task”的任务图设计方案。

本文件只定义拆分策略，不创建 task，不修改执行状态，不进入实现。

## 当前问题

当前总 task 已经承载了过多性质差异明显的工作：

- 工程基线
- UI 参考资产回写
- 扩展运行壳
- 书签读取与规范化
- 图谱交互
- 搜索/重复聚焦/状态反馈
- 浏览器覆盖/恢复
- WebDAV 配置/上传/恢复
- 验收与收尾

这些工作在以下维度上差异过大：

- 修改面不同
- 风险类型不同
- 验收方式不同
- 依赖链不同
- 所需上下文不同

因此不适合长期留在一个 task 的 `task_plan.md` 中作为主要执行单位。

## 拆分原则

### 原则 1：真正执行的工作单元必须优先落到 Trellis task

- `task_plan.md` 只保留总览、依赖关系、里程碑、迁移规则
- 真正要执行的工作，原则上都应该对应一个 task 目录

### 原则 2：边界差异优先于文件数量

即使两个工作改动文件不多，只要它们的目标、风险、验收不同，也应拆成不同 task。

### 原则 3：单 task 必须能在单一上下文内完成

如果一个 task 很难在单一上下文里完成“理解 -> 实现 -> 验证”，它就太大了，必须继续拆分。

### 原则 4：验收口径必须单一

如果一个 task 同时需要“工程脚手架验收 + 浏览器交互验收 + 云端恢复验收”，说明它混了多个阶段，应拆分。

### 原则 5：串行拆分优先于超大 task

当一项工作过大时，优先拆成多个串行 task，不要为了减少 task 数量而保留一个超大 task。

## 总体结构

建议保留当前 task 作为“总览 / 任务图 / 规划协调 task”，不再把它当作主要实现 task。

角色调整如下：

- 当前 task：
  - 保留为总 task
  - 负责保存 PRD、设计资料、拆分策略、总览计划
  - 不再直接承载主要实现

- 新建 child task：
  - 每个真正执行的工作单元独立成 task
  - 用 `--parent` 归属于当前总 task

## 建议任务图

### T01 工程基线

- 建议标题：`Create Extension Engineering Baseline`
- 建议 slug：`extension-engineering-baseline`
- 父 task：当前总 task
- 来源：原 `PLAN-01`
- 性质：工程基础设施

范围：

- 包管理器、构建配置、测试配置、lint/typecheck/test/build 脚本
- workflow 文档与验证矩阵对齐

不包含：

- 真实业务功能

### T02 UI 参考约束回写

- 建议标题：`Freeze UI Reference Constraints`
- 建议 slug：`ui-reference-constraints`
- 父 task：当前总 task
- 来源：原 `PLAN-01A`
- 性质：设计约束沉淀

范围：

- `tmp/ui` 的视觉/布局/语气规则提炼
- 禁止复用边界沉淀

不包含：

- React 组件实现
- CSS 落地

### T03 扩展运行壳与页面入口

- 建议标题：`Create Extension Shell And Page Entry`
- 建议 slug：`extension-shell-page-entry`
- 父 task：当前总 task
- 来源：原 `PLAN-02`

范围：

- MV3 manifest
- 独立扩展页面入口
- 应用装配根
- 共享目录壳

不包含：

- 浏览器书签读取
- 图谱编辑逻辑

### T04 领域契约与本地持久化

- 建议标题：`Define Draft Graph Contracts And Local Persistence`
- 建议 slug：`draft-graph-contracts-persistence`
- 父 task：当前总 task
- 来源：原 `PLAN-03` 的上半段

范围：

- 规范化图谱领域模型
- schema version
- 本地持久化 contract
- 草稿/布局/展开态/撤销历史存储边界

不包含：

- 浏览器书签读取落地
- 图谱交互 UI

拆分原因：

- 这是领域和持久化边界问题，和浏览器读取适配是不同复杂度和验证口径

### T05 浏览器读取与草稿引导

- 建议标题：`Implement Browser Bookmark Import To Draft`
- 建议 slug：`browser-import-to-draft`
- 父 task：当前总 task
- 来源：原 `PLAN-03` 的下半段

范围：

- Chrome bookmarks adapter
- 浏览器树读取
- 映射到规范化草稿
- 启动恢复与首次导入策略

不包含：

- 编辑交互
- 浏览器写回

### T06 图谱基础编辑交互

- 建议标题：`Implement Graph Basic Editing`
- 建议 slug：`graph-basic-editing`
- 父 task：当前总 task
- 来源：原 `PLAN-04` 的基础部分

范围：

- 选中
- 双击编辑
- 新增子节点
- 删除节点/子树

不包含：

- 拖拽移动
- 撤销系统

拆分原因：

- 节点编辑基础链与拖拽/撤销共享状态复杂度不同，不建议放在一个 task 里

### T07A 拖拽移动与目录投放校验

- 建议标题：`Implement Graph Drag Move Validation`
- 建议 slug：`graph-drag-move-validation`
- 父 task：当前总 task
- 来源：原 `PLAN-04` 的高级部分之一

范围：

- 拖拽移动
- 目录投放校验

不包含：

- `Ctrl+Z`
- 撤销历史模型

拆分原因：

- 拖拽投放校验偏交互与结构约束；撤销系统偏历史模型与恢复语义，不宜混在一个 task 中

### T07B 撤销历史与 `Ctrl+Z`

- 建议标题：`Implement Undo History And Ctrl Z`
- 建议 slug：`undo-history-ctrl-z`
- 父 task：当前总 task
- 来源：原 `PLAN-04` 的高级部分之一

范围：

- 草稿撤销历史
- `Ctrl+Z`
- 与操作提示区的撤销语义对齐

不包含：

- 拖拽目录投放校验

### T08A 搜索与重复 URL 聚焦

- 建议标题：`Implement Search And Duplicate Focus`
- 建议 slug：`search-duplicate-focus`
- 父 task：当前总 task
- 来源：原 `PLAN-05` 的前半段

范围：

- 标题/URL 搜索
- duplicate-only
- 悬浮重复信息

不包含：

- 状态反馈历史
- 云端禁用原因展示

### T08B 状态反馈、历史记录与云端禁用态

- 建议标题：`Implement Status Feedback And Disabled States`
- 建议 slug：`status-feedback-disabled-states`
- 父 task：当前总 task
- 来源：原 `PLAN-05` 的后半段

范围：

- 右下角状态区
- 最新结果入口
- 最新 3 条历史记录
- 失败原因摘要
- 云端禁用原因提示

### T09A 浏览器覆盖与同步确认流

- 建议标题：`Implement Browser Overwrite And Sync Confirmation`
- 建议 slug：`browser-overwrite-sync-confirmation`
- 父 task：当前总 task
- 来源：原 `PLAN-06` 的前半段

范围：

- 从浏览器覆盖当前草稿
- 同步草稿到浏览器书签
- 覆盖/同步确认流

不包含：

- 本地最新备份
- 撤销覆盖入口
- 恢复边界

### T09B 本地备份、撤销覆盖与恢复边界

- 建议标题：`Implement Local Backup And Undo Overwrite`
- 建议 slug：`local-backup-undo-overwrite`
- 父 task：当前总 task
- 来源：原 `PLAN-06` 的后半段

范围：

- 覆盖前本地备份
- 撤销覆盖统一入口
- 本地恢复边界
- 浏览器写回失败与 best-effort rollback 反馈

### T10 WebDAV 配置与权限

- 建议标题：`Implement WebDAV Configuration And Permissions`
- 建议 slug：`webdav-config-permissions`
- 父 task：当前总 task
- 来源：原 `PLAN-07` 的前半段

范围：

- WebDAV 配置
- host permission
- 连通性测试
- 云端能力可用性 gating

### T11 WebDAV 上传与版本管理

- 建议标题：`Implement WebDAV Upload And Version Retention`
- 建议 slug：`webdav-upload-versioning`
- 父 task：当前总 task
- 来源：原 `PLAN-07` 的中段

范围：

- 草稿上传
- 浏览器书签上传
- index manifest
- 保留最近 5 个版本

### T12A WebDAV 恢复到当前草稿

- 建议标题：`Implement WebDAV Draft Restore`
- 建议 slug：`webdav-draft-restore`
- 父 task：当前总 task
- 来源：原 `PLAN-07` 的后半段之一

范围：

- 恢复到草稿
- 草稿恢复前本地备份
- 草稿恢复确认流

不包含：

- 恢复到浏览器书签

### T12B WebDAV 恢复到浏览器书签

- 建议标题：`Implement WebDAV Browser Restore`
- 建议 slug：`webdav-browser-restore`
- 父 task：当前总 task
- 来源：原 `PLAN-07` 的后半段之一

范围：

- 恢复到浏览器书签
- 浏览器恢复前本地备份
- 浏览器恢复确认流

### T13 验收与收尾准备

- 建议标题：`Run Verification And Prepare Closeout`
- 建议 slug：`verification-closeout`
- 父 task：当前总 task
- 来源：原 `PLAN-08`

范围：

- 自动化验证矩阵
- Chrome 扩展人工验收
- 文档回写
- `finish-work` / `record-session` 准备

## 推荐串行主链

建议主链如下：

1. `T01` 工程基线
2. `T02` UI 参考约束回写
3. `T03` 扩展运行壳与页面入口
4. `T04` 领域契约与本地持久化
5. `T05` 浏览器读取与草稿引导
6. `T06` 图谱基础编辑交互
7. `T07A` 拖拽移动与目录投放校验
8. `T07B` 撤销历史与 `Ctrl+Z`
9. `T08A` 搜索与重复 URL 聚焦
10. `T08B` 状态反馈、历史记录与云端禁用态
11. `T09A` 浏览器覆盖与同步确认流
12. `T09B` 本地备份、撤销覆盖与恢复边界
13. `T10` WebDAV 配置与权限
14. `T11` WebDAV 上传与版本管理
15. `T12A` WebDAV 恢复到当前草稿
16. `T12B` WebDAV 恢复到浏览器书签
17. `T13` 验收与收尾准备

## 串行执行硬规则

- 所有 child task 必须按主链顺序串行推进
- 不以“理论上可独立”作为并行启动依据
- 前一个 task 未完成 `test-first -> implement -> check` 收口前，不切换到下一个 task
- 前一个 task 即使已经收口，也不自动开始下一个 task
- 每次进入新的 child task 前，都必须得到用户对该具体 task 的显式启动授权
- 若发现依赖或边界需要调整，先回到拆分或设计修正，不用并行执行规避问题

## 任务粒度检查表

一个 task 只有在同时满足以下条件时，才可以保留为单 task：

- 目标单一
- 修改面集中
- 验收口径单一
- 单上下文可理解并完成
- 不需要再分两段以上串行执行

如果任一项不满足，应继续拆分。

## 当前总 task 的后续角色

当前总 task 后续应只承担：

- 保存 PRD
- 保存设计文档
- 保存任务拆分策略
- 保存 task 图摘要
- 维护整体依赖与阶段状态

不再承担：

- 主要实现
- 大量执行记录
- 多阶段混合进度

## task_plan.md 的后续定位

后续建议把 `task_plan.md` 收缩为：

- 任务图摘要
- 父子 task 关系
- 串行执行顺序
- 全局里程碑
- 当前可开始 task 列表

不再把每一个具体任务的完整 DoR/DoD、子任务列表、实现细项都长期堆在里面。

## refined task graph

按当前任务生成原则校正后，推荐执行单元如下：

- `T01` 工程基线
- `T02` UI 参考约束回写
- `T03` 扩展运行壳与页面入口
- `T04` 领域契约与本地持久化
- `T05` 浏览器读取与草稿引导
- `T06` 图谱基础编辑交互
- `T07A` 拖拽移动与目录投放校验
- `T07B` 撤销历史与 `Ctrl+Z`
- `T08A` 搜索与重复 URL 聚焦
- `T08B` 状态反馈、历史记录与云端禁用态
- `T09A` 浏览器覆盖与同步确认流
- `T09B` 本地备份、撤销覆盖与恢复边界
- `T10` WebDAV 配置与权限
- `T11` WebDAV 上传与版本管理
- `T12A` WebDAV 恢复到当前草稿
- `T12B` WebDAV 恢复到浏览器书签
- `T13` 验收与收尾准备

## 拟父子关系表

当前总 task 保持为唯一父 task：

- 父 task 目录：`04-02-workflow-e2e-bookmark-cleaner`
- 父 task 角色：总览、规划协调、依赖汇总、阶段门禁
- 子 task 创建原则：当前阶段先只定义，不创建

| 任务ID | 建议标题 | 建议 slug | 拟 parent | 关系说明 |
|-------|---------|-----------|----------|---------|
| `T01` | `Create Extension Engineering Baseline` | `extension-engineering-baseline` | `04-02-workflow-e2e-bookmark-cleaner` | 主链起点 |
| `T02` | `Freeze UI Reference Constraints` | `ui-reference-constraints` | `04-02-workflow-e2e-bookmark-cleaner` | 串行位于 `T01` 之后、`T03` 之前 |
| `T03` | `Create Extension Shell And Page Entry` | `extension-shell-page-entry` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T01` |
| `T04` | `Define Draft Graph Contracts And Local Persistence` | `draft-graph-contracts-persistence` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T03` |
| `T05` | `Implement Browser Bookmark Import To Draft` | `browser-import-to-draft` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T04` |
| `T06` | `Implement Graph Basic Editing` | `graph-basic-editing` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T05` |
| `T07A` | `Implement Graph Drag Move Validation` | `graph-drag-move-validation` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T06` |
| `T07B` | `Implement Undo History And Ctrl Z` | `undo-history-ctrl-z` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T06`，建议晚于 `T07A` 启动 |
| `T08A` | `Implement Search And Duplicate Focus` | `search-duplicate-focus` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T07A` / `T07B` 稳定 |
| `T08B` | `Implement Status Feedback And Disabled States` | `status-feedback-disabled-states` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T08A` 的共享状态边界 |
| `T09A` | `Implement Browser Overwrite And Sync Confirmation` | `browser-overwrite-sync-confirmation` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T08B` |
| `T09B` | `Implement Local Backup And Undo Overwrite` | `local-backup-undo-overwrite` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T09A` |
| `T10` | `Implement WebDAV Configuration And Permissions` | `webdav-config-permissions` | `04-02-workflow-e2e-bookmark-cleaner` | 串行位于 `T09B` 之后 |
| `T11` | `Implement WebDAV Upload And Version Retention` | `webdav-upload-versioning` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T10` 与稳定草稿模型 |
| `T12A` | `Implement WebDAV Draft Restore` | `webdav-draft-restore` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T11` |
| `T12B` | `Implement WebDAV Browser Restore` | `webdav-browser-restore` | `04-02-workflow-e2e-bookmark-cleaner` | 依赖 `T11` 与 `T09B` |
| `T13` | `Run Verification And Prepare Closeout` | `verification-closeout` | `04-02-workflow-e2e-bookmark-cleaner` | 收口 task，依赖全部主链完成 |

说明：

- 这批 task 当前全部只是“拟创建 child task”
- 所有子 task 暂不再继续下钻为孙 task；若创建时发现单 task 仍过大，再单独二次拆分
- 创建 child task 不等于开始执行 child task

## 拟创建顺序（串行）

真正开始创建 task 时，也按最终执行顺序逐个创建并逐个确认，不再按批次组织。

### 创建总规则

- 不修改当前总 task 的 parent / children 关系
- 当前总 task 继续作为唯一总览 task
- 每次只处理一个 child task 的创建与确认
- 当前 child task 未确认前，不继续创建下一个 child task

## 拟创建顺序矩阵

| 创建顺序 | 任务ID | 拟依赖 | 创建后是否允许立即启动 |
|---------|-------|-------|------------------------|
| 1 | `T01` | 无 | 允许，待人工明确进入执行 |
| 2 | `T02` | `T01` | 不允许，前序未收口前不切换 |
| 3 | `T03` | `T02` | 不允许 |
| 4 | `T04` | `T03` | 不允许 |
| 5 | `T05` | `T04` | 不允许 |
| 6 | `T06` | `T05` | 不允许 |
| 7 | `T07A` | `T06` | 不允许 |
| 8 | `T07B` | `T07A` | 不允许 |
| 9 | `T08A` | `T07B` | 不允许 |
| 10 | `T08B` | `T08A` | 不允许 |
| 11 | `T09A` | `T08B` | 不允许 |
| 12 | `T09B` | `T09A` | 不允许 |
| 13 | `T10` | `T09B` | 不允许 |
| 14 | `T11` | `T10` | 不允许 |
| 15 | `T12A` | `T11` | 不允许 |
| 16 | `T12B` | `T12A` | 不允许 |
| 17 | `T13` | `T12B` | 不允许 |

说明：

- “允许立即启动”只描述理论门禁，不是当前阶段授权
- 当前仍处于 `plan`，因此上表所有 task 都只停留在“拟创建 / 拟启动条件”层面
- 后续真正创建时，也应遵守“先创建，再人工确认是否进入执行”的两段式流程
- 上表用于冻结串行执行顺序；即使原始设计依赖允许，也不再并行推进 sibling task

## 拟创建命令模板

以下命令只是后续执行模板，当前阶段不运行：

```bash
python3 ./.trellis/scripts/task.py create "<title>" --slug <name> --parent 04-02-workflow-e2e-bookmark-cleaner
```

建议在真正创建时逐条执行，并在每个 task 创建后检查：

- 新 task 目录命名是否符合预期
- 子 task 的 `parent` 字段是否正确
- 父 task 的 `children` 列表是否正确
- 是否存在需要立刻再次拆分的超大 task

## 后续迁移步骤建议

真正开始迁移时，建议按这个顺序：

1. 保留当前总 task 不动
2. 依次创建并确认 `T01`
3. 依次创建并确认 `T02`
4. 依次创建并确认 `T03`
5. 依次创建并确认 `T04`
6. 依次创建并确认 `T05`
7. 依次创建并确认 `T06`
8. 依次创建并确认 `T07A`
9. 依次创建并确认 `T07B`
10. 依次创建并确认 `T08A`
11. 依次创建并确认 `T08B`
12. 依次创建并确认 `T09A`
13. 依次创建并确认 `T09B`
14. 依次创建并确认 `T10`
15. 依次创建并确认 `T11`
16. 依次创建并确认 `T12A`
17. 依次创建并确认 `T12B`
18. 最后创建并确认 `T13`

这样做的好处：

- 不会一口气创建过多 task
- 可以先把最早会启动的 task 建出来
- 后续 task 的描述可以根据前置 task 产物再精炼

## 风险

- 如果拆得太粗，又会回到“大 task 混阶段”的问题
- 如果拆得太碎，会增加 task 管理成本

当前建议粒度是：

- 以“单 task 可单上下文完成并验证”为上限
- 以“边界明显不同必须拆开”为下限

## 本阶段输出边界

本文件只做拆分策略设计，不创建 task，不修改 task 关系，不更新执行状态。

配套创建模板见：

- `TASK-CREATION-TEMPLATE.md`
