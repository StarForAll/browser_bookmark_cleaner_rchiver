# Hook Guidelines

> How hooks are used in this project.

---

## Overview

Hooks support UI composition, selector binding, keyboard wiring, and small local interaction state.

Hooks are not the primary home for browser adapters, WebDAV transport, persistence policy, or complex overwrite orchestration.

---

## Custom Hook Patterns

Good hook use cases:

- binding centralized state selectors to a feature surface
- mapping derived draft data into render-ready view props
- wiring keyboard shortcuts to explicit application actions
- managing local modal open or focus behavior

Avoid using hooks as hidden service layers.

If a flow needs backup generation, external writes, confirmation gating, error mapping, or serial execution control, keep that flow in application orchestration code and let the hook only call it.

---

## Data Fetching and Side Effects

- v1 does not use a reactive server-cache library such as React Query or SWR
- browser reads and writes are explicit user-triggered actions, not generic mount-time data fetching
- WebDAV actions are explicit user-triggered actions, not background refetch loops
- page bootstrap may restore the local session through a dedicated startup path, but external systems should remain opt-in after startup

---

## Naming Conventions

- custom hooks must start with `use`
- name hooks after the feature surface they serve, such as `useWorkspaceShortcuts` or `useBookmarkNodeEditor`
- keep adapter-specific code out of generic hooks like `useUtils` or `useCommonLogic`

---

## Common Mistakes

- hiding irreversible side effects inside `useEffect`
- letting a hook call raw adapters and mutate UI state in the same unstructured block
- triggering browser or WebDAV reads automatically when the requirement says the action must stay explicit
- creating catch-all hooks that couple unrelated workspace concerns
