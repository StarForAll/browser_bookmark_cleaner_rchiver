# Document Sonar Script And Project Readme

## Goal
Add a stable `pnpm` Sonar entrypoint, sync current documentation to the script-based workflow, and create a project-level README that accurately reflects the repository's current baseline.

## Requirements
- Add a `package.json` script for the verified SonarScanner command
- Update current verification and development docs to reference the script instead of the raw long command
- Keep `SONAR_TOKEN` as an environment variable, not a committed secret
- Add a root `README.md` covering purpose, current status, commands, and documentation links

## Acceptance Criteria
- [ ] `package.json` exposes a working `pnpm sonar` command
- [ ] Existing docs and finish-work references use `pnpm sonar` consistently
- [ ] Root `README.md` exists and matches current project status
- [ ] `pnpm sonar` is executed and its real result is recorded truthfully

## Technical Notes
- The underlying SonarScanner options remain the verified command that already succeeded against `bbcr`
- Documentation must not claim Sonar always passes; it should only define the command entrypoint and recording rules
