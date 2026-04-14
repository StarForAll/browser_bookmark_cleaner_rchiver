# WebDAV Settings Page

## Purpose

Define the configuration surface for the single WebDAV profile used in v1.

## Layout

1. Header
   - title
   - close action

2. Credential form
   - endpoint URL
   - username
   - password

3. Action row
   - test availability
   - save settings

4. Result area
   - latest availability result
   - optional detail summary

## Interaction Rules

- save does not imply that connectivity passed
- test availability is a first-class action
- cloud actions remain unavailable until prerequisites and test success are satisfied
- page-level copy may use one generic unavailable expression
- exception-type-specific branching is not required in this page spec

## Success Result

- successful test writes one completed-action entry to the status history
- successful save updates local configuration without implying upload or restore

## Failure Result

- failed test writes one completed-action entry with short failure reason
- failed save or invalid form input keeps the user in the settings surface

## Copy Rules

- all labels, button text, helper copy, and result summaries use Chinese in v1
- wording should remain readable for non-technical users
