# Child Task Draft Catalog

## 目标

为 `T01` 到 `T13` 提供可直接用于后续创建 child task 的草稿内容，包括：

- `task.json` 需要补齐的核心字段草稿
- `prd.md` 的最小首版内容

本文件只提供草稿，不创建 task，不写入任何 child task 目录。

## 使用方式

后续真正创建 child task 时，建议按以下顺序使用：

1. 根据 `TASK-SPLIT-STRATEGY.md` 创建目标 task 目录
2. 参考本文件填写 `description`、`dev_type`、`relatedFiles`、`notes`
3. 按本文件中的对应章节生成 `prd.md`
4. 人工确认后，才允许进入执行阶段

## 通用 notes

所有 child task 在创建后统一追加：

```text
Created from parent task split strategy during pure plan stage. Task exists for later execution and is not started yet.
```

## 草稿总表

| 任务ID | title | slug | dev_type | 主要依赖 |
|-------|-------|------|----------|---------|
| `T01` | `Create Extension Engineering Baseline` | `extension-engineering-baseline` | `frontend` | 无 |
| `T02` | `Freeze UI Reference Constraints` | `ui-reference-constraints` | `docs` | 无 |
| `T03` | `Create Extension Shell And Page Entry` | `extension-shell-page-entry` | `frontend` | `T01` |
| `T04` | `Define Draft Graph Contracts And Local Persistence` | `draft-graph-contracts-persistence` | `frontend` | `T03` |
| `T05` | `Implement Browser Bookmark Import To Draft` | `browser-import-to-draft` | `frontend` | `T04` |
| `T06` | `Implement Graph Basic Editing` | `graph-basic-editing` | `frontend` | `T05` |
| `T07A` | `Implement Graph Drag Move Validation` | `graph-drag-move-validation` | `frontend` | `T06` |
| `T07B` | `Implement Undo History And Ctrl Z` | `undo-history-ctrl-z` | `frontend` | `T06` |
| `T08A` | `Implement Search And Duplicate Focus` | `search-duplicate-focus` | `frontend` | `T07A`, `T07B` |
| `T08B` | `Implement Status Feedback And Disabled States` | `status-feedback-disabled-states` | `frontend` | `T08A` |
| `T09A` | `Implement Browser Overwrite And Sync Confirmation` | `browser-overwrite-sync-confirmation` | `frontend` | `T08B` |
| `T09B` | `Implement Local Backup And Undo Overwrite` | `local-backup-undo-overwrite` | `frontend` | `T09A` |
| `T10` | `Implement WebDAV Configuration And Permissions` | `webdav-config-permissions` | `frontend` | `T08B` |
| `T11` | `Implement WebDAV Upload And Version Retention` | `webdav-upload-versioning` | `frontend` | `T10`, `T05` |
| `T12A` | `Implement WebDAV Draft Restore` | `webdav-draft-restore` | `frontend` | `T11` |
| `T12B` | `Implement WebDAV Browser Restore` | `webdav-browser-restore` | `frontend` | `T11`, `T09B` |
| `T13` | `Run Verification And Prepare Closeout` | `verification-closeout` | `frontend` | `T03` 至 `T12B` |

## T01

### Metadata Draft

- `description`: Freeze the extension engineering baseline and verification commands without implementing product behavior.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/TAD.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/PLAN-01.md`

### PRD Draft

```markdown
# Create Extension Engineering Baseline

## Goal
Freeze the real extension engineering baseline, command matrix, and verification entry points for later implementation tasks.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T01`
- 依赖任务：无
- 主要设计输入：`design/TAD.md`, `PLAN-01.md`

## In Scope
- Freeze package manager, build tool, directory skeleton, and command conventions
- Freeze lint, typecheck, test, and build command expectations
- Align workflow-facing verification assumptions with the selected stack

## Out Of Scope
- No bookmark import logic
- No graph editing logic
- No WebDAV behavior

## Start Conditions
- Parent task remains in pure plan or later receives explicit execution approval for `T01`
- Stack selection is already frozen in design documents

## Waiting Conditions
- Cannot execute while current stage is still pure plan without explicit authorization

## Requirements
- Engineering baseline must be single-source and auditable
- Verification commands must be concrete rather than placeholder wording

## Acceptance Criteria
- [ ] Baseline files and command contracts are clearly defined
- [ ] Later tasks can reference one stable engineering baseline

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

## Technical Notes
- This task establishes infra boundaries only
- This task must not leak into business feature implementation
```

