# T12A Acceptance

## Acceptance Criteria

### 1. WebDAV 草稿版本可以安全恢复到当前草稿

- `pass`: restore action reads only the draft-category remote index and version files
- `pass`: restore list is rendered newest-first and remains draft-only
- `pass`: selected WebDAV draft version replaces only the current draft
- `pass`: browser-bookmark restore remains out of scope and disabled in this round

### 2. 草稿恢复流程显式且可通过本地备份语义回退

- `pass`: restoring a WebDAV draft version writes `latest-draft-backup` before remote snapshot download begins
- `pass`: invalid remote payloads fail closed and keep the current draft unchanged
- `pass`: restore failure detail now states that the current draft stayed unchanged and the local backup was preserved

## Out-Of-Scope Confirmation

- `pass`: no browser-bookmark restore execution was implemented in `T12A`
- `pass`: no multi-profile WebDAV management was implemented in `T12A`

## Acceptance Gate

- core `T12A` scenarios: `pass`
- P0/P1 known defects in `T12A` scope: `0`
- security scan high-risk evidence: `not run` (`pnpm sonar`)

## Closeout Note

- human manual verification is present
- final post-review human commit for the latest code changes is still pending
