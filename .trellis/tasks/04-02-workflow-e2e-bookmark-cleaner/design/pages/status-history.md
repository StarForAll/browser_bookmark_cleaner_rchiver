# Status History Page

## Purpose

Define the canvas-aware bottom-right result popup and newest-three history pattern.

Current implementation snapshot:

- popup open / close state is persisted locally
- newest-three history is persisted locally and rendered inside the popup
- current real history producers are still startup/bootstrap completion results; later sync, restore, and upload actions remain future-task scope

## Layout

1. Status-history popup
   - floats against the visible canvas bottom-right corner
   - newest three completed entries
   - newest first
   - each entry includes action description, action time, result, and short failure reason when needed
   - close action

2. Reopen anchor
   - stays at the same bottom-right canvas anchor after the popup closes
   - visible after popup close
   - reopens the history popup

## Entry Rules

- a new entry is created only after an action completes
- in-progress actions do not yet create a completed entry
- both success and failure entries are retained
- only the newest three entries remain visible
- routine draft editing actions do not enter this history

## Display Rules

- newest entry appears first
- failed entries show a short failure reason
- entries use concise, readable action descriptions
- the popup can be dismissed without deleting stored history

## Covered Actions

- workspace startup initialization
- overwrite current draft from browser bookmarks
- sync current draft to browser bookmarks
- upload current draft to WebDAV
- upload current browser bookmarks to WebDAV
- restore a WebDAV draft version to the current draft
- restore a WebDAV bookmark version to browser bookmarks
- undo overwrite on current draft
- undo overwrite on browser bookmarks
- WebDAV availability test

## Copy Rules

- all visible result text uses Chinese in v1
- entries should make the action understandable without extra decoding