## T02

### Metadata Draft

- `description`: Extract UI reference constraints from tmp/ui without reusing any prototype implementation code.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/visual-system.md`
  - `tmp/ui/`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/PLAN-01A.md`

### PRD Draft

```markdown
# Freeze UI Reference Constraints

## Goal
Convert approved `tmp/ui` reference assets into explicit implementation constraints without copying or evolving prototype code.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T02`
- 依赖任务：无
- 主要设计输入：`design/specs/visual-system.md`, `tmp/ui/`, `PLAN-01A.md`

## In Scope
- Extract layout, tone, hierarchy, and visual-system constraints
- Record what may be inherited and what must not be reused

## Out Of Scope
- No React component implementation
- No CSS implementation
- No runtime asset import from `tmp/ui`

## Start Conditions
- `tmp/ui` reference assets are present and approved as reference-only evidence

## Waiting Conditions
- None at planning level

## Requirements
- Constraints must be implementation-facing, not mood-board-only
- Reuse boundary must be explicit and enforceable

## Acceptance Criteria
- [ ] Allowed inheritance boundary is documented
- [ ] Forbidden code reuse boundary is documented

## Verification Plan
- `not run` in pure plan stage
- Later validation:
  - document review against `tmp/ui`
  - implementation review against the frozen no-reuse boundary

## Technical Notes
- This is a docs-only task
- The output constrains later UI tasks rather than shipping UI by itself
```

## T03

### Metadata Draft

- `description`: Create the MV3 extension shell and page entry without adding bookmark or graph business behavior.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/TAD.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/workspace.md`

### PRD Draft

```markdown
# Create Extension Shell And Page Entry

## Goal
Create the manifest, page entry, and app assembly shell needed to host later bookmark-cleaner functionality.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T03`
- 依赖任务：`T01`
- 主要设计输入：`design/TAD.md`, `design/pages/workspace.md`

## In Scope
- Create MV3 extension shell and standalone page entry
- Create application root and top-level directory boundaries

## Out Of Scope
- No bookmark API integration
- No graph editing
- No sync or restore flows

## Start Conditions
- `T01` baseline is completed

## Waiting Conditions
- Wait for engineering baseline to exist as the real project foundation

## Requirements
- Shell must match selected runtime topology
- Entry structure must support later feature tasks without rework

## Acceptance Criteria
- [ ] Extension page can be loaded from the extension shell
- [ ] App root and module boundaries are stable

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - `pnpm build`
  - manual Chrome load test

## Technical Notes
- This task creates runtime host boundaries only
- Shared copy and entry boundaries should be fixed here
```

## T04

### Metadata Draft

- `description`: Define the normalized draft graph contracts and local persistence boundaries before browser import and editing logic.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/DDD.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md`

### PRD Draft

```markdown
# Define Draft Graph Contracts And Local Persistence

## Goal
Define the single source-of-truth draft graph model and its local persistence boundaries for later UI and sync tasks.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T04`
- 依赖任务：`T03`
- 主要设计输入：`design/DDD.md`, `design/specs/bookmark-graph.md`, `design/specs/history-and-recovery.md`

## In Scope
- Define normalized graph model and schema version
- Define local persistence contract for draft, layout, expand state, and undo history

## Out Of Scope
- No Chrome bookmark import execution
- No graph interaction UI
- No browser writeback or WebDAV

## Start Conditions
- `T03` shell boundaries are stable

## Waiting Conditions
- Cannot finalize contracts before extension runtime shell exists

## Requirements
- Draft graph must be the only editable truth
- Persistence boundaries must distinguish draft truth from browser snapshots

## Acceptance Criteria
- [ ] Domain contracts are explicit and versioned
- [ ] Local persistence contract is stable enough for downstream tasks

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - contract-focused unit tests
  - schema and persistence round-trip checks

