---
name: record-session
description: "Records completed work progress to .trellis/workspace/ journal files after human testing and commit. Captures session summaries, commit hashes, and updates developer index files for future session context. Use when a coding session is complete, after the human has committed code, or to persist session knowledge for future AI sessions."
---

[!] **Prerequisite**: This skill should only be used AFTER the human has tested and committed the code.

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

The workflow helper:
- [OK] Runs metadata closure pre-checks
- [OK] Calls `add_session.py` internally
- [OK] Runs metadata closure post-checks
- [OK] Blocks final close-out if `.trellis/tasks` metadata is still dirty

---

## Script Command Reference

| Command | Purpose |
|---------|---------|
| `python3 ./.trellis/scripts/get_context.py --mode record` | Get context for record-session |
| `python3 ./.trellis/scripts/workflow/record-session-helper.py --title "..." --commit "..."` | **Final session close-out with metadata closure checks (recommended)** |
| `python3 ./.trellis/scripts/add_session.py --title "..." --commit "..."` | Direct session append when helper-level closure is not needed |
| `python3 ./.trellis/scripts/task.py archive <name>` | Archive completed task (auto-commits) |
| `python3 ./.trellis/scripts/task.py list` | List active tasks |
