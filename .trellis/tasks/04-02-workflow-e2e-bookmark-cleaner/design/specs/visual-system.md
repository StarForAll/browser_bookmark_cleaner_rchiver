# Visual System Spec

## Goal

Translate the `tmp/ui/` reference into reusable visual rules for the actual product without reusing prototype code.

The implementation effect of real product pages should visibly reference the approved atmosphere and visual outcome shown in `tmp/ui/`, while keeping production code independent from the prototype source.

## Design Reference Boundary

- `tmp/ui/` is a visual and interaction reference asset only
- production code must not copy layout code, component code, or utility code from `tmp/ui/`
- only the following may be reused as design intent:
  - atmosphere
  - spacing rhythm
  - surface hierarchy
  - typography tone
  - control prominence ordering
- actual shipped page effect should stay recognizably aligned with the visual result demonstrated by `tmp/ui/`

## Visual Direction

- editorial workspace
- calm premium productivity
- tactile card surfaces
- airy but not sparse
- visual focus on the graph canvas
- first release is warm-light only, not dark-mode first

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
- freeze typography tone and layout tolerance first; exact font-family selection may be finalized later

## Surface Rules

- main workspace uses layered surfaces instead of one flat panel
- graph node cards should look movable and editable, not static list items
- floating helper panels should stay visually secondary to the graph itself
- browser-sync warning modal should have stronger contrast than routine upload dialogs
- node cards must attract more visual attention than utility rails and status surfaces
- selected, hovered, and actively dragged nodes must remain visually distinguishable without relying on neon or overly saturated accents
- duplicate-path information remains secondary to the node title and graph structure, even when duplicate-only mode is active

## Layout Boundary

- `v1` auto-layout uses a controlled tree layout aligned with bookmark-tree semantics
- re-layout restores a recommended layout without changing graph content or graph meaning
- the layout engine must sit behind a replaceable product-owned interface
- `@xyflow/react` consumes layout results for rendering, but it does not own layout truth
- arbitrary graph-layout engine behavior must not redefine bookmark-tree structure semantics in v1

## Feedback Severity Layers

- routine success feedback:
  - bottom-right result popup
  - retained status-history entry
- routine failure feedback:
  - failed status entry with short failure reason
- high-risk overwrite actions:
  - stronger warning contrast than routine upload or save interactions

## Test Points

- the workspace still reads clearly when all copy is Chinese
- the same layout can accept longer English labels without obvious breakage
- the graph canvas remains the dominant focal area
- sync warning looks more severe than regular save-to-WebDAV interactions
- the real implementation remains visually aligned with the approved `tmp/ui/` reference effect without copying prototype code
- node selection, hover, and drag states are visually distinct while staying within the muted palette
- duplicate-path display stays readable without overpowering node titles
