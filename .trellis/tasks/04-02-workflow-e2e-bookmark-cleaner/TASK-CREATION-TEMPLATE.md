# Child Task Creation Template

## 目标

为当前父 task 后续创建 child task 提供统一模板，避免创建后再反复修改命名、字段、PRD 结构和阶段状态。

本文件只定义创建规范，不创建 task，不修改任何现有 task 实体。

## 证据基础

基于当前 Trellis 机制，child task 创建时的最低事实如下：

- `python3 ./.trellis/scripts/task.py create "<title>" --slug <name> --parent <parent-task-dir>` 会创建 task 目录并写入 `task.json`
- `task.py create` 默认把 task 状态初始化为 `planning`
- `task.py create` 默认把 `current_phase` 初始化为 `0`
- `task.py create` 在 `--parent` 存在时会自动维护父 task 的 `children` 和子 task 的 `parent`
- `task.py create` 不会自动生成 `prd.md`
- `task.py create` 的后续提示是：
  - 先补 `prd.md`
  - 再决定是否执行 `init-context`
  - 再决定是否 `start`

因此，对当前项目来说：

- 创建 child task 本身只是“建档”
- `prd.md` 是创建后必须补齐的最小任务说明
- `init-context` 和 `start` 都不应在纯 `plan` 阶段自动执行

## 创建阶段硬规则

### 规则 1：创建不等于启动

创建 child task 后，默认仍处于“未启动执行”状态。

不得在创建时顺带做以下动作：

- 修改运行时代码
- 初始化实现上下文文件
- 切换当前 task
- 启动实现
- 把 task 状态改成 `in_progress`

### 规则 2：先补 `prd.md`，再考虑进入执行

每个 child task 创建后，至少要先补 `prd.md`，并确认：

- 目标单一
- 依赖正确
- 非目标明确
- 验收标准单一
- 验证方案存在

在此之前，不得进入实现阶段。

### 规则 3：字段最小改动优先

创建 child task 后，只补本次任务真正需要的字段：

- `description`
- `dev_type`
- `relatedFiles`
- `notes`
- `prd.md`

默认不在纯 `plan` 阶段提前补：

- `branch`
- `worktree_path`
- `commit`
- `pr_url`

## `task.json` 字段约定

### 创建后应保持的默认字段

这些字段由 `task.py create` 生成后，默认保持不变：

```json
{
  "status": "planning",
  "current_phase": 0,
  "children": [],
  "subtasks": [],
  "parent": "<由 --parent 自动写入或保持 null>",
  "branch": null,
  "worktree_path": null,
  "commit": null,
  "pr_url": null
}
```

说明：

- `status: planning` 是 child task 在纯 `plan` 阶段的正确状态
- `current_phase: 0` 表示还未进入实现
- child task 是否有后续更细层 task，要等执行前再次判断，不在创建时预设

### 创建后应补齐的字段

#### `description`

写成一句话任务目标，不要写成长段说明。

推荐格式：

```text
<动词> + <目标对象> + <核心边界>
```

示例：

```text
Implement graph basic editing on draft-only state without browser writeback.
```

#### `dev_type`

当前任务图建议使用以下值：

| 任务ID | 建议 `dev_type` |
|-------|-----------------|
| `T01` | `frontend` |
| `T02` | `docs` |
| `T03` | `frontend` |
| `T04` | `frontend` |
| `T05` | `frontend` |
| `T06` | `frontend` |
| `T07A` | `frontend` |
| `T07B` | `frontend` |
| `T08A` | `frontend` |
| `T08B` | `frontend` |
| `T09A` | `frontend` |
| `T09B` | `frontend` |
| `T10` | `frontend` |
| `T11` | `frontend` |
| `T12A` | `frontend` |
| `T12B` | `frontend` |
| `T13` | `frontend` |

说明：

- `T02` 是纯规则沉淀 task，保持 `docs`
- `T13` 虽然包含文档回写，但主语义仍是验证与收尾，保持 `frontend`

#### `relatedFiles`

只记录创建时就已知的强相关输入，不提前写未来一定会改的实现文件。

推荐组成：

- 父 task 目录
- 当前 task 对应的设计文档
- 当前 task 对应的模块 spec
- 必要时加 `tmp/ui/` 或特定参考文档

