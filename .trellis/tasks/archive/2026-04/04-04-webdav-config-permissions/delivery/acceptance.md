# T10 Acceptance

## Acceptance Criteria

### 1. WebDAV availability can be determined explicitly

- `pass`: settings dialog exposes dedicated `测试可用性`
- `pass`: runtime host permission is requested on demand
- `pass`: availability success writes a status-history entry
- `pass`: availability failure writes a newest-first failure entry

### 2. Cloud actions remain gated behind valid config and permission

- `pass`: save alone does not unlock cloud actions
- `pass`: upload actions unlock only after valid config + granted permission + successful latest test
- `pass`: restore actions remain disabled in `T10` with an explicit downstream-task reason
- `pass`: repeated failures do not overwrite older entries; newest three remain visible

## Out-Of-Scope Confirmation

- `pass`: no upload execution or version retention implemented
- `pass`: no restore list loading or restore execution implemented

## Acceptance Gate

- core `T10` scenarios: `pass`
- P0/P1 known defects in `T10` scope: `0`
- security scan high-risk evidence: `not run` (`pnpm sonar`)
