# Create Child Page

## Purpose

Define the draft-only create-child flow opened from `Enter` on the currently selected node.

This surface exists to add one new child node under the selected parent without leaving the graph workspace.

## Entry

- opened only when a node is currently selected
- triggered by `Enter`
- always creates a child under the selected parent node
- this surface is not used for creating the very first root node in an empty draft
- does not write to browser bookmarks
- does not create WebDAV versions

## Layout

1. Header
   - title
   - close action

2. Parent context block
   - selected parent title
   - parent node type
   - parent full path

3. Node type section
   - folder option
   - bookmark option

4. Form section
   - title field
   - URL field when bookmark type is selected

5. Footer
   - cancel
   - create

## Interaction Rules

- default focus lands on the title field
- switching node type updates visible fields immediately
- folder type hides or disables URL input
- bookmark type requires URL input before submit
- parent context stays visible during the whole flow
- successful submit persists the current draft session
- successful submit keeps the user inside the draft workspace
- create success does not create a status-history entry
- failed create validation is shown inline and does not create a status-history record

Current implementation note:

- dedicated undo-history entry creation remains future task scope

## Validation Rules

### Folder child

- required:
  - title
- forbidden:
  - URL

### Bookmark child

- required:
  - title
  - URL
- URL must not be empty

## Success Result

- the new node appears under the selected parent
- the graph remains in draft mode
- browser bookmarks remain unchanged
- the status-result area remains reserved for explicit overwrite, sync, upload, restore, recovery, and availability-test results

## Failure Result

- invalid input keeps the dialog open
- parent context remains visible
- the current draft stays unchanged

## Copy Rules

- all labels, type descriptions, validation copy, and actions use Chinese in v1
- wording should make it obvious that this flow creates a child in the current draft only
