# T12A Retrospective

## Outcome

`T12A` delivered the intended draft-only WebDAV restore scope: validated draft version loading, backup-before-restore safety, explicit restore confirmation, newest-first picker ordering, and a compact restore dialog presentation.

## What Went Well

- test-first gates exposed the entire missing restore chain early, so implementation stayed inside the frozen `T12A` boundary
- app-shell and application-layer tests split cleanly between data contract validation and user-flow behavior
- review-gate produced only a small number of useful follow-up fixes and did not expand the task into `T12B`

## Issues Found During Delivery

- the first picker presentation repeated version labels and timestamps in a visually noisy way, which required a second UI pass
- the initial compact-option fix made the option rows shorter but left the dialog width too large, so the dialog itself had to be rebalanced
- reviewer feedback surfaced one meaningful implementation issue: confirm-time restore should not re-read the remote index after the user already selected a version

## Efficiency Notes

- most rework in this task came from presentation refinement and review-driven hardening rather than from the core restore orchestration
- once the picker and dialog width were aligned, the UX iteration loop shortened significantly

## Follow-Up Candidates

- `T12B`: browser-bookmark restore flow with the stronger overwrite warning and browser-target backup semantics
- `T13`: decide whether `pnpm sonar` is required before final closeout
- future hardening: if needed later, move shared WebDAV path helpers into one module instead of duplicating them between upload and restore

## Workflow Learn

- no separate workflow `learn/` entry was generated in this round
- the main friction in this task came from final UI proportion tuning and one confirm-time restore hardening item, not from stage routing itself
- no pending `tmp/workflow-feedback-*.md` files were generated in this round
