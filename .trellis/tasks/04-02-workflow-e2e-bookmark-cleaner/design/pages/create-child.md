# Create Child Page

## Purpose

Define the create-child flow opened from `Enter` on the selected node.

## Layout

- first block: selected parent summary
- second block: node type selector
- third block: create form
- footer: cancel / create

## Required Inputs

- node type:
  - folder
  - bookmark
- title
- URL when bookmark is selected

## Validation Rules

- folder creation must not accept URL
- bookmark creation requires non-empty URL
- parent context stays visible so the user understands where the new node will be inserted

## Interaction Rules

- default focus lands on the title field
- type switching updates visible fields immediately
- create action mutates draft only

## Visual Notes

- the parent summary should be secondary but always visible
- type selector should be obvious enough to avoid user confusion
- the create flow should feel quicker and lighter than the edit flow
