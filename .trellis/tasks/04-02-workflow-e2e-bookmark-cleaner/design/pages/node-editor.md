# Node Editor Page

## Purpose

Define the modal used for editing an existing node after double click.

## Layout

- modal or centered dialog
- top row: title + close action
- body: form fields
- footer: cancel / save actions

## Folder Mode

- editable fields:
  - title
- hidden or disabled fields:
  - URL
- helper copy:
  - explain that folder nodes only store structure and title

## Bookmark Mode

- editable fields:
  - title
  - URL
- validation:
  - URL required
  - invalid URL shows inline error

## Interaction Rules

- node type is visible but locked
- `Esc` closes without saving
- `Enter` can submit only when validation passes
- save updates draft only; it does not write to browser bookmarks

## Visual Notes

- editing surface should feel focused and quiet
- form density should be moderate, not oversized
- destructive actions do not live in this modal