## Technical Notes
- This task is domain-contract heavy and should remain UI-light
- Undo storage model must align with the frozen hybrid checkpoint strategy
```

## T05

### Metadata Draft

- `description`: Import browser bookmarks into the normalized draft graph without enabling direct browser writeback.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/IDD.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/draft-browser-sync.md`

### PRD Draft

```markdown
# Implement Browser Bookmark Import To Draft

## Goal
Read the browser bookmark tree and map it into the normalized local draft graph.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T05`
- 依赖任务：`T04`
- 主要设计输入：`design/IDD.md`, `design/specs/bookmark-graph.md`, `design/specs/draft-browser-sync.md`

## In Scope
- Implement Chrome bookmark adapter
- Convert browser tree to normalized draft graph
- Define startup import and restore decision flow

## Out Of Scope
- No editing interactions
- No browser overwrite or sync-back
- No WebDAV upload or restore

## Start Conditions
- `T04` contracts and persistence boundaries are stable

## Waiting Conditions
- Wait for the normalized graph truth to exist

## Requirements
- Import must preserve bookmark tree semantics while normalizing into draft truth
- Startup flow must separate first import from later draft restore

## Acceptance Criteria
- [ ] Browser bookmarks can be converted into editable draft truth
- [ ] Refresh and startup restore policy is deterministic

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - adapter tests
  - normalization tests
  - manual import smoke test

## Technical Notes
- Browser data remains input-only in this task
- Browser and draft objects must stay clearly separated
```

## T06

### Metadata Draft

- `description`: Implement basic graph editing on draft-only state without drag-move or undo history features.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/node-editor.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md`

### PRD Draft

```markdown
# Implement Graph Basic Editing

## Goal
Enable baseline draft editing interactions including selection, editing, child creation, and deletion.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T06`
- 依赖任务：`T05`
- 主要设计输入：`design/AID.md`, `design/pages/node-editor.md`, `design/specs/bookmark-graph.md`

## In Scope
- Selection state
- Double-click edit flow
- Create-child flow
- Delete node and subtree flow

## Out Of Scope
- No drag move
- No undo history
- No browser writeback

## Start Conditions
- `T05` import-to-draft flow is stable

## Waiting Conditions
- Wait for an editable draft graph to exist

## Requirements
- All edits must target draft state only
- Node-type and parent-child constraints must remain valid

## Acceptance Criteria
- [ ] Basic draft editing flow is complete
- [ ] No edit action directly touches browser bookmark state

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - component and interaction tests
  - manual graph editing walkthrough

## Technical Notes
- This task intentionally excludes high-complexity state history concerns
- Prompt area semantics should remain compatible with later tasks
```

## T07A

### Metadata Draft

- `description`: Implement graph drag-move behavior and folder drop validation on draft state.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/bookmark-graph.md`

### PRD Draft

```markdown
# Implement Graph Drag Move Validation

## Goal
Add drag-move interaction and folder drop validation for the draft graph.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T07A`
- 依赖任务：`T06`
- 主要设计输入：`design/AID.md`, `design/specs/bookmark-graph.md`

## In Scope
- Drag-move interaction
- Folder-only drop validation
- Structural invalid-move prevention

## Out Of Scope
- No undo history
- No browser writeback

## Start Conditions
- `T06` basic editing is stable

## Waiting Conditions
- Wait for base graph interaction and selection model to settle

## Requirements
- Move validation must preserve graph invariants
- Invalid moves must be blocked before mutating draft state

## Acceptance Criteria
- [ ] Valid drag moves update draft structure correctly
- [ ] Invalid drops are blocked with consistent feedback

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - interaction tests for valid and invalid moves
  - manual drag-drop walkthrough

## Technical Notes
- This task focuses on structure validation rather than history semantics
```

## T07B

### Metadata Draft

- `description`: Implement draft undo history and Ctrl+Z semantics without expanding into browser or cloud restore behavior.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/ODD.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md`

### PRD Draft

```markdown
# Implement Undo History And Ctrl Z

## Goal
Implement draft-only undo history and keyboard undo semantics for local editing actions.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T07B`
- 依赖任务：`T06`
- 主要设计输入：`design/ODD.md`, `design/specs/history-and-recovery.md`

