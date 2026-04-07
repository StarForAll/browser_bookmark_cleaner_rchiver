# Status History Page

## Purpose

Define the canvas-side result popup and retained history entry pattern.

Current implementation snapshot:

- popup open / close state is persisted locally
- the latest startup result is persisted locally
- retained multi-entry history is still future task scope; the current implementation shows the latest persisted entry only

## Layout

1. Latest-result popup
   - action description
   - action time
   - result
   - short failure reason when needed
   - close action

2. Retained history list
   - newest three completed entries
   - newest first

3. Reopen anchor
   - visible after popup close
   - reopens the retained history popup

## Entry Rules

- a new entry is created only after an action completes
- in-progress actions do not yet create a completed entry
- both success and failure entries are retained
- only the newest three entries remain visible in retained history
- routine draft editing actions do not enter this retained history

## Display Rules

- newest entry appears first
- failed entries show a short failure reason
- entries use concise, readable action descriptions
- the popup can be dismissed without deleting retained history

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
