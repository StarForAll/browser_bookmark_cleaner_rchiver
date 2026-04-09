# merge brainstorm improvements

## Goal

在不破坏当前 Trellis 项目级门禁和路由规则的前提下，将 `.new` 中对 `brainstorm` 有价值的方法论改进，精确合并回现有 skill 与各当前入口 command，并在逐文件审查后清理不采纳的 `.new` 候选稿。

## Requirements

- 保留现有 `L0/L1/L2` 分类、冻结后变更分流、`§2.5` 需求变更管理等项目规则。
- 吸收 `task-first`、`action-before-asking`、单问题提问、先研究再问、先发散后收敛等通用改进。
- 不引入与当前仓库不匹配的命令、路径或规范引用。
- 保持 `.agents/skills/brainstorm/SKILL.md`、`.claude/commands/trellis/brainstorm.md` 与 `.opencode/commands/trellis/brainstorm.md` 语义同步。
- 对其余 `.new` 文件逐个完成覆盖/合并/跳过判断，并清理最终不采纳的候选稿。

## Acceptance Criteria

- [ ] 三份当前 `brainstorm` 入口文档都新增方法性增强说明，但原有项目门禁仍完整保留。
- [ ] 不出现来自 `.new` 的错误命令、错误规范路径或错误流程替换。
- [ ] 修改后的内容仍能清楚区分“澄清需求”和“冻结后正式变更”。
- [ ] 已审查的 `.new` 候选稿不再残留于仓库中。

## Technical Notes

- 当前仓库仍以 `.trellis/workflow.md` 为流程权威来源。
- `finish-work` 补充检查发现 `.opencode/commands/trellis/brainstorm.md` 也是当前入口，需一并同步。
- 实际执行分两步：先合并 `brainstorm` 两对正式文件，再按逐文件判断结果清理全部已审查 `.new` 候选稿。
