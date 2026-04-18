# Browser Import Startup

> Executable code-spec for startup bootstrap, browser import, persisted draft restore, startup status reporting, and extension action-icon workspace entry.

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


---

## Scenario: Extension Action Entry And Workspace Refocus

### 1. Scope / Trigger

- Trigger:
  - changing `public/manifest.json` action/background fields
  - changing `src/main.tsx` workspace page bootstrap registration
  - changing `src/service-worker.ts`
  - changing `src/features/workspace-entry/application/registerWorkspaceActionTarget.ts`
  - changing `src/features/workspace-entry/application/actionWorkspaceServiceWorker.ts`
  - changing tests that prove the extension shell entry contract
- This requires code-spec depth because the flow crosses:
  - extension manifest contract
  - extension page bootstrap
  - runtime messaging
  - session-scoped persistence
  - service worker action orchestration

### 2. Signatures

File paths and functions:

- `public/manifest.json`
  - `background.service_worker = 'service-worker.js'`
  - `action.default_title`
  - `options_ui.page = 'index.html'`
  - `options_ui.open_in_tab = true`
- `src/main.tsx`
  - `registerWorkspaceActionTarget() => Promise<void>`
- `src/service-worker.ts`
  - `installWorkspaceActionServiceWorker() => void`
- `src/features/workspace-entry/application/registerWorkspaceActionTarget.ts`
  - `registerWorkspaceActionTarget(dependencies?) => Promise<void>`
- `src/features/workspace-entry/application/actionWorkspaceServiceWorker.ts`
  - `handleWorkspaceActionMessage(message, dependencies?) => Promise<boolean>`
  - `handleWorkspaceActionClick(dependencies?) => Promise<void>`
  - `installWorkspaceActionServiceWorker(dependencies?) => void`

Verification commands:

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### 3. Contracts

#### Manifest contract

- `manifest_version = 3`
- `action`
  - must keep `default_title`
  - must not define `default_popup`
- `background`
  - must define `service_worker = 'service-worker.js'`
- `options_ui`
  - must keep `page = 'index.html'`
  - must keep `open_in_tab = true`
- permissions
  - must keep existing permissions required by the workspace
  - must **not** add `tabs` permission for this feature

#### Workspace registration message contract

```ts
type RegisterWorkspaceActionTargetMessage = {
  type: 'workspace-action-target/register';
  tabId: number;
  windowId: number;
};
```

Rules:

- the workspace page calls `chrome.tabs.getCurrent()` only to discover its own tab context
- if `getCurrent()` returns no tab, registration becomes a no-op
- if `tabId` or `windowId` is missing, registration becomes a no-op
- the registration message is fire-and-forget; the sender does not depend on a payload response
- if the service worker keeps the channel open for async storage work, it must complete the message contract with `sendResponse`; do not return `true` without an eventual response

#### Session storage contract

```ts
const WORKSPACE_ACTION_TARGET_STORAGE_KEY = 'workspace-action-target';

type WorkspaceActionTarget = {
  tabId: number;
  windowId: number;
};
```

Rules:

- the remembered target lives in `chrome.storage.session`
- the remembered target is overwritten by the latest successful registration
- stale targets must be removed when focus/activation fails

#### Action click behavior contract

When the user clicks the extension action icon:

1. read `workspace-action-target` from `chrome.storage.session`
2. if a valid remembered target exists:
   - focus its window
   - activate its tab
   - do not create a duplicate workspace tab
3. if there is no remembered target, or focus/activation fails:
   - remove the stale remembered target when present
   - create a new tab with `chrome.runtime.getURL('index.html')`

### 4. Validation & Error Matrix

| Boundary | Input / Condition | Output | User-visible result |
|---|---|---|---|
| manifest | `action.default_popup` defined | invalid contract | action-click entry breaks because `onClicked` will not fire |
| manifest | `tabs` permission added | invalid contract | install surface expands without need |
| page registration | `chrome.runtime` or `chrome.tabs` missing | no-op | page still renders; action click later falls back to new tab |
| page registration | `chrome.tabs.getCurrent()` returns `undefined` | no-op | page still renders; no remembered target stored |
| message intake | message type mismatch | `false` | ignored message |
| message intake | `storage.session.set` unavailable | `false` | ignored registration; action click later falls back to new tab |
| action click | remembered target exists and focus succeeds | no new tab | action icon refocuses the existing workspace |
| action click | no remembered target exists | create new tab | workspace opens in a new tab |
| action click | remembered target is stale and focus/activation throws | stale key removed, new tab created | workspace still opens successfully |

### 5. Good / Base / Bad Cases

#### Good

- manifest keeps `options_ui`, adds `background.service_worker`, and keeps `default_popup` absent
- workspace page loads in tab context, self-registers `tabId/windowId`, and later action click refocuses that tab
- stale remembered target is cleared and action click falls back to a fresh `index.html` tab

#### Base

- workspace page is opened from `options_ui`
- registration succeeds
- future action clicks refocus the same page

#### Bad

- adding `default_popup` silently disables `action.onClicked`
- adding `tabs` permission just to search for the workspace tab
- registration throws instead of no-op when tab context is absent
- returning `true` from `runtime.onMessage` without ever calling `sendResponse`, causing the workspace bootstrap message channel to close with an error
- stale remembered target causes action click to fail without opening a fresh workspace tab

### 6. Tests Required

Required automated tests:

- `src/extensionShellPageEntry.test.tsx`
  - assert `background.service_worker`
  - assert `options_ui` remains present
  - assert `action.default_popup` is absent
  - assert `tabs` permission is not added
- `src/features/workspace-entry/application/registerWorkspaceActionTarget.test.ts`
  - assert successful registration message with `tabId/windowId`
  - assert no-op when tab context is unavailable
- `src/features/workspace-entry/application/actionWorkspaceServiceWorker.test.ts`
  - assert registration message stores the remembered target
  - assert async registration messages eventually respond through `sendResponse`
  - assert action click refocuses the remembered target
  - assert no remembered target opens a new workspace tab
  - assert stale remembered target is cleared and replaced by new-tab fallback

Manual assertions:

- in real Chrome, clicking the action icon with no workspace open creates one workspace tab
- in real Chrome, clicking the action icon while the workspace tab is already open focuses that tab instead of opening a duplicate one

### 7. Wrong vs Correct

#### Wrong

```ts
chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({ url: chrome.runtime.getURL('index.html') });
});
```

Why wrong:

- this requires `tabs` permission to read tab URLs
- it breaks the lightweight self-registration constraint

#### Correct

```ts
await runtime.sendMessage({
  type: 'workspace-action-target/register',
  tabId,
  windowId,
});

const rememberedTarget = stored[WORKSPACE_ACTION_TARGET_STORAGE_KEY];
if (isWorkspaceActionTarget(rememberedTarget)) {
  try {
    await windows.update(rememberedTarget.windowId, { focused: true });
    await tabs.update(rememberedTarget.tabId, { active: true });
    return;
  } catch {
    await storage.session.remove(WORKSPACE_ACTION_TARGET_STORAGE_KEY);
  }
}

await tabs.create({ active: true, url: runtime.getURL('index.html') });
```

Why correct:

- keeps the manifest permission surface narrow
- preserves existing `options_ui` entry
- handles stale remembered targets safely
