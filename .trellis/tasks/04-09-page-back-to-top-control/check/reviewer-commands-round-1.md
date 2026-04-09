# Reviewer Commands Round 1

## Task Summary
- Review the page-level back-to-top control change for regressions after moving the helper from draft scope to whole-page scope.
- Confirm the icon-only rocket button and direct jump-to-top behavior do not break existing floating UI, page scrolling, or accessibility expectations.

## Review Focus
- Bottom-right floating element collision or z-index conflicts
- `window` scroll and resize listener correctness, cleanup, and threshold behavior
- Direct page scroll-to-top contract: no draft mutation, no search-state side effects
- Accessibility of icon-only button: `aria-label`, title, focus visibility, click target
- Test coverage gaps around layout coexistence and viewport edge cases

## Target Paths
- Primary target: `.`
- Key files:
  - [App.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/App.tsx#L418)
  - [app.css](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/app.css#L954)
  - [App.undoHistory.test.tsx](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/app/App.undoHistory.test.tsx#L186)
  - [appShell.ts](/ops/projects/personal/browser_bookmark_cleaner_rchiver/src/shared/copy/appShell.ts#L1)

## Task Metadata
- Task ID: `04-09-page-back-to-top-control`
- Round: `1`
- Task dir: `tmp/multi-cli-review/04-09-page-back-to-top-control`

## Reviewer Commands
```text
/multi-cli-review "Review the page-level back-to-top control change for regressions in floating overlay coexistence, page scroll behavior, icon-only accessibility, and window listener lifecycle. Focus on src/app/App.tsx, src/app/app.css, src/app/App.undoHistory.test.tsx, and src/shared/copy/appShell.ts." . --task-dir tmp/multi-cli-review/04-09-page-back-to-top-control --reviewer-id claude --round 1 --review-focus "长页面右下角浮层冲突、窗口滚动监听边界、整页回顶契约、图标按钮可访问性"

/multi-cli-review "Review the page-level back-to-top control change for regressions in floating overlay coexistence, page scroll behavior, icon-only accessibility, and window listener lifecycle. Focus on src/app/App.tsx, src/app/app.css, src/app/App.undoHistory.test.tsx, and src/shared/copy/appShell.ts." . --task-dir tmp/multi-cli-review/04-09-page-back-to-top-control --reviewer-id opencode --round 1 --review-focus "长页面右下角浮层冲突、窗口滚动监听边界、整页回顶契约、图标按钮可访问性"
```

## Preconditions
- Each target reviewer CLI must have the `multi-cli-review` skill available before running the command.
- Reviewers must not edit code or create directories; this round directory already exists.
