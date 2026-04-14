# Create Root Page

## Purpose

Define how the user creates the first root node when the current draft has no nodes.

This surface exists to close the empty-state creation path without introducing a dedicated action button.

## Entry

- available only when the current draft has no nodes
- opened from the empty-canvas hint area inside the workspace
- creates one root node in the current draft
- does not read from browser bookmarks
- does not write to browser bookmarks
- does not create WebDAV versions

## Layout

1. Header
   - title
   - close action

2. Empty-state context
   - explanation that browser bookmark data is currently empty
   - explanation that draft creation can still begin locally

3. Node type section
   - folder option
   - bookmark option

4. Form section
   - title field
   - URL field when bookmark type is selected

5. Footer
   - cancel
   - create root node

## Interaction Rules

- this flow is the empty-state counterpart to create-child
- it creates the first root node only
- once at least one root node exists, normal create-child flow handles later additions under selected parents
- successful submit creates one draft-history entry
- successful submit does not create a status-history entry

## Validation Rules

### Root folder

- required:
  - title
- forbidden:
  - URL

### Root bookmark

- required:
  - title
  - URL

## Copy Rules

- all labels, explanations, validation copy, and actions use Chinese in v1
- wording should make it clear that the user is starting a draft from an empty state, not importing browser data
