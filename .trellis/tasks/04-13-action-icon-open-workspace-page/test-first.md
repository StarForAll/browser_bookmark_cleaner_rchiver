# Action Icon Workspace Entry Test-First Gate

## Goal

Freeze the executable gate for opening the workspace page from the extension action icon while preserving the existing `options_ui` entry.

## Scope

- Manifest keeps `options_ui` and adds one background service worker
- Clicking the extension action icon opens the existing workspace page entry
- If a workspace page has already registered itself, the action click focuses that page instead of opening a duplicate tab
- If the registered page is stale or unavailable, the action click falls back to creating a new workspace tab
- The implementation must avoid adding the `tabs` permission

## Out Of Scope In This Gate

- No popup UI
- No changes to bookmark editing, sync, restore, or WebDAV flows
- No multi-workspace-tab arbitration beyond one remembered registered target

## Planned Contract

### Manifest contract

- `public/manifest.json`
  - keeps:
    - `action.default_title`
    - `options_ui.page = 'index.html'`
    - `options_ui.open_in_tab = true`
  - adds:
    - `background.service_worker`
  - must not add:
    - `action.default_popup`
    - `permissions: ['tabs']`

### Workspace page registration contract

- the workspace page calls `chrome.tabs.getCurrent()` from tab context
- when a tab is returned, the page sends one runtime message to register:
  - `tabId`
  - `windowId`
- if no tab context exists, registration becomes a no-op

### Service worker action contract

- when the action icon is clicked:
  - if a registered workspace target exists:
    - focus the target window
    - activate the target tab
    - do not create a new tab
  - if no target exists or focus fails:
    - create a new tab with `chrome.runtime.getURL('index.html')`
    - clear any stale registered target when the failure came from an invalid remembered tab

## Gate Cases

### Manifest and runtime gate

1. Good: manifest keeps `options_ui`, adds `background.service_worker`, and still has no popup
2. Good: manifest does not add `tabs` permission for this feature
3. Good: workspace page self-registers its current tab target when opened in a tab context
4. Good: action click focuses the remembered workspace tab and window without opening a duplicate tab
5. Base: when no workspace tab has registered yet, action click opens a new workspace tab
6. Bad boundary: when the remembered tab is stale, the worker clears the stale target and opens a fresh workspace tab

## Planned Automated Gate

- `src/extensionShellPageEntry.test.tsx`
- `src/features/workspace-entry/application/registerWorkspaceActionTarget.test.ts`
- `src/features/workspace-entry/application/actionWorkspaceServiceWorker.test.ts`
- Command: `pnpm test -- src/extensionShellPageEntry.test.tsx src/features/workspace-entry/application/registerWorkspaceActionTarget.test.ts src/features/workspace-entry/application/actionWorkspaceServiceWorker.test.ts`

## Verification

- Automated gate command: `pnpm test -- src/extensionShellPageEntry.test.tsx src/features/workspace-entry/application/registerWorkspaceActionTarget.test.ts src/features/workspace-entry/application/actionWorkspaceServiceWorker.test.ts`
- Expected current phase result after writing tests only: `fail`
- Manual Chrome verification remains deferred until implementation exists