不推荐在创建时写：

- 大范围 `src/**`
- 尚未确定的具体实现文件
- 还不存在的路径

#### `notes`

统一追加一句阶段说明：

```text
Created from parent task split strategy during pure plan stage. Task exists for later execution and is not started yet.
```

## `prd.md` 最小模板

`start` 工作流要求 task 至少有 `Goal`、`Requirements`、`Acceptance Criteria`、`Technical Notes`。针对当前项目的 child task，建议扩成下面这个最小模板：

```markdown
# <Task Title>

## Goal
<一句话说明本 task 想完成什么>

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`Txx`
- 依赖任务：`...`
- 主要设计输入：`...`

## In Scope
- ...
- ...

## Out Of Scope
- ...
- ...

## Start Conditions
- ...

## Waiting Conditions
- ...

## Requirements
- ...
- ...

## Acceptance Criteria
- [ ] ...
- [ ] ...

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - `...`

## Technical Notes
- ...
- ...
```

## 当前项目的 child task 模板约束

### 所有 child task 必写

- 单一目标
- 明确依赖
- 明确非目标
- 明确“不在本 task 内完成什么”
- 明确执行前验证口径

### 工程/实现类 task 额外必写

适用于 `T01`, `T03`-`T12B`：

- 共享状态边界
- 是否允许改动浏览器侧数据
- 是否涉及覆盖/恢复/云端
- 是否需要人工确认点

### 文档/规则类 task 额外必写

适用于 `T02`：

- 引用来源
- 可复用与不可复用边界
- 对后续实现 task 的约束影响

## 创建后但未执行时的标准状态

一个 child task 在“已创建但尚未启动执行”时，应满足：

- `task.json.status = planning`
- `task.json.current_phase = 0`
- `prd.md` 已存在
- 不存在 `implement.jsonl` / `check.jsonl` / `debug.jsonl` 也可接受
- 不被设置为 current task
- 不写入执行进展

## 推荐创建后检查清单

每创建一个 child task，建议只检查以下事项：

- 目录名是否符合 `MM-DD-slug`
- `title` / `slug` / `description` 是否匹配
- `parent` 是否正确
- 父 task 的 `children` 是否已自动更新
- `prd.md` 是否已按模板补齐
- 当前仍保持 `planning`

## 建议的模块文档映射

| 任务ID | 主要设计输入 |
|-------|-------------|
| `T01` | `design/TAD.md` |
| `T02` | `design/specs/visual-system.md`, `tmp/ui/` |
| `T03` | `design/TAD.md` |
| `T04` | `design/DDD.md`, `design/specs/bookmark-graph.md`, `design/specs/history-and-recovery.md` |
| `T05` | `design/IDD.md`, `design/specs/bookmark-graph.md` |
| `T06` | `design/AID.md`, `design/specs/bookmark-graph.md` |
| `T07A` | `design/AID.md`, `design/specs/bookmark-graph.md` |
| `T07B` | `design/ODD.md`, `design/specs/history-and-recovery.md` |
| `T08A` | `design/specs/search-and-focus.md` |
| `T08B` | `design/AID.md`, `design/ODD.md`, `design/specs/search-and-focus.md` |
| `T09A` | `design/specs/draft-browser-sync.md`, `design/specs/browser-draft-overwrite.md` |
| `T09B` | `design/ODD.md`, `design/specs/history-and-recovery.md`, `design/specs/browser-draft-overwrite.md` |
| `T10` | `design/IDD.md`, `design/specs/webdav-sync.md` |
| `T11` | `design/ODD.md`, `design/specs/webdav-sync.md` |
| `T12A` | `design/ODD.md`, `design/specs/webdav-sync.md`, `design/specs/history-and-recovery.md` |
| `T12B` | `design/ODD.md`, `design/specs/webdav-sync.md`, `design/specs/history-and-recovery.md` |
| `T13` | 全部主设计文档与后续验证记录 |

## 本阶段输出边界

本文件只提供 child task 创建模板，不创建 task，不初始化 context，不进入执行。

配套的具体 task 草稿见：

- `CHILD-TASK-DRAFTS.md`
