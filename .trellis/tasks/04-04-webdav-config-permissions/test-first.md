# T10 Test-First Gate

## Goal

Freeze the executable WebDAV configuration, host-permission, and availability gate for `T10` before implementation.

## Scope

- `WebDAV 设置` entry availability
- WebDAV profile save flow for the single v1 profile
- On-demand host permission request for the configured endpoint origin
- Availability-test result driving cloud upload readiness

## Out Of Scope In This Gate

- WebDAV upload execution, manifest writes, or version retention
- Remote version listing or restore execution
- Multi-profile WebDAV management

These boundaries belong to downstream tasks, especially `T11`, `T12A`, and `T12B`.

## Planned Contract

App and persistence behavior must distinguish at least:

```ts
type WebdavProfile = {
  endpointUrl: string;
  username: string;
  password: string;
};

type WebdavPermissionState = {
  origin: string;
  granted: boolean;
};

type WebdavAvailabilityState = {
  status: 'untested' | 'success' | 'error';
  checkedAt: string | null;
};
```

Expected behavior:

- `WebDAV 设置`
  - stays available even when no editable draft exists
  - exposes one settings surface with `WebDAV URL`, `用户名`, `密码`, `测试可用性`, and `保存设置`
- saving a valid profile
  - persists the sensitive WebDAV profile locally
  - does not imply that host permission or connectivity already passed
  - keeps cloud upload actions disabled until availability is confirmed
- testing availability
  - requests host permission on demand for the configured endpoint origin
  - keeps upload actions disabled when permission is denied or connectivity fails
  - enables upload actions only after valid config, granted permission, and a successful latest test result
- restore actions
  - remain disabled in `T10` because remote version loading and target validation belong to downstream tasks
- failed availability test
  - writes one completed status-history entry with a short failure reason
  - must not leak password or other secret-bearing config values into visible result text

## Gate Cases

### App interaction gate

1. Good: `WebDAV 设置` opens the settings surface, valid save persists the profile, and upload actions remain disabled because save alone does not imply availability success
2. Good: a successful availability test requests host permission for the configured origin and enables WebDAV upload actions only after permission grant plus successful test
3. Base: restore actions remain disabled after availability success because remote version loading is still out of scope for `T10`
4. Bad boundary: a failed availability test keeps upload actions disabled and records one failure history entry without exposing secret-bearing values

### Deferred boundary

1. Deferred to `T11`: actual upload execution and version-manifest writes
2. Deferred to `T11` / `T12*`: remote version list loading and restore-target gating
3. Deferred to later verification / closeout: real Chrome extension runtime connectivity smoke test

## Planned Automated Gate

- `src/app/App.webdavAvailabilityGate.test.tsx`
- Command: `pnpm test -- --run src/app/App.webdavAvailabilityGate.test.tsx`

## Verification

- Automated gate command: `pnpm test -- --run src/app/App.webdavAvailabilityGate.test.tsx`
- Expected current phase result after writing tests only: `fail`
- Manual Chrome extension verification remains deferred until implementation exists
