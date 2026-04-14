# Node Editor Page

## Purpose

Define the draft-only editor opened by double-clicking an existing node in the graph.

This surface edits the current draft node only. It never mutates browser bookmarks directly.

## Entry

- opened from double click on one node
- can edit folder nodes and bookmark nodes
- node type is visible but cannot be changed

## Layout

1. Header
   - title
   - close action

2. Node summary block
   - current node title
   - node type
   - full path

3. Editable form
   - title field for all nodes
   - URL field for bookmark nodes only

4. Footer
   - cancel
   - save

## Mode Rules

### Folder node

- editable:
  - title
- not editable:
  - URL

### Bookmark node

- editable:
  - title
  - URL
- URL is required

## Interaction Rules

- `Esc` closes without saving
- submit is allowed only when validation passes
- save updates the current draft only
- save success persists the current draft session
- save success does not trigger browser sync
- save success does not create WebDAV versions
- save success does not create a status-history entry
- invalid input stays local to the form and does not create a status-history record

Current implementation note:

- dedicated undo-history entry creation remains future task scope

## Validation Rules

- title is required for all node types
- bookmark URL is required for bookmark nodes
- node type remains locked during the full edit flow

## Success Result

- the edited node updates immediately in the draft graph
- hover information and URL preview refresh if title or URL changed
- browser bookmarks remain unchanged until a later explicit sync action

Current implementation note:

- duplicate calculations remain future task scope

## Failure Result

- invalid input keeps the dialog open
- the current draft remains unchanged

## Copy Rules

- all labels, helper copy, validation messages, and actions use Chinese in v1
- wording should make it obvious that the surface edits the current draft node, not live browser bookmarks
