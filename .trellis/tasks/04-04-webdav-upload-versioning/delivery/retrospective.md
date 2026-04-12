# T11 Retrospective

## Outcome

`T11` delivered the intended scope: WebDAV upload execution, version retention, provider-compatibility hardening, and runtime permission refresh after external revocation.

## What Went Well

- test-first gates caught the missing upload implementation and later provider-compatibility regressions before they leaked into closeout
- real manual verification exposed provider-specific `PROPFIND` / `MKCOL` / path-resolution differences quickly enough to encode them as stable regression tests
- multi-CLI review converged on one meaningful hardening item instead of expanding the task into restore behavior

## Issues Found During Delivery

- provider-specific WebDAV behavior varied on collection probe/create semantics and forced several rounds of adapter hardening
- the original cloud root directory name exceeded the tested provider's practical directory constraints and had to be shortened to `bookmark-extension-data`
- upload-button enablement originally trusted persisted permission state too much and needed runtime revalidation when permissions changed outside the app

## Efficiency Notes

- most rework came from real provider/runtime behavior rather than from core upload orchestration logic
- once those provider quirks were encoded in adapter and app-level tests, the fix cycle shortened substantially

## Follow-Up Candidates

- consider a future hardening task for richer rollback/error contracts when rollback itself fails during WebDAV upload
- consider recording orphan-version cleanup details when `partial-success` occurs
- evaluate whether a browser-driven permission change event can replace the current focus/visibility refresh heuristic in a later task

## Workflow Learn

- no separate workflow `learn/` entry was generated in this round
- the main friction in this task came from provider/runtime behavior, not from Trellis command routing itself
- no pending `tmp/workflow-feedback-*.md` files remained at delivery time
