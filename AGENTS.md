<!-- TRELLIS:START -->
# Trellis Instructions

These instructions are for AI assistants working in this project.

Use the `/trellis:start` command when starting a new session to:
- Initialize your developer identity
- Understand current project context
- Read relevant guidelines

Use `@/.trellis/` to learn:
- Development workflow (`workflow.md`)
- Project structure guidelines (`spec/`)
- Developer workspace (`workspace/`)

If you're using Codex, project-scoped helpers may also live in:
- `.agents/skills/` for reusable Trellis skills
- `.codex/agents/` for optional custom subagents

Keep this managed block so 'trellis update' can refresh the instructions.

<!-- TRELLIS:END -->


<!-- workflow-nl-routing-start -->

## 自然语言命令路由

> 由工作流安装器自动生成。当用户用自然语言描述意图时，本表提供阶段入口候选映射与推荐口径。
>
> 入口约束：
> - Claude Code / OpenCode：优先使用项目级 `/trellis:xxx` 命令；OpenCode CLI 可使用 `trellis/xxx`
> - Codex：通过 `AGENTS.md` 自然语言路由或显式触发对应 skill；不要期待项目级 `/trellis:xxx` 命令目录
> - 本表用于缩小候选范围，不表示所有 CLI 都存在确定性的自动命令路由；若命中歧义、缺少前置条件或上下文不足，仍应先确认再进入对应阶段

### 工作流阶段命令

| 触发关键词 | Claude / OpenCode 入口 | Codex 入口 | 说明 |
|-----------|------------------------|------------|------|
| 评估、能做吗、报价、新项目、风险、可行性、看看这个项目、能不能接、估个价、接私活、外包项目、客户需求 | `/trellis:feasibility` | 描述可行性评估意图，或显式触发 `feasibility` skill | §1 可行性评估 |
| 需求、PRD、明确需求、需求文档、需求分析、梳理需求、讨论方案、判断要不要拆任务 | `/trellis:brainstorm` | 描述需求澄清意图，或显式触发 `brainstorm` skill | §2 需求发现 |
| 设计、架构、架构设计、选型、接口设计、技术方案、开始设计、画架构图、设计方案 | `/trellis:design` | 描述设计阶段意图，或显式触发 `design` skill | §3 设计阶段 |
| 拆任务、排期、计划、任务分解、做计划、工作分解、里程碑、工作计划 | `/trellis:plan` | 描述任务拆解意图，或显式触发 `plan` skill | §4 任务拆解 |
| 写测试、TDD、测试驱动、先写测试、测试用例、验收测试 | `/trellis:test-first` | 描述测试先行意图，或显式触发 `test-first` skill | §4.3 测试先行 |
| 自审、自检、自查、审查一下、有没有偏差、对照 spec、对照规范、检查偏差 | `/trellis:self-review` | 描述自审意图，或显式触发 `self-review` skill | §5.1.x 自审 |
| 代码审查、review、质量检查、检查代码质量、补充审查、多人审查、check 一下、让其他 CLI 看一下 | `/trellis:check` | 描述补充审查意图，或显式触发 `check` skill | §5.1.y 补充审查 |
| 提交前检查、准备提交、commit 前、收尾 | `/trellis:finish-work` | 描述提交前检查意图，或显式触发 `finish-work` skill | §6 提交检查 |
| 交付、部署、上线、发布、准备交付、跑验收、整理交付物、项目收尾 | `/trellis:delivery` | 描述交付收尾意图，或显式触发 `delivery` skill | §6+§7 测试交付 |
| 记录、保存进度、收工 | `/trellis:record-session` | 描述会话收尾意图，或显式触发 `record-session` skill | §7 会话记录 |

### 框架通用命令

| 触发关键词 | Claude / OpenCode 入口 | Codex 入口 | 说明 |
|-----------|------------------------|------------|------|
| 开始、新会话、继续、下一步 | `/trellis:start` | 描述当前意图，或显式触发 `start` skill | Phase Router 自动检测 |
| 卡住了、反复出错、死循环 | `/trellis:break-loop` | 描述排障意图，或显式触发 `break-loop` skill | 深度 bug 分析 |
| 并行、worktree、同时开发 | `/trellis:parallel` | 描述并行开发意图，或显式触发 `parallel` skill | 并行任务管理 |
| 更新规范、沉淀经验 | `/trellis:update-spec` | 描述规范更新意图，或显式触发 `update-spec` skill | 规范更新 |
| 跨层检查、跨模块影响 | `/trellis:check-cross-layer` | 描述跨层检查意图，或显式触发 `check-cross-layer` skill | 跨层检查 |
| 集成 skill、添加 skill | `/trellis:integrate-skill` | 描述 skill 集成意图，或显式触发 `integrate-skill` skill | Skill 集成 |
| 读规范、开发前准备 | `/trellis:before-dev` | 描述开发前准备意图，或显式触发 `before-dev` skill | 开发前读规范 |
| 新人入门、项目介绍 | `/trellis:onboard` | 描述 onboarding 意图，或显式触发 `onboard` skill | 项目 onboarding |
| 创建命令、新命令 | `/trellis:create-command` | 描述创建命令意图，或显式触发 `create-command` skill | 创建新命令 |

### 歧义消解

- 多个命令匹配时：当前阶段上下文 > 精确关键词 > 阶段顺序推断 > 模糊语义
- 无法确定时：路由到 `/trellis:start`（Phase Router 自动检测）
- top-2 优先级接近时：向用户确认意图，而不是假定已经完成自动精确路由

<!-- workflow-nl-routing-end -->
