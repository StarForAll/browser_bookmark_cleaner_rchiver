# Restore Version Page

## Purpose

Define the restore picker used for recovering a bookmark snapshot or draft snapshot from WebDAV.

## Layout

- source type switch:
  - bookmark snapshot
  - draft snapshot
- version list:
  - timestamp
  - short label
  - source type tag
- target choice:
  - restore to browser bookmarks
  - restore to current draft
- warning / backup notice
- footer confirm action

## Interaction Rules

- user must make source and target explicit before restore is enabled
- the UI must state that restore is overwrite-based
- the UI must state that a local latest backup is created automatically before overwrite
- final confirm must be more explicit when the target is browser bookmarks

## Visual Notes

- version list should support quick scanning
- warning hierarchy should intensify when browser bookmarks are the restore target
- backup notice should look reassuring rather than punitive
- source labels, target labels, overwrite warnings, and confirm actions use Chinese in v1