## In Scope
- Draft history recording
- Ctrl+Z behavior
- Alignment with operation-hint semantics

## Out Of Scope
- No browser overwrite undo
- No WebDAV restore
- No full sync rollback

## Start Conditions
- `T06` editing actions are stable enough to define history events

## Waiting Conditions
- Wait for basic editing action model to stabilize

## Requirements
- Undo must affect draft state only
- Undo storage must align with the frozen hybrid checkpoint strategy

## Acceptance Criteria
- [ ] Ctrl+Z restores prior draft states consistently
- [ ] Undo does not cross the boundary into browser or cloud state

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - history reducer tests
  - keyboard interaction tests

## Technical Notes
- Keep undo semantics separate from overwrite or restore semantics
```

## T08A

### Metadata Draft

- `description`: Implement title and URL search plus duplicate URL focus on the current draft graph.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/search-and-focus.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/workspace.md`

### PRD Draft

```markdown
# Implement Search And Duplicate Focus

## Goal
Enable search and duplicate URL focus flows over the current draft graph.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T08A`
- 依赖任务：`T07A`, `T07B`
- 主要设计输入：`design/specs/search-and-focus.md`, `design/pages/workspace.md`

## In Scope
- Title and URL search
- Duplicate-only mode
- Duplicate focus and hover info

## Out Of Scope
- No status history panel
- No cloud disabled-state explanation

## Start Conditions
- `T07A` and `T07B` are stable enough that search does not fight shared state boundaries

## Waiting Conditions
- Wait for core graph mutation and history semantics to settle

## Requirements
- Duplicate detection must use exact URL equality
- Search and duplicate filters must compose predictably

## Acceptance Criteria
- [ ] Users can locate nodes by title or URL
- [ ] Duplicate URL focus is clear and accurate

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - search state tests
  - duplicate detection tests
  - manual focus walkthrough

## Technical Notes
- This task should remain focused on discovery rather than global action feedback
```

## T08B

### Metadata Draft

- `description`: Implement status feedback, action history, and disabled-state explanation without adding upload or restore execution.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/AID.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/ODD.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/status-history.md`

### PRD Draft

```markdown
# Implement Status Feedback And Disabled States

## Goal
Implement the status area, short action history, and disabled-state explanations for system actions.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T08B`
- 依赖任务：`T08A`
- 主要设计输入：`design/AID.md`, `design/ODD.md`, `design/pages/status-history.md`

## In Scope
- Right-bottom status area
- Latest result entry
- Latest three action-history records
- Disabled-state and failure-reason summaries

## Out Of Scope
- No upload or restore transport logic
- No browser overwrite execution

## Start Conditions
- `T08A` discovery state and workspace focus semantics are stable

## Waiting Conditions
- Wait for search and shared workspace state to be stable enough for feedback layering

## Requirements
- Only explicit system actions should enter history
- Disabled reasons must be user-visible and concise

## Acceptance Criteria
- [ ] Status and failure feedback are clear
- [ ] History is limited to explicit system actions

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - state-display tests
  - manual failure and disabled-state walkthrough

## Technical Notes
- This task should not silently absorb transport implementation work
```

## T09A

### Metadata Draft

- `description`: Implement browser overwrite and sync confirmation flows without adding local backup rollback behavior.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/draft-browser-sync.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/browser-draft-overwrite.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/overwrite-confirmation.md`

### PRD Draft

```markdown
# Implement Browser Overwrite And Sync Confirmation

## Goal
Implement explicit confirmation-driven browser overwrite and sync flows across draft and browser bookmark state.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T09A`
- 依赖任务：`T08B`
- 主要设计输入：`design/specs/draft-browser-sync.md`, `design/specs/browser-draft-overwrite.md`, `design/pages/overwrite-confirmation.md`

## In Scope
- Confirm-before-overwrite flow
- Draft-to-browser sync flow
- Browser-to-draft overwrite flow

## Out Of Scope
- No local backup undo entry
- No WebDAV restore or upload

## Start Conditions
- `T08B` feedback and disabled-state infrastructure is stable

## Waiting Conditions
- Wait for system action feedback semantics to exist

