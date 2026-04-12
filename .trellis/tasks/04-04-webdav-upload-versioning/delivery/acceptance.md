# T11 Acceptance

## Acceptance Criteria

### 1. Draft and browser uploads are stored under separate retained version sets

- `pass`: draft upload writes under `/bookmark-extension-data/drafts/`
- `pass`: browser bookmark upload writes under `/bookmark-extension-data/bookmarks/`
- `pass`: upload actions remain explicit top-shell actions and do not absorb restore semantics

### 2. Retention policy keeps only the latest five versions per object type

- `pass`: upload orchestration prunes retained version metadata to newest five items per category
- `pass`: cleanup failure is surfaced as `partial-success` rather than silent success

### 3. Permission and provider compatibility boundaries remain correct

- `pass`: runtime host permission is revalidated after external revocation and upload buttons are re-disabled
- `pass`: endpoint normalization handles trailing-slash and non-trailing-slash WebDAV URLs consistently
- `pass`: current provider-specific `PROPFIND` / `MKCOL` / `PUT` compatibility path is covered by automated regression tests and manual verification

## Out-Of-Scope Confirmation

- `pass`: no restore list loading or restore execution implemented in `T11`
- `pass`: no multi-profile WebDAV management implemented in `T11`

## Acceptance Gate

- core `T11` scenarios: `pass`
- P0/P1 known defects in `T11` scope: `0`
- security scan high-risk evidence: `not run` (`pnpm sonar`)
