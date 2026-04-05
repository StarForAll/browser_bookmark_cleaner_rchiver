"""
Git command execution utility.

Single source of truth for running git commands across all Trellis scripts.
"""

from __future__ import annotations

import subprocess
from pathlib import Path


def run_git(args: list[str], cwd: Path | None = None) -> tuple[int, str, str]:
    """Run a git command and return (returncode, stdout, stderr).

    Uses UTF-8 encoding with -c i18n.logOutputEncoding=UTF-8 to ensure
    consistent output across all platforms (Windows, macOS, Linux).
    """
    try:
        git_args = ["git", "-c", "i18n.logOutputEncoding=UTF-8"] + args
        result = subprocess.run(
            git_args,
            cwd=cwd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)


def get_status_porcelain(
    paths: list[str],
    cwd: Path | None = None,
) -> tuple[int, list[str], str]:
    """Return porcelain status lines for the given paths."""
    rc, out, err = run_git(
        ["status", "--porcelain", "--untracked-files=all", "--", *paths],
        cwd=cwd,
    )
    if rc != 0:
        return rc, [], err
    lines = [line for line in out.splitlines() if line.strip()]
    return rc, lines, ""


def has_staged_changes(status_lines: list[str]) -> bool:
    """True when any status line includes a staged change."""
    for line in status_lines:
        if line.startswith("??"):
            continue
        if line and line[0] not in {" ", "?"}:
            return True
    return False


def has_unstaged_changes(status_lines: list[str]) -> bool:
    """True when any status line still includes unstaged or untracked changes."""
    for line in status_lines:
        if line.startswith("??"):
            return True
        if len(line) >= 2 and line[1] != " ":
            return True
    return False
