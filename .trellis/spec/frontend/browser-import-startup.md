# Browser Import Startup

> Executable code-spec for startup bootstrap, browser import, persisted draft restore, and startup status reporting.

---

## Scenario: Startup Bootstrap For Browser Import And Local Restore

### 1. Scope / Trigger

- Trigger:
  - changing `bootstrapWorkspace()`
  - changing browser bookmark read/import adapters used during startup
  - changing persisted draft session read/write used during startup
  - changing startup status mapping consumed by `App.tsx`
- This requires code-spec depth because the flow crosses:
  - browser adapter boundary
  - local persistence adapter boundary
  - application orchestration
  - UI status rendering

### 2. Signatures

File paths and functions:

- `src/adapters/browser-bookmarks/readBookmarkTree.ts`
  - `readBrowserBookmarkTree(bookmarksApi?) => Promise<ReadBrowserBookmarkTreeResult>`
- `src/adapters/browser-bookmarks/importToDraft.ts`
  - `importBrowserTreeToDraftGraph(input) => DraftGraphSnapshot`
- `src/adapters/local-persistence/readPersistedDraftSession.ts`
  - `readPersistedDraftSession(storageArea?) => Promise<ReadPersistedDraftSessionResult>`
- `src/adapters/local-persistence/writePersistedDraftSession.ts`
  - `writePersistedDraftSession(session, storageArea?) => Promise<WritePersistedDraftSessionResult>`
- `src/features/browser-sync/application/bootstrapWorkspace.ts`
  - `bootstrapWorkspace(dependencies?) => Promise<WorkspaceBootstrapResult>`
- `src/shared/copy/appShell.ts`
  - `getStartupStatusCopy(input?) => StartupStatusCopy`

Verification commands:

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### 3. Contracts

#### Browser bookmark read result

`ReadBrowserBookmarkTreeResult`

- `loaded`
  - fields:
    - `kind: 'loaded'`
    - `tree: BrowserBookmarkTreeNode[]`
- `unavailable`
  - fields:
    - `kind: 'unavailable'`
- `error`
  - fields:
    - `kind: 'error'`
    - `error: string`

Leaf-node validation:

- bookmark leaves must provide a non-empty `url`
- Chrome structural root `id = '0'` is allowed before normalization

#### Persisted draft session read result

`ReadPersistedDraftSessionResult`

- `restored`
  - `session: PersistedDraftSession`
- `empty`
- `unavailable`
- `error`
  - `error: string`

#### Persisted draft session write result

`WritePersistedDraftSessionResult`

- `saved`
- `unavailable`
- `error`
  - `error: string`

#### Startup bootstrap result

`WorkspaceBootstrapResult`

- `policy: StartupImportPolicy`
- `draftSnapshot: DraftGraphSnapshot | null`
- `statusKey`:
  - `'restored-local-draft'`
  - `'imported-browser-tree'`
  - `'imported-browser-tree-unsaved'`
  - `'await-browser-import'`
  - `'restore-error'`
  - `'browser-read-error'`
- `errorDetail?: string`

`StartupImportPolicy`

- `{ action: 'restore-local-draft', reason: 'persisted-draft-session-exists' }`
- `{ action: 'import-browser-tree', reason: 'no-persisted-draft-session' }`
- `{ action: 'await-browser-import', reason: 'browser-bookmarks-unavailable' | 'persisted-draft-corrupted' | 'browser-bookmark-read-failed' }`

#### UI copy contract

`getStartupStatusCopy(input?)` must map startup state to:

- `action`
- `time`
- `result`
- `detail`
- `canvasSummary`

The default no-result branch must stay neutral. It must not claim bookmark data is empty before bootstrap completes.

### 4. Validation & Error Matrix

| Boundary | Input / Condition | Output | User-visible result |
|---|---|---|---|
| browser read | `chrome.bookmarks` missing | `kind: 'unavailable'` | `await-browser-import` |
| browser read | raw tree validation fails | `kind: 'error'` + adapter error | `browser-read-error` + `errorDetail` |
| browser read | bookmark leaf missing `url` | `kind: 'error'` + validation error | `browser-read-error` + `errorDetail` |
| persisted read | snapshot keys absent | `kind: 'empty'` | continue to browser import path |
| persisted read | snapshot invalid / corrupted | `kind: 'error'` + validation error | `restore-error` + `errorDetail` |
| persisted write | save succeeds | `kind: 'saved'` | `imported-browser-tree` |
| persisted write | storage unavailable | `kind: 'unavailable'` | `imported-browser-tree-unsaved` + localized warning |
| persisted write | storage throws | `kind: 'error'` + error | `imported-browser-tree-unsaved` + `errorDetail` |

### 5. Good / Base / Bad Cases

#### Good

- persisted draft exists
  - startup returns `restored-local-draft`
  - browser read is not called
- no persisted draft, browser tree loads, save succeeds
  - startup returns `imported-browser-tree`
  - imported snapshot is written to local persistence
- no persisted draft, browser tree loads, save fails
  - startup returns `imported-browser-tree-unsaved`
  - UI warns that refresh may lose the imported draft

#### Base

- no persisted draft
- browser API unavailable
- startup returns `await-browser-import`
- no `errorDetail` is required

#### Bad

- persisted draft is corrupted but startup still shows browser-unavailable reason
- browser read error is collapsed into generic waiting copy
- import succeeds but write failure is silently reported as durable success
- bookmark leaf without `url` reaches draft truth normalization
- default startup copy claims “bookmark data is empty” before bootstrap result exists

### 6. Tests Required

Required automated tests:

- `src/adapters/browser-bookmarks/readBookmarkTree.test.ts`
  - assert Chrome root-node acceptance
  - assert leaf bookmark missing `url` becomes adapter error
- `src/adapters/browser-bookmarks/importToDraft.test.ts`
  - assert Chrome structural roots are stripped from normalized draft truth
- `src/adapters/local-persistence/readPersistedDraftSession.test.ts`
  - assert local persisted session restore
- `src/adapters/local-persistence/writePersistedDraftSession.test.ts`
  - assert storage key mapping and unavailable path
- `src/features/browser-sync/application/bootstrapWorkspace.test.ts`
  - assert restore-local-draft short-circuit
  - assert first import persists session
  - assert restore-error path
  - assert browser-read-error path
  - assert imported-browser-tree-unsaved path for `error`
  - assert imported-browser-tree-unsaved path for `unavailable`
- `src/app/App.startup.test.tsx`
  - assert import success startup copy
  - assert unsaved import warning copy

Manual assertions:

- real extension page can import browser bookmarks on first startup
- after first import persists locally, changing browser bookmarks and refreshing restores the persisted local draft instead of re-reading browser data

### 7. Wrong vs Correct

#### Wrong

- read browser bookmarks even when persisted local draft already restored
- swallow adapter/persistence errors and downgrade everything to one generic waiting state
- show success copy after browser import even if local persistence write failed
- keep English-only fallback detail in a Chinese-first startup status path
- allow bookmark leaves without `url` and depend on later persistence validation to catch them

#### Correct

- restore local draft first and do not read browser bookmarks in that branch
- preserve startup error semantics with dedicated `statusKey` values and accurate `policy.reason`
- persist first imported draft immediately
- when persistence write fails, surface `imported-browser-tree-unsaved` and warn refresh may lose the draft
- reject malformed bookmark leaves at the browser adapter boundary
