# Visual System Spec

## Goal

Translate the `tmp/ui/` reference into reusable visual rules for the actual product without reusing prototype code.

## Design Reference Boundary

- `tmp/ui/` is a visual and interaction reference asset only
- production code must not copy layout code, component code, or utility code from `tmp/ui/`
- only the following may be reused as design intent:
  - atmosphere
  - spacing rhythm
  - surface hierarchy
  - typography tone
  - control prominence ordering

## Visual Direction

- editorial workspace
- calm premium productivity
- tactile card surfaces
- airy but not sparse
- visual focus on the graph canvas

## Color Intent

- primary base: slate / blue-gray / muted blue-green
- canvas background: warm off-white or paper-like neutral
- destructive actions: restrained but unmistakable warning color
- avoid purple-dominant palettes
- avoid flat pure-white enterprise admin styling

## Typography Intent

- Chinese-first UI copy
- heading tone should feel curated and premium, not generic SaaS
- body text should remain highly legible at dense information scales
- component widths must tolerate longer English copy in future

## Surface Rules

- main workspace uses layered surfaces instead of one flat panel
- graph node cards should look movable and editable, not static list items
- floating helper panels should stay visually secondary to the graph itself
- browser-sync warning modal should have stronger contrast than routine upload dialogs

## Test Points

- the workspace still reads clearly when all copy is Chinese
- the same layout can accept longer English labels without obvious breakage
- the graph canvas remains the dominant focal area
- sync warning looks more severe than regular save-to-WebDAV interactions