## Requirements
- All overwrite-risk actions must pass through one shared confirmation pattern
- Browser mutations must remain explicit rather than incidental

## Acceptance Criteria
- [ ] Browser-risk actions always require confirmation
- [ ] Sync direction is explicit to the user

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - sync action tests
  - manual overwrite confirmation walkthrough

## Technical Notes
- This task introduces browser mutation but not local rollback semantics
```

## T09B

### Metadata Draft

- `description`: Implement local backup generation and undo-overwrite boundaries without conflating them with Ctrl+Z.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/ODD.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/local-backup-recovery.md`

### PRD Draft

```markdown
# Implement Local Backup And Undo Overwrite

## Goal
Implement local backup generation and the undo-overwrite boundary for browser-risk actions.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T09B`
- 依赖任务：`T09A`
- 主要设计输入：`design/ODD.md`, `design/specs/history-and-recovery.md`, `design/pages/local-backup-recovery.md`

## In Scope
- Pre-overwrite local backup generation
- Unified undo-overwrite entry
- Recovery target distinction

## Out Of Scope
- No cloud restore
- No Ctrl+Z extension into browser state

## Start Conditions
- `T09A` overwrite and sync actions exist

## Waiting Conditions
- Wait for real overwrite actions to define backup timing and object boundaries

## Requirements
- Backup must happen before overwrite-risk actions
- Undo-overwrite must stay separate from draft history undo

## Acceptance Criteria
- [ ] Backup is created before overwrite-risk actions
- [ ] Undo-overwrite boundary is explicit and recoverable

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - backup and restore boundary tests
  - manual overwrite-undo walkthrough

## Technical Notes
- This task is recovery-boundary work, not ordinary draft history work
```

## T10

### Metadata Draft

- `description`: Implement WebDAV configuration, permission, and availability gating without adding upload or restore execution.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/IDD.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/webdav-sync.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/webdav-settings.md`

### PRD Draft

```markdown
# Implement WebDAV Configuration And Permissions

## Goal
Implement WebDAV settings, host permission handling, and capability gating for cloud actions.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T10`
- 依赖任务：`T08B`
- 主要设计输入：`design/IDD.md`, `design/specs/webdav-sync.md`, `design/pages/webdav-settings.md`

## In Scope
- WebDAV configuration storage
- Host permission request and status
- Connectivity test and capability gating

## Out Of Scope
- No upload versioning
- No restore execution

## Start Conditions
- `T08B` disabled-state explanation infrastructure exists

## Waiting Conditions
- Wait for global disabled-state explanation channel to exist

## Requirements
- Host permission should be requested on demand
- Cloud actions must remain globally disabled when config or permission is invalid

## Acceptance Criteria
- [ ] WebDAV availability can be determined explicitly
- [ ] Cloud actions remain gated behind valid config and permission

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - settings and permission tests
  - connectivity smoke test

## Technical Notes
- This task defines cloud availability boundaries before transport actions
```

## T11

### Metadata Draft

- `description`: Implement WebDAV upload and version retention for draft and browser snapshots without adding restore flows.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/ODD.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/webdav-sync.md`

### PRD Draft

```markdown
# Implement WebDAV Upload And Version Retention

## Goal
Implement cloud upload flows and version-retention management for draft and browser snapshots.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T11`
- 依赖任务：`T10`, `T05`
- 主要设计输入：`design/ODD.md`, `design/specs/webdav-sync.md`

## In Scope
- Draft snapshot upload
- Browser snapshot upload
- Index manifest and retention to latest five versions

## Out Of Scope
- No restore execution
- No multi-profile cloud management

## Start Conditions
- `T10` availability gating is complete
- `T05` stable draft and browser snapshot objects exist

## Waiting Conditions
- Wait for both cloud capability gating and stable snapshot object model

## Requirements
- Draft and browser snapshots must remain separated by storage contract
- Version retention must be deterministic and bounded

## Acceptance Criteria
- [ ] Draft and browser uploads are stored under separate retained version sets
- [ ] Retention policy keeps only the latest five versions per object type

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - upload and manifest tests
  - retention pruning tests

## Technical Notes
- This task should not absorb restore semantics
```

## T12A

### Metadata Draft

- `description`: Implement restoring a WebDAV version into the current draft with local backup protection.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/ODD.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/webdav-sync.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/restore-version.md`

