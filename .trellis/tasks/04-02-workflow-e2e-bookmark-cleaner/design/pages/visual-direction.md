# Visual Direction Page

## Purpose

Freeze the visual and interaction tone that Step 4 page specs must follow.

## Trusted Inputs

- `docs/PRD.md`
- Step 2 design specs
- Step 3 prototype-validation conclusions
- `tmp/ui/` atmosphere only

## Approved Direction

- editorial workspace instead of dashboard
- calm, quiet, tactile, and information-dense
- graph canvas remains the visual center
- utility surfaces stay secondary
- Chinese-first product language replaces any decorative English brand treatment

## Surface Hierarchy

1. Graph canvas
   - primary focal area

2. Node and hover surfaces
   - interactive and movable
   - stronger than utility rails

3. Top action bar and search strip
   - always visible
   - clear but not louder than the graph

4. Bottom-left operation hint area
   - always visible but low-emphasis
   - readable guidance without competing with the graph

5. Bottom-right status popup/history
   - noticeable enough for results
   - visually secondary to active graph editing

## Color and Density Rules

- warm light background only in v1
- muted blue-gray or blue-green accents
- destructive or overwrite actions use stronger warning contrast
- spacing is airy at shell level and tighter inside dense utilities

## Typography Rules

- Chinese copy is first-class, not an afterthought
- typography must remain readable at dense information scales
- layout widths should still tolerate future longer multilingual labels

## Must Avoid

- direct reuse of any `tmp/ui` code
- English-only branding treatment
- admin-panel styling
- making the top action region visually heavier than the graph canvas
