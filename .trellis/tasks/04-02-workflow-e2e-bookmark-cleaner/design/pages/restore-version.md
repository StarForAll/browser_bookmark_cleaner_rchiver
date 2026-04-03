# Restore Version Page

## Purpose

Define the remote-version picker used for WebDAV-based restore flows.

This surface is used only for remote version restore. It does not cover local backup recovery.

## Entry Variants

### Draft restore entry

- opened from the dedicated action: restore a WebDAV draft version to the current draft
- lists draft versions only
- the restore target is fixed to the current draft

### Browser restore entry

- opened from the dedicated action: restore a WebDAV bookmark version to browser bookmarks
- lists bookmark versions only
- the restore target is fixed to browser bookmarks

## Layout

1. Header
   - flow-specific title
   - close action

2. Current target summary
   - restore target
   - overwrite notice
   - local backup reminder

3. Version list
   - version time
   - short label when available
   - source type tag

4. Footer
   - cancel
   - continue to confirmation

## Interaction Rules

- one surface handles one fixed restore path only
- the user never picks arbitrary source-target combinations here
- selecting a version enables the continue action
- continue opens the shared overwrite-confirmation dialog
- restore execution does not start directly from the list without confirmation
- before final overwrite, the system must create the matching local latest backup

## Result Rules

### Draft restore

- overwrites the current draft
- does not directly mutate browser bookmarks
- on success, resets draft content to the selected remote draft version

### Browser restore

- overwrites current browser bookmarks
- does not rebuild the current draft automatically unless a later explicit action is used
- on success, the browser backup slot remains recoverable through local backup recovery

## Warning Rules

- the UI must state that restore is overwrite-based
- the UI must state that a local latest backup is created automatically before overwrite
- browser restore warning must feel stronger than draft restore warning

## Status Rules

- success or failure is recorded only after execution finishes
- result entries go into the bottom-right status history
- failed entries include a short failure reason

## Copy Rules

- all labels, overwrite warnings, backup reminders, and actions use Chinese in v1
