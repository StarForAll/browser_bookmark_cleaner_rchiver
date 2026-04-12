# T10 Retrospective

## Outcome

`T10` delivered the intended scope: WebDAV settings, runtime host permission handling, availability gating, and newest-first status-history behavior.

## What Went Well

- test-first gate caught the placeholder `WebDAV 设置` entry before implementation drifted
- manual validation surfaced real runtime issues that unit tests alone did not cover
- reviewer feedback found several low-cost hardening fixes without forcing scope drift into `T11`

## Issues Found During Delivery

- repeated failure history originally refreshed or resurfaced older entries instead of always keeping the newest action on top
- runtime permission requests initially used an incompatible origin format for Chrome permissions
- WebDAV failure flows needed clearer user-facing wording for manifest-reload and restore-disabled states

## Efficiency Notes

- most rework came from UI/runtime behavior differences discovered only in manual extension testing
- once those behaviors were encoded as component tests, later fixes converged quickly

## Follow-Up Candidates

- evaluate whether the v1 decision to persist WebDAV credentials in `chrome.storage.local` needs a documented security exception or a later hardening task
- revisit provider compatibility strategy if additional WebDAV services show auth / `OPTIONS` quirks in later tasks
- consider extracting WebDAV-specific orchestration out of `App.tsx` before `T11` / `T12` expand the file further

## Workflow Learn

- no separate workflow `learn/` entry was generated in this round
- issues discovered here were product/runtime issues, not Trellis workflow defects
