# Overwrite Confirmation Page

## Purpose

Define the shared confirmation surface reused by all overwrite-risk actions.

## Covered Actions

1. overwrite current draft from browser bookmarks
2. sync current draft to browser bookmarks
3. restore a WebDAV draft version to the current draft
4. restore a WebDAV bookmark version to browser bookmarks

## Shared Layout

1. Header
   - action-specific title

2. Source and target summary
   - source object
   - target object
   - overwrite statement

3. Impact block
   - what will be replaced
   - what will stay unchanged
   - local backup reminder

4. Footer
   - cancel
   - confirm

## Required Wording Rules

- one shared structure is reused for all four actions
- the text changes per action, but the dialog skeleton does not
- draft-target actions must state that current draft content will be replaced
- browser-target actions must state that current browser bookmarks will be overwritten
- browser-target actions must remind the user that `Ctrl+Z` does not revert completed browser writes

## Execution Rules

- execution starts only after confirm
- cancel closes the surface without changing draft, browser data, or WebDAV data
- confirm leads into backup generation and then the actual overwrite flow

## Copy Rules

- all warning text and button labels use Chinese in v1
- the warning should be explicit, short, and not vague
