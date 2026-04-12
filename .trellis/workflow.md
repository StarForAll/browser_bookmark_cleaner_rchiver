# Development Workflow

> Based on [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

---

## Table of Contents

1. [Quick Start (Do This First)](#quick-start-do-this-first)
2. [Workflow Overview](#workflow-overview)
3. [Session Start Process](#session-start-process)
4. [Development Process](#development-process)
5. [Session End](#session-end)
6. [File Descriptions](#file-descriptions)
7. [Best Practices](#best-practices)

---

## Quick Start (Do This First)

### Step 0: Initialize Developer Identity (First Time Only)

> **Multi-developer support**: Each developer/Agent needs to initialize their identity first

```bash
# Check if already initialized
python3 ./.trellis/scripts/get_developer.py

# If not initialized, run:
python3 ./.trellis/scripts/init_developer.py <your-name>
# Example: python3 ./.trellis/scripts/init_developer.py cursor-agent
```

This creates:
- `.trellis/.developer` - Your identity file (gitignored, not committed)
- `.trellis/workspace/<your-name>/` - Your personal workspace directory

**Naming suggestions**:
- Human developers: Use your name, e.g., `john-doe`
- Cursor AI: `cursor-agent` or `cursor-<task>`
- Claude Code: `claude-agent` or `claude-<task>`
- iFlow cli: `iflow-agent` or `iflow-<task>`

### Step 1: Understand Current Context

```bash
# Get full context in one command
python3 ./.trellis/scripts/get_context.py

# Or check manually:
python3 ./.trellis/scripts/get_developer.py      # Your identity
python3 ./.trellis/scripts/task.py list          # Active tasks
git status && git log --oneline -10              # Git state
```

### Step 2: Read Project Guidelines [MANDATORY]

**CRITICAL**: Read guidelines before writing any code:

```bash
# Discover available packages and spec layers
python3 ./.trellis/scripts/get_context.py --mode packages

# Read the spec index for each relevant module
cat .trellis/spec/<package>/<layer>/index.md

# Always read shared guides
cat .trellis/spec/guides/index.md
```

**Why this matters?**
- Understand which spec layers apply to your task
- Know coding standards for the packages you'll modify
- Learn the overall code quality requirements

### Step 3: Before Coding - Read Specific Guidelines (Required)

Based on your task, read the **detailed** guideline files listed in each spec index's **Pre-Development Checklist**:

```bash
# The index points to specific files — read those, not just the index
cat .trellis/spec/<package>/<layer>/error-handling.md
cat .trellis/spec/<package>/<layer>/conventions.md
# etc. — based on what the Pre-Development Checklist lists
```

---

## Workflow Overview

### Core Principles

1. **Read Before Write** - Understand context before starting
2. **Follow Standards** - [!] **MUST read `.trellis/spec/` guidelines before coding**
3. **Incremental Development** - Complete one task at a time
4. **Record Promptly** - Update tracking files immediately after completion
5. **Document Limits** - [!] **Max 2000 lines per journal document**

### File System

```
.trellis/
|-- .developer           # Developer identity (gitignored)
|-- scripts/
|   |-- __init__.py          # Python package init
|   |-- common/              # Shared utilities (Python)
|   |   |-- __init__.py
|   |   |-- paths.py         # Path utilities
|   |   |-- developer.py     # Developer management
|   |   +-- git_context.py   # Git context implementation
|   |-- multi_agent/         # Multi-agent pipeline scripts
|   |   |-- __init__.py
|   |   |-- start.py         # Start worktree agent
|   |   |-- status.py        # Monitor agent status
|   |   |-- create_pr.py     # Create PR
|   |   +-- cleanup.py       # Cleanup worktree
|   |-- init_developer.py    # Initialize developer identity
|   |-- get_developer.py     # Get current developer name
|   |-- task.py              # Manage tasks
|   |-- get_context.py       # Get session context
|   +-- add_session.py       # Session append script used by the workflow helper
|-- workspace/           # Developer workspaces
|   |-- index.md         # Workspace index + Session template
|   +-- {developer}/     # Per-developer directories
|       |-- index.md     # Personal index (with @@@auto markers)
|       +-- journal-N.md # Journal files (sequential numbering)
|-- tasks/               # Task tracking
|   +-- {MM}-{DD}-{name}/
|       +-- task.json
|-- spec/                # [!] MUST READ before coding
|   |-- frontend/        # Frontend guidelines (if applicable)
|   |   |-- index.md               # Start here - guidelines index
|   |   +-- *.md                   # Topic-specific docs
|   |-- backend/         # Backend guidelines (if applicable)
|   |   |-- index.md               # Start here - guidelines index
|   |   +-- *.md                   # Topic-specific docs
|   +-- guides/          # Thinking guides
|       |-- index.md                      # Guides index
|       |-- cross-layer-thinking-guide.md # Pre-implementation checklist
|       +-- *.md                          # Other guides
+-- workflow.md             # This document
```

---

## Session Start Process

### Step 1: Get Session Context

Use the unified context script:

```bash
# Get all context in one command
python3 ./.trellis/scripts/get_context.py

# Or get JSON format
python3 ./.trellis/scripts/get_context.py --json
```

### Step 2: Read Development Guidelines [!] REQUIRED

**[!] CRITICAL: MUST read guidelines before writing any code**

Based on what you'll develop, read the corresponding guidelines:

```bash
# Discover available packages and spec layers
python3 ./.trellis/scripts/get_context.py --mode packages

# Read spec indexes for relevant modules
cat .trellis/spec/<package>/<layer>/index.md

# For cross-layer features
cat .trellis/spec/guides/cross-layer-thinking-guide.md
```

### Step 3: Select Task to Develop

Use the task management script:

```bash
# List active tasks
python3 ./.trellis/scripts/task.py list

# Create new task (creates directory with task.json)
python3 ./.trellis/scripts/task.py create "<title>" --slug <task-name>
```

---

## Development Process

### Task Development Flow

```
1. Create or select task
   --> python3 ./.trellis/scripts/task.py create "<title>" --slug <name> or list

2. Write code according to guidelines
   --> Read .trellis/spec/ docs relevant to your task
   --> For cross-layer: read .trellis/spec/guides/

3. Self-test
   --> Run project's frozen verification commands when scaffold exists (see spec docs)
   --> Manual feature testing

4. Commit code
   --> git add <files>
   --> git commit -m "type(scope): description"
       Format: feat/fix/docs/refactor/test/chore

5. Archive task metadata + record session
   --> python3 ./.trellis/scripts/task.py archive <task-name>
   --> python3 ./.trellis/scripts/workflow/record-session-helper.py --title "Title" --commit "hash"
```

For workflows that split work into a parent coordination task plus child execution tasks:

- freeze the project test-first baseline once in design/spec docs
- select one concrete child task before entering test-first or implementation
- completing the current child task does not automatically authorize the next child task
- after a child task is completed or archived, update the parent coordinator records in the same round so the latest completed frontier, pending frontier, and next selectable child task stay synchronized
- the next child task may start only after the human explicitly names or approves that task in the current round
- create and verify the test gate for that child task only
- complete that child task's test gate before entering its concrete implementation work
- do not pre-write one-shot tests for the entire plan from the parent coordination task
- do not run sibling child tasks in parallel; finish the current child task before switching to the next one

### Code Quality Checklist

**Must pass before commit**:
- [OK] Lint checks pass (project-specific command)
- [OK] Type checks pass (if applicable)
- [OK] Manual feature testing passes

**Project-specific checks**:
- See `.trellis/spec/<package>/<layer>/quality-guidelines.md` for package-specific checks
- If a change is Trellis-related, sync all linked current-entry hidden directories instead of updating `.trellis/` alone:
  - `.trellis/`
  - `.claude/`
  - `.opencode/`
  - `.agents/skills/`
  - `.codex/`
- Keep each directory in its own format and command style.

---

## Session End

### One-Click Session Recording

After the human has tested and committed the code, archive the completed task and then use:

```bash
python3 ./.trellis/scripts/task.py archive <task-name>
git status --short .trellis/tasks .trellis/.current-task
```

Expected metadata status output: empty.

Notes:

- `.trellis/.current-task` may be empty after archive; this is the expected final close-out state.
- For `record-session`, the real blocker is dirty metadata, especially `.trellis/tasks`, not the absence of an active current task.

Then run the workflow helper:

```bash
python3 ./.trellis/scripts/workflow/record-session-helper.py \
  --title "Session Title" \
  --commit "abc1234" \
  --summary "Brief summary"
```

This helper:
1. Runs metadata closure pre-checks
2. Calls `add_session.py`
3. Runs metadata closure post-checks
4. Blocks final close-out if `.trellis/tasks` is still dirty
5. Allows final close-out to proceed even after archive has cleared `.trellis/.current-task`

### Pre-end Checklist

Close-out 分两阶段执行，不可混为一谈：

**阶段 A — commit 前**（由 `/trellis:finish-work` 执行的 pre-commit checklist）：
1. Frozen verification matrix executed or truthfully marked `deferred` / `not run`
2. Manual browser verification completed where required
3. Spec docs updated if needed

**阶段 B — commit 后**（close-out 阶段，按顺序执行）：
1. Human commit already exists
2. Current completed task archived; if it is a child task, the parent coordinator records are also synchronized to the new completed frontier
3. `.trellis/tasks` metadata clean
4. Session recorded via `record-session-helper.py`

---

## File Descriptions

### 1. workspace/ - Developer Workspaces

**Purpose**: Record each AI Agent session's work content

**Structure** (Multi-developer support):
```
workspace/
|-- index.md              # Main index (Active Developers table)
+-- {developer}/          # Per-developer directory
    |-- index.md          # Personal index (with @@@auto markers)
    +-- journal-N.md      # Journal files (sequential: 1, 2, 3...)
```

**When to update**:
- [OK] End of each session
- [OK] Complete important task
- [OK] Fix important bug

### 2. spec/ - Development Guidelines

**Purpose**: Documented standards for consistent development

**Structure** (Multi-doc format):
```
spec/
|-- frontend/           # Frontend docs (if applicable)
|   |-- index.md        # Start here
|   +-- *.md            # Topic-specific docs
|-- backend/            # Backend docs (if applicable)
|   |-- index.md        # Start here
|   +-- *.md            # Topic-specific docs
+-- guides/             # Thinking guides
    |-- index.md        # Start here
    +-- *.md            # Guide-specific docs
```

**When to update**:
- [OK] New pattern discovered
- [OK] Bug fixed that reveals missing guidance
- [OK] New convention established

### 3. Tasks - Task Tracking

Each task is a directory containing `task.json`:

```
tasks/
|-- 01-21-my-task/
|   +-- task.json
+-- archive/
    +-- 2026-01/
        +-- 01-15-old-task/
            +-- task.json
```

**Commands**:
```bash
python3 ./.trellis/scripts/task.py create "<title>" [--slug <name>]   # Create task directory
python3 ./.trellis/scripts/task.py archive <name>  # Archive to archive/{year-month}/
python3 ./.trellis/scripts/task.py list            # List active tasks
python3 ./.trellis/scripts/task.py list-archive    # List archived tasks
```

---

## Best Practices

### [OK] DO - Should Do

1. **Before session start**:
   - Run `python3 ./.trellis/scripts/get_context.py` for full context
   - [!] **MUST read** relevant `.trellis/spec/` docs

2. **During development**:
   - [!] **Follow** `.trellis/spec/` guidelines
   - For cross-layer features, use `/trellis:check-cross-layer`
   - Develop only one task at a time
   - Run lint and tests frequently
   - Use `/trellis:check` to run quality checks against project spec and output `check.md`
   - Use `/trellis:review-gate` for multi-CLI review: the coordinating CLI must both write `reviewer-commands-round-<N>.md` and print the exact copy-paste reviewer commands in the same response
   - Unless the human explicitly requests a different reviewer set, `/trellis:review-gate` defaults to one reviewer command; increase via `--reviewer-count N` up to 4

3. **After development complete**:
   - Use `/trellis:finish-work` for pre-commit checklist
   - Human commits after testing passes
   - Use `/trellis:delivery` for acceptance testing, deliverables, changelog, and knowledge capture
   - Use `record-session-helper.py` for final session close-out
   - After fix bug, use `/trellis:break-loop` for deep analysis

### [X] DON'T - Should Not Do

1. [!] **Don't** skip reading `.trellis/spec/` guidelines
2. [!] **Don't** let journal single file exceed 2000 lines
3. **Don't** develop multiple unrelated tasks simultaneously
4. **Don't** commit code with lint/test errors
5. **Don't** forget to update spec docs after learning something
6. [!] **Don't** execute `git commit` - AI should not commit code

---

## Quick Reference

### Must-read Before Development

| Task Type | Must-read Document |
|-----------|-------------------|
| Frontend work | `frontend/index.md` → relevant docs |
| Backend work | `backend/index.md` → relevant docs |
| Cross-Layer Feature | `guides/cross-layer-thinking-guide.md` |

### Commit Convention

```bash
git commit -m "type(scope): description"
```

**Type**: feat, fix, docs, refactor, test, chore
**Scope**: Module name (e.g., auth, api, ui)

### Common Commands

```bash
# Session management
python3 ./.trellis/scripts/get_context.py    # Get full context
python3 ./.trellis/scripts/workflow/record-session-helper.py    # Final session close-out

# Task management
python3 ./.trellis/scripts/task.py list      # List tasks
python3 ./.trellis/scripts/task.py create "<title>" # Create task
python3 ./.trellis/scripts/task.py archive <name>   # Archive completed task

# Slash commands
/trellis:check                # Post-implementation quality check
/trellis:review-gate          # Multi-CLI supplementary review
/trellis:finish-work          # Pre-commit checklist
/trellis:delivery             # Acceptance testing, deliverables, changelog
/trellis:record-session       # Final session close-out
/trellis:break-loop           # Post-debug analysis
/trellis:check-cross-layer    # Cross-layer verification
```

---

## Summary

Following this workflow ensures:
- [OK] Continuity across multiple sessions
- [OK] Consistent code quality
- [OK] Trackable progress
- [OK] Knowledge accumulation in spec docs
- [OK] Transparent team collaboration

**Core Philosophy**: Read before write, follow standards, record promptly, capture learnings