### PRD Draft

```markdown
# Implement WebDAV Draft Restore

## Goal
Restore a selected WebDAV version into the current draft while preserving local backup safety.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T12A`
- 依赖任务：`T11`
- 主要设计输入：`design/ODD.md`, `design/specs/webdav-sync.md`, `design/specs/history-and-recovery.md`, `design/pages/restore-version.md`

## In Scope
- Restore selected cloud version into draft
- Pre-restore local backup
- Draft restore confirmation flow

## Out Of Scope
- No browser bookmark restore

## Start Conditions
- `T11` upload and version list semantics are stable

## Waiting Conditions
- Wait for cloud version objects and retention semantics to exist

## Requirements
- Restore must target draft only
- Pre-restore local safety backup must be mandatory

## Acceptance Criteria
- [ ] Cloud version can restore into draft safely
- [ ] Draft restore flow is explicit and reversible through local backup semantics

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - restore-flow tests
  - manual draft restore walkthrough

## Technical Notes
- Keep draft restore separated from browser restore because the blast radius differs
```

## T12B

### Metadata Draft

- `description`: Implement restoring a WebDAV browser snapshot back into browser bookmarks with local backup protection.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/ODD.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/webdav-sync.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/history-and-recovery.md`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/restore-version.md`

### PRD Draft

```markdown
# Implement WebDAV Browser Restore

## Goal
Restore a selected WebDAV browser snapshot back into browser bookmarks with explicit confirmation and local backup protection.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T12B`
- 依赖任务：`T11`, `T09B`
- 主要设计输入：`design/ODD.md`, `design/specs/webdav-sync.md`, `design/specs/history-and-recovery.md`, `design/pages/restore-version.md`

## In Scope
- Restore selected browser snapshot to browser bookmarks
- Pre-restore local backup
- Browser restore confirmation flow

## Out Of Scope
- No draft restore in this task

## Start Conditions
- `T11` cloud snapshot semantics exist
- `T09B` local backup and undo-overwrite boundary exists

## Waiting Conditions
- Wait for both cloud versioning and browser-risk local backup boundary

## Requirements
- Browser restore must be treated as a high-risk overwrite action
- Restore target and confirmation text must remain explicit

## Acceptance Criteria
- [ ] Browser snapshot can be restored with explicit confirmation
- [ ] Local backup is taken before browser restore

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - restore-to-browser tests
  - manual browser restore walkthrough

## Technical Notes
- This task has higher blast radius than draft restore and must stay separate
```

## T13

### Metadata Draft

- `description`: Run the verification matrix and prepare closeout artifacts without expanding the feature scope.
- `relatedFiles`:
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/`
  - `.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/`
  - `.trellis/spec/`

### PRD Draft

```markdown
# Run Verification And Prepare Closeout

## Goal
Run the final verification matrix, perform human acceptance, and prepare the task for finish-work and record-session.

## Inputs
- 父 task：`04-02-workflow-e2e-bookmark-cleaner`
- 对应任务ID：`T13`
- 依赖任务：`T03` 至 `T12B`
- 主要设计输入：全部主设计文档、后续实现结果、验证结果

## In Scope
- Local automated verification matrix
- Manual Chrome extension acceptance walkthrough
- Required document and spec write-back
- Finish-work and record-session preparation

## Out Of Scope
- No new feature implementation
- No silent scope expansion to hide verification failures

## Start Conditions
- All execution tasks are complete

## Waiting Conditions
- Wait for the full product chain to exist

## Requirements
- All verification results must be recorded truthfully as pass, fail, or not run
- Manual acceptance must cover at least one full main flow

## Acceptance Criteria
- [ ] Verification matrix is recorded truthfully
- [ ] Closeout artifacts are ready for finish-work and record-session

## Verification Plan
- `not run` in pure plan stage
- Later execution commands:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - manual Chrome acceptance walkthrough

## Technical Notes
- Verification failure should trigger follow-up work rather than silent patching inside closeout
```

## 本阶段输出边界

本文件只提供 child task 草稿内容，不创建 task，不初始化 context，不进入执行。
