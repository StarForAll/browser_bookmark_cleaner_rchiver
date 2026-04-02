# Workspace Page

## Purpose

Primary extension page for bookmark graph management.

## Key Regions

- header actions
- search and filter controls
- graph canvas
- hover info
- status bar
- shortcut help surface
- restore/version picker surface
- empty-state hint area

## Primary Actions

- edit node
- create child node
- drag node
- delete node
- sync bookmarks to browser
- upload bookmarks to WebDAV
- upload draft to WebDAV
- restore from WebDAV
- reset layout
- test WebDAV

## Page States

### Ready state

- bookmark graph is visible
- search, duplicate filter, and shortcuts are immediately usable

### Empty state

- no graph nodes are shown
- the page explains that there are no current bookmark nodes to render
- the user can still create a draft node or refresh the browser snapshot

### Cloud-disabled state

- WebDAV actions stay visible but disabled
- the page shows whether the blocker is missing config, missing host permission, or failed test

### Error state

- graph stays mounted when possible
- action-level failures are shown near the action and mirrored in the status bar

## UX Notes

- shortcuts must stay visible
- duplicate information should stay readable without exposing internal identifiers
- destructive and remote actions need explicit confirmation or explicit status feedback
- browser sync warning must be visually stronger than routine cloud upload feedback

## External Prototype Handoff

Before visual implementation starts, produce a first-pass external prototype for this page.

- first choose a style prompt from `https://www.uiprompt.site/zh/styles`
- then generate the workspace prototype in `https://stitch.withgoogle.com/`
- store the generated UI example under `tmp/ui/`
- treat `tmp/ui/` as style-reference-only assets
- do not reuse or adapt the prototype code directly in actual implementation
- after that, sync the confirmed layout, regions, and component priorities back into this page spec
