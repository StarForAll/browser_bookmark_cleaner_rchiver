# Workflow E2E Issues

This file records simulated human input, workflow problems, environment gaps, project assumptions, and stop conditions during black-box execution of the imported workflow.

## 2026-04-02

### env-gap: workflow installer required escalated write for Codex skill import

- Stage: workflow import / installation
- Command:
  - `/ops/softwares/python/bin/python3 '/ops/projects/personal/ai-coding-toolkit/docs/workflows/新项目开发工作流/commands/install-workflow.py' --project-root /ops/projects/personal/browser_bookmark_cleaner_rchiver`
- First attempt result:
  - Claude and OpenCode layers were written successfully inside sandbox.
  - Codex layer failed when creating `.agents/skills/feasibility`.
  - Error: `OSError: [Errno 30] Read-only file system`
- Resolution:
  - Re-ran the installer with escalated permissions.
  - Workflow import then completed successfully for `claude`, `opencode`, and `codex`.
- Impact:
  - Workflow import is complete.
  - Future automated installers that write into `.agents/skills/` may require the same permission path in this environment.

### project-assumption: imported workflow is the active baseline for subsequent stages

- Imported source directory:
  - `/ops/projects/personal/ai-coding-toolkit/docs/workflows/新项目开发工作流`
- Effective local markers:
  - `.trellis/workflow-installed.json`
  - `AGENTS.md` natural-language routing section
  - `.agents/skills/{feasibility,brainstorm,design,plan,test-first,self-review,check,delivery}/SKILL.md`
- Assumption:
  - Subsequent discussion and implementation should follow the imported workflow chain instead of the default bootstrap-only path.
