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

Forbidden responsibilities:

- calling `chrome.bookmarks` directly
- issuing raw WebDAV `fetch` requests
- writing persistence data directly
- deciding overwrite safety, recovery eligibility, or cloud availability rules

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

---

## Accessibility

- every visible action button needs clear Chinese text
- modal and drawer flows must preserve focus order and keyboard escape behavior
- destructive or overwrite-risk actions must not rely on hover-only explanation
- keyboard-driven actions such as `Enter`, `Delete / Backspace`, and `Ctrl+Z` must remain consistent with the operation hint panel

---

## Common Mistakes

- embedding overwrite confirmation logic directly inside a button component
- mixing draft-only edits with browser-write side effects in a modal component
- scattering inline Chinese strings through many components
- treating graph-library node objects as the primary business data model
