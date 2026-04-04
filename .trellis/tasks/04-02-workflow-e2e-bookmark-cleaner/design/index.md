# Design Index

## Scope

This design package translates [docs/PRD.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/docs/PRD.md) into implementation-facing technical constraints, frozen stack decisions, and runtime contracts for the first Chrome-extension release.

## Phase Status

- Status: active design package
- Entry date: 2026-04-02
- Goal: freeze product-shape constraints, technical-selection decisions, runtime contracts, and validation scenarios before `plan`
- 2026-04-03 refresh: Chinese-first visible UI copy is now a hard v1 constraint, and the design package must keep future multilingual expansion possible without restructuring core UI flows
- Current checkpoint: Design Step 2 (functional specifications) is complete after human review; Design Step 3 (discussion-based executable prototype validation against `tmp/ui/`) is complete; Design Step 4 page interaction specs have been re-authored from trusted PRD + Step 2 + Step 3 inputs instead of inheriting prior page-doc content
- 2026-04-04 correction: previously created placeholder engineering files were removed from the repo and are no longer treated as trustworthy baseline evidence; Design Step 5 is therefore focused on stack selection and boundary freezing rather than inheriting any deleted local implementation scaffold
- 2026-04-04 selection update: the user accepted the default recommendations for UI runtime, build tool, graph strategy, graph library, state-management direction, WebDAV integration approach, permission strategy, runtime topology, and the hybrid undo-storage model
- 2026-04-04 workflow gate: after architecture freeze, the project must complete spec-alignment and workflow-adaptation follow-up work; `plan` is blocked until those follow-up items are all completed and the human explicitly confirms entry into `plan`
- Finish-work status for this checkpoint: project-level verification matrix is deferred until architecture and verification commands are frozen; only design-package validation is currently required and has passed

## Plan Entry Gate

`plan` must not start immediately after stack selection freeze.

Before `plan`, the following follow-up work must be completed:

1. align project `.trellis/spec/` with the frozen architecture
2. remove or rewrite placeholder spec content that conflicts with the current project
3. define the real automation-check matrix
4. define project-specific `test-first` inputs
5. adapt project-specific `finish-work`
6. adapt project-specific `record-session`

Rule:

- Even if all six items appear completed, entry into `plan` still requires explicit human confirmation
- No AI agent may treat architecture freeze alone as permission to advance into `plan`

## Mandatory UI Prototyping Reminder

This task has already entered the stage where page structure and interaction comfort matter. Do not keep UI discussion only inside the CLI.

The user must be explicitly reminded to finish a first-pass UI prototype in external design tools before implementation details are frozen.

Recommended wording:

> 现在已经进入需要外部 UI 设计的阶段。请先去 `https://www.uiprompt.site/zh/styles` 选择接近目标的 UI 风格提示词，再把页面目标、关键模块、交互要求和风格提示词一起带到 `https://stitch.withgoogle.com/` 生成首版 UI 原型。原型确认后，再回到当前工作流继续冻结页面结构、组件清单和实现边界。

## Prototype Artifact Boundary

- Generated UI examples are recorded under `/ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/ui`
- Those files are design-reference assets for layout, hierarchy, interaction tone, and visual style only
- Actual product implementation must not copy, import, or evolve the example code in `tmp/ui`
- Engineering work should re-implement the approved UI direction inside the real project codebase with project-specific architecture and constraints

## Evidence Base

Confirmed platform evidence:

- Chrome extension permissions and host access:
  - https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions?hl=en
  - https://developer.chrome.com/docs/extensions/reference/permissions
- Chrome extension APIs:
  - https://developer.chrome.com/docs/extensions/reference/api

Selected implementation evidence:

- Vite multi-page build:
  - https://vite.dev/guide/build.html
- React interactive state patterns:
  - https://react.dev/learn/managing-state
- React Flow node-editor capabilities:
  - https://reactflow.dev/

## Documents

- `BRD.md`: business framing and user-facing design constraints
- `TAD.md`: architecture, runtime boundaries, storage, and build choices
- `DDD.md`: core data structures and invariants
- `IDD.md`: integration contracts for Chrome APIs, WebDAV, and local persistence
- `AID.md`: interaction and UI state design
- `ODD.md`: operational flows, sync, backup, rollback, and failure handling
- `prototype-validation.md`: Step 3 validation record for the existing `tmp/ui/` reference assets

## Module Specs

- `specs/bookmark-graph.md`
- `specs/draft-browser-sync.md`
- `specs/browser-draft-overwrite.md`
- `specs/search-and-focus.md`
- `specs/visual-system.md`
- `specs/webdav-sync.md`
- `specs/history-and-recovery.md`

## Pages

- `pages/visual-direction.md`
- `pages/workspace.md`
- `pages/node-editor.md`
- `pages/create-root.md`
- `pages/create-child.md`
- `pages/webdav-settings.md`
- `pages/restore-version.md`
- `pages/local-backup-recovery.md`
- `pages/overwrite-confirmation.md`
- `pages/status-history.md`
- `pages/system-states.md`

## UI Coverage Checklist

- [x] Main workspace shell and graph canvas
- [x] Visual direction and style boundary from `tmp/ui/`
- [x] Node edit surface
- [x] Empty-state root-create surface
- [x] Create-child surface
- [x] WebDAV settings surface
- [x] Restore/version picker surface
- [x] Local backup recovery surface
- [x] Shared overwrite confirmation surface
- [x] Status-history surface
- [x] Empty / disabled / error state gallery

## Prototype Validation Scenarios

- Main flow:
  - verify that the main workspace is always expressed as the current draft
  - verify that seven explicit action buttons are distinguishable from text alone
  - verify that overwrite-risk actions use one shared confirmation-dialog pattern
  - verify that the bottom-left operation-hint area stays visible without overpowering the graph canvas
- Exception flow:
  - action failure is visible in the status area
  - exception-type differentiation is not required at the prototype-validation level
- Empty-data flow:
  - browser bookmark tree contains no user bookmark nodes
  - status area reflects the empty-data situation
  - the draft workspace still communicates that editing can continue

See `prototype-validation.md` for the final Step 3 discussion result and the required adjustments that replace conflicting prototype semantics.

## UI Prototype Note

If the next step requires visual polishing rather than just technical design, use an external UI tool first:

1. pick a style prompt from `https://www.uiprompt.site/zh/styles`
2. combine that prompt with this task's page goals and interaction rules
3. generate a first-pass workspace prototype in `https://stitch.withgoogle.com/`
4. store the generated reference artifact under `tmp/ui/`
5. bring the confirmed layout back into `design/pages/` and `design/specs/`
6. keep implementation code independent from the prototype code in `tmp/ui/`
