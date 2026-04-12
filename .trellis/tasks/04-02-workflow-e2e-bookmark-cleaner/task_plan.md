# Browser Bookmark Cleaner Task Plan

## 概述

本文件现在只承担父 task 摘要角色，不再承载细粒度任务拆解、DoR/DoD 或实现细节。

父 task：

- 目录：`04-02-workflow-e2e-bookmark-cleaner`
- 当前角色：总览、依赖汇总、阶段门禁、child task 编排
- 当前阶段：`implementation`

当前状态：

- 设计包已冻结并完成 `plan` 入场确认
- refined task graph 已完成
- 17 个 child task 已创建完成
- `T01` 至 `T09B` 已完成实现并归档
- 当前仍处于 active / planning 的 child task 为 `T10` 至 `T13`
- 已完成 child task 的实现范围已覆盖：工程基线、扩展运行壳、本地持久化契约、浏览器读取导入、图谱基础编辑、拖拽移动、撤销历史与 `Ctrl+Z`、搜索与重复 URL 聚焦、状态反馈与禁用态、浏览器覆盖与同步确认、本地备份与撤销覆盖恢复边界
- 后续 child task 仍需按既定串行顺序推进，不能把已完成前序任务误记为“尚未启动”

## 父 Task 边界

父 task 只负责：

- 保存 PRD、设计包和 planning 文档
- 维护整体任务图、父子关系和串行执行顺序
- 记录当前阶段门禁
- 为后续 child task 执行提供统一入口

父 task 不再负责：

- 直接承载主要实现工作
- 长篇 DoR/DoD 细项
- 混合记录多个执行阶段的细节

## 当前门禁

- 父 task 的项目级 `test-first` 基线已冻结完成
- 当前 `test-first` 采用双层规则：
  - 全局只冻结一次项目级测试基线
  - 执行时按 child task 逐个编写测试门禁
- 在进入具体 child task 的 `test-first` 前，仍需明确指定目标 task
- child task 已创建，不等于 child task 已启动
- 在未指定 child task 前，不开始测试编写，也不开始实现
- 不在父协调 task 中一次性为整个 plan 预写完整测试套件

## Canonical Docs

- 设计总入口：`design/index.md`
- 任务图与串行顺序：`TASK-SPLIT-STRATEGY.md`
- child task 字段模板：`TASK-CREATION-TEMPLATE.md`
- child task 实际草稿：`CHILD-TASK-DRAFTS.md`
- 旧式过渡方案文档：`PLAN-01.md`, `PLAN-01A.md`

## 产品验收摘要

说明：以下为父 task 的产品验收目标摘要，不代表当前仓库已全部完成；当前已实现范围以“当前状态”和 child task 实际状态为准。

- Chrome 扩展可加载，并打开独立工作区页面
- 能读取浏览器书签并形成可编辑草稿图谱
- 图谱支持基础编辑、拖拽移动、`Ctrl+Z`、搜索和重复 URL 聚焦
- 浏览器写回和恢复行为都必须显式确认并具备本地备份边界
- WebDAV 配置、上传、版本保留、恢复闭环可用，且未配置/无权限/失败时必须整体禁用并解释原因
- 所有验证结果必须以 `pass` / `fail` / `not run` 记录

## Child Task 图

| 任务ID | 目录 | 主要目标 | 依赖 |
|-------|------|---------|------|
| `T01` | `04-04-extension-engineering-baseline` | 工程基线与验证命令冻结 | 无 |
| `T02` | `04-04-ui-reference-constraints` | UI 参考约束沉淀 | 无 |
| `T03` | `04-04-extension-shell-page-entry` | 扩展运行壳与页面入口 | `T01` |
| `T04` | `04-04-draft-graph-contracts-persistence` | 草稿图谱契约与本地持久化 | `T03` |
| `T05` | `04-04-browser-import-to-draft` | 浏览器书签导入草稿 | `T04` |
| `T06` | `04-04-graph-basic-editing` | 图谱基础编辑 | `T05` |
| `T07A` | `04-04-graph-drag-move-validation` | 拖拽移动与目录投放校验 | `T06` |
| `T07B` | `04-04-undo-history-ctrl-z` | 撤销历史与 `Ctrl+Z` | `T06` |
| `T08A` | `04-04-search-duplicate-focus` | 搜索与重复 URL 聚焦 | `T07A`, `T07B` |
| `T08B` | `04-04-status-feedback-disabled-states` | 状态反馈、历史、禁用态 | `T08A` |
| `T09A` | `04-04-browser-overwrite-sync-confirmation` | 浏览器覆盖与同步确认流 | `T08B` |
| `T09B` | `04-04-local-backup-undo-overwrite` | 本地备份、撤销覆盖与恢复边界 | `T09A` |
| `T10` | `04-04-webdav-config-permissions` | WebDAV 配置、权限与可用性 gating | `T08B` |
| `T11` | `04-04-webdav-upload-versioning` | WebDAV 上传与版本保留 | `T10`, `T05` |
| `T12A` | `04-04-webdav-draft-restore` | WebDAV 恢复到草稿 | `T11` |
| `T12B` | `04-04-webdav-browser-restore` | WebDAV 恢复到浏览器书签 | `T11`, `T09B` |
| `T13` | `04-04-verification-closeout` | 验收、文档回写与收尾 | `T03` 至 `T12B` |

## 串行执行顺序

1. `T01`
2. `T02`
3. `T03`
4. `T04`
5. `T05`
6. `T06`
7. `T07A`
8. `T07B`
9. `T08A`
10. `T08B`
11. `T09A`
12. `T09B`
13. `T10`
14. `T11`
15. `T12A`
16. `T12B`
17. `T13`

默认规则：

- 创建完成不等于开始执行
- 若未来发现单 task 仍过大，应在进入实现前继续拆分
- 所有 child task 必须严格串行执行，不允许并行启动或交叉推进
- 任何具体 child task 在进入实现前，必须先完成该 task 自己的 `test-first` 门禁
- `test-first` 不按“整份 plan 一次性写完测试”执行，而按上述顺序逐个 child task 推进
- 不允许先执行具体 task、再回补该 task 的测试门禁
- 前一个 child task 收口，不等于自动授权下一个 child task 开始执行
- 若用户未在当前回合显式点名或批准下一项任务，必须停在当前 task 收口结果并等待进一步指令

## 当前执行状态摘要

- 父 task：`in_progress`
- 已归档完成：`T01`、`T02`、`T03`、`T04`、`T05`、`T06`、`T07A`、`T07B`、`T08A`、`T08B`、`T09A`、`T09B`
- 待继续推进：`T10`、`T11`、`T12A`、`T12B`、`T13`
- child task：17/17 已创建；其中 12 个已完成，5 个仍处于 active / planning
- 当前没有新的 active child task 正在执行；下一步若继续推进，应从剩余串行任务中显式点名 `T10`
- 剩余 child task 仍未开始各自的 `test-first` 与实现；当前冻结串行链路已推进到 `T09B` 收口完成

## 后续入口

后续当前默认入口：

- 明确指定一个 child task
- 先进入该 child task 的 `test-first`
- 该 child task 的 `test-first` 完成后，再进入 `start` / 实现阶段
- 当前 child task 收口后，才允许切换到下一个 child task
- 切换到下一个 child task 前，必须再次得到用户明确授权；不能按串行顺序自动续跑
