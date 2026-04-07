# Sync Implementation Changes Into All Related Documentation

## Goal
Synchronize the repository's documentation with the current implementation so that runtime behavior, architecture descriptions, workflow guidance, and code-spec files do not drift from shipped code.

## Requirements
- Detect all documentation surfaces that describe current implementation behavior, not only files under `docs/`.
- Build the documentation update scope from actual code and config evidence in the repository.
- Update all relevant documentation that has drifted from the current implementation.
- Avoid speculative documentation changes for features that are only planned and not implemented.
- Keep `.trellis/spec/` code-spec documents aligned with executable contracts when the implementation reveals stable patterns or behavior.

## Acceptance Criteria
- [ ] A repository-wide documentation inventory is checked against the current implementation.
- [ ] Drifted documents under `docs/`, root markdown files, and `.trellis/spec/` are updated where needed.
- [ ] Documentation statements about startup, bookmark import, state boundaries, persistence, verification, and implemented capabilities match the current code.
- [ ] Planned-but-unimplemented features are not described as already shipped behavior.
- [ ] Verification is run and reported truthfully.

## Technical Notes
- Treat code and tests as the primary evidence source.
- Prefer minimal, targeted documentation edits over broad rewrites.
- Capture any newly discovered stable contract in code-spec docs when it improves future implementation safety.
