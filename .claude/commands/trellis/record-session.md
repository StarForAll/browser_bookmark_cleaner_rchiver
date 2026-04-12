[!] **Prerequisite**: This command should only be used AFTER the human has tested and committed the code.

**Do NOT run `git commit` directly** — the scripts below handle their own commits for `.trellis/` metadata. You only need to read git history (`git log`, `git status`, `git diff`) and run the Python scripts.

---

## Record Work Progress

### Step 1: Get Context & Check Tasks

```bash
python3 ./.trellis/scripts/get_context.py --mode record
```

[!] Archive tasks whose work is **actually done** — judge by work status, not the `status` field in task.json:
- Code committed? → Archive it (don't wait for PR)
- All acceptance criteria met? → Archive it
- Don't skip archiving just because `status` still says `planning` or `in_progress`

```bash
python3 ./.trellis/scripts/task.py archive <task-name>
```

If the archived task is a child task under a parent coordinator task, sync the parent progress records before continuing:

- update the parent `task_plan.md` summary to the new completed frontier and next pending child task
- update parent `task.json` narrative metadata such as `notes` if it still points to the old frontier
- do not treat `python3 ./.trellis/scripts/task.py list` alone as proof that the parent summary is synchronized

## Record-Session Metadata Closure `[AI]`

Use `/trellis:record-session` here only for the **final close-out of the current completed task**.

Before continuing:

- Archive the current completed task explicitly:

```bash
python3 ./.trellis/scripts/task.py archive <current-task>
```

- Verify task metadata is already closed out:
  - `.trellis/tasks` must be clean
  - `.trellis/.current-task` may already be empty after archive; this is normal for final close-out
  - if the archived task was a child task, parent coordinator records must already reflect the same completed frontier

```bash
git status --short .trellis/tasks .trellis/.current-task
```

Expected output: empty.

If `.trellis/tasks` or `.trellis/.current-task` is still dirty, stop here and fix archive / metadata issues before recording the session.

For the final session record, use the workflow helper instead of calling `add_session.py` directly:

```bash
python3 ./.trellis/scripts/workflow/record-session-helper.py \
  --title "Session Title" \
  --commit "hash1,hash2" \
  --summary "Brief summary of what was done"
```

This helper runs the metadata closure checks before and after `add_session.py`.
It does not require an active `.trellis/.current-task` after archive; the blocking condition is dirty metadata, especially `.trellis/tasks`.

### Step 2: One-Click Add Session

```bash
# Preferred method: final close-out helper
python3 ./.trellis/scripts/workflow/record-session-helper.py \
  --title "Session Title" \
  --commit "hash1,hash2" \
  --summary "Brief summary of what was done"

# Fallback: direct add_session.py only if you are not doing final close-out
cat << 'EOF' | python3 ./.trellis/scripts/add_session.py --stdin --title "Title" --commit "hash"
| Feature | Description |
|---------|-------------|
| New API | Added user authentication endpoint |
| Frontend | Updated login form |

**Updated Files**:
- `packages/api/modules/auth/router.ts`
- `apps/web/modules/auth/components/login-form.tsx`
EOF
```

**Auto-completes**:
- [OK] Appends session to journal-N.md
- [OK] Auto-detects line count, creates new file if >2000 lines
- [OK] Auto-detects Branch context (`--branch` override; otherwise Branch = task.json -> current git branch; missing values are omitted gracefully)
- [OK] Updates index.md (Total Sessions +1, Last Active, line stats, history)
- [OK] Auto-commits .trellis/workspace and .trellis/tasks changes

---

## Script Command Reference

| Command | Purpose |
|---------|---------|
| `python3 ./.trellis/scripts/get_context.py --mode record` | Get context for record-session |
| `python3 ./.trellis/scripts/workflow/record-session-helper.py --title "..." --commit "..."` | **Final session close-out with metadata closure checks (recommended)** |
| `python3 ./.trellis/scripts/add_session.py --title "..." --commit "..."` | Direct session append when helper-level closure is not needed |
| `python3 ./.trellis/scripts/task.py archive <name>` | Archive completed task (auto-commits) |
| `python3 ./.trellis/scripts/task.py list` | List active tasks |
