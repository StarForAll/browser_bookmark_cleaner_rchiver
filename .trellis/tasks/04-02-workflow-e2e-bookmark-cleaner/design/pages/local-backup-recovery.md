# Local Backup Recovery Page

## Purpose

Define the recovery surface for the newest persisted local backup of each target object type.

This surface is separate from WebDAV remote-version restore.

## Entry

- the workspace exposes one unified top-right entry: `undo overwrite operation`
- this entry exists to undo the most recent overwrite consequence, not to act as a generic draft undo
- clicking the entry opens a second-step chooser before any recovery runs
- if neither undo target is available, the entry stays disabled
- when the entry is disabled in v1, hover feedback uses the exact Chinese copy:
  - `当前没有进行覆盖操作，不能进行撤销覆盖操作`

## Recovery Entry Variants

### Undo overwrite on current draft

- restores the newest local draft backup to the current draft

### Undo overwrite on browser bookmarks

- restores the newest local browser backup to browser bookmarks

## Layout

1. Header
   - title
   - close action

2. Target chooser
   - undo overwrite on browser bookmarks
   - undo overwrite on current draft
   - disabled target keeps its unavailable reason on hover

3. Backup summary
   - backup created time
   - source origin
   - source version label when available

4. Availability state
   - available
   - unavailable because no backup exists
   - unavailable because the stored backup is invalid

5. Footer
   - cancel
   - continue to recovery confirmation

## Interaction Rules

- draft-target recovery and browser-target recovery are separate chooser options under one entry
- if only one target has a valid backup, the other target remains disabled inside the chooser
- each target option is disabled when no valid matching backup exists
- target-specific disabled reasons in v1 use object-specific Chinese copy:
  - `当前没有对浏览器书签进行覆盖操作，不能撤销对浏览器书签的覆盖`
  - `当前没有对当前草稿进行覆盖操作，不能撤销对当前草稿的覆盖`
- recovery always requires a dedicated recovery confirmation prompt before execution
- successful local backup recovery does not create a new persisted local backup slot

## Result Rules

### Undo overwrite on current draft

- replaces the current draft with the stored draft backup
- browser bookmarks remain unchanged

### Undo overwrite on browser bookmarks

- writes the stored browser backup back to browser bookmarks
- browser-target warning must remain explicit because `Ctrl+Z` does not revert browser writes

## Confirmation Rules

- local backup recovery does not reuse the WebDAV restore picker
- local backup recovery uses a dedicated recovery-confirmation prompt instead of the shared four-action overwrite dialog
- draft-target confirmation must clearly state that the current draft will be replaced by the stored local draft backup
- browser-target confirmation must clearly state that current browser bookmarks will be replaced by the stored local browser backup
- browser-backup confirmation must remind the user that `Ctrl+Z` does not revert completed browser writes

## Status Rules

- completed recovery writes one entry into the status history
- failed recovery writes one entry with short failure reason

## Copy Rules

- all labels, availability text, warnings, and actions use Chinese in v1
- the top-right entry label should follow the user-facing meaning of undoing an overwrite rather than exposing storage terminology
