# WebDAV Settings Page

## Purpose

Define the settings drawer or modal for configuring the single WebDAV profile.

## Layout

- header: title + close
- credential form:
  - endpoint URL
  - username
  - password
- action row:
  - test availability
  - save settings
- result panel:
  - readable status
  - expandable technical detail when failed

## Interaction Rules

- save does not imply successful connectivity
- test availability is a first-class action
- cloud actions stay disabled until both permission and test prerequisites pass
- the UI must explain whether the blocker is:
  - missing config
  - host permission not granted
  - connectivity/auth failure

## Visual Notes

- this surface should feel operational, not threatening
- failure copy should remain readable for non-technical users
- technical detail should be collapsed by default
