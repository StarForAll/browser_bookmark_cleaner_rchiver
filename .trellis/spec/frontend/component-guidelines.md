# Component Guidelines

> How components are built in this project.

---

## Overview

Components render the extension workspace, collect user intent, and display derived state.

Components are not the system boundary for business rules, persistence, or external side effects.

---

## Component Responsibilities

Allowed responsibilities:

- render draft-derived view data
- display explicit action entry points
- host local interaction state such as temporary input focus or modal visibility
- forward user intent to application actions
- show Chinese-first copy from centralized copy resources
- render decorative graph-only anchors or layout helpers when they stay outside draft truth and interaction semantics

Forbidden responsibilities:

- calling `chrome.bookmarks` directly
- issuing raw WebDAV `fetch` requests
- writing persistence data directly
- deciding overwrite safety, recovery eligibility, or cloud availability rules
- turning decorative graph nodes into hidden interaction surrogates for create, edit, delete, or selection flows

---

## Component Structure

Prefer this order inside a component file:

1. imports
2. props and local helper types
3. component function
4. small render-only helpers when needed

Keep large domain logic, layout mapping, or side-effect coordination outside the component file.

---

## Props Conventions

- use explicit props interfaces
- prefer passing derived view models, ids, flags, and callbacks
- do not pass raw Chrome bookmark payloads or raw WebDAV response objects into presentation components
- keep optional props explicit; avoid overloaded empty-string conventions
- if a component supports both folder and bookmark nodes, use discriminated props or a discriminated view model

---

## Styling Patterns

- preserve the approved editorial workspace direction from the design package
- keep layout and styling decisions aligned with the single-workspace shell
- store reusable copy, spacing intent, and shared visual helpers centrally rather than scattering one-off magic values
- do not copy implementation code from `tmp/ui/`; only align with its design intent
- when graph cards use per-depth typography or padding variants, keep the render layout height and the visible card min-height in sync; otherwise contained node shells can clip root-level bookmark cards even when nested cards still look correct
- page-level viewport helpers such as a back-to-top control must not compete with the canvas status corner; if the status popover or status anchor occupies the lower-right viewport edge, place the helper in a different corner or add explicit collision-avoidance logic

---

## Accessibility

- every visible action button needs clear Chinese text
- modal and drawer flows must preserve focus order and keyboard escape behavior
- destructive or overwrite-risk actions must not rely on hover-only explanation
- keyboard-driven actions such as `Enter`, `Delete / Backspace`, and `Ctrl+Z` must remain consistent with the operation hint panel
- decorative graph anchors such as virtual root nodes may be visible, but they must stay non-focusable and non-interactive as node controls; if a separate drag-only drop zone is added for top-level reordering, it must not add click, focus, or keyboard semantics to the anchor itself

## Canvas Viewport Safety

- visual discoverability fixes must not silently reset `scrollLeft`, `scrollTop`, or viewport focus after node create, edit, delete, or layout refresh
- if a canvas needs recentering or refocusing, it must be tied to an explicit user action such as a dedicated "定位到节点" command
- graph-only layout effects may derive visible subsets from the current viewport, but they must preserve the user's existing browsing position

---

## Common Mistakes

- embedding overwrite confirmation logic directly inside a button component
- mixing draft-only edits with browser-write side effects in a modal component
- scattering inline Chinese strings through many components
- treating graph-library node objects as the primary business data model
- fixing node visibility by adding an unconditional `useEffect` scroll reset that snaps the canvas back to the top-left corner
