# Changelog

All notable changes to **FileChecker** are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-19

### Added

- A labelled **Open location** action on every delivered-file card, registered
  through the `deliverables.file.actions` child slot of `ui-deliverables`.
- One-click reveal through the card owner's existing authenticated
  `onAction('reveal')` gesture (`POST /api/present.open?…&action=reveal`).
- Idle, pending, success, and failure states with accessible labels.
- Simplified Chinese and English UI dictionaries; metadata for the DSH plugin
  manager in `locale/zh.json` and `locale/en.json`.
- Hiding the action when the Host reports no usable desktop.
- Offline tests covering the manifest and package metadata, slot registration,
  dictionary parity, unavailable-desktop behavior, pending state, the reveal
  gesture, style ownership/disposal, the Host export, and display metadata.
- CI for Node 22/24 on Ubuntu and Windows plus an npm package-content check.

### Security

- No new Host route, no file path copied to the page, and no extra file
  authority. The reveal gesture is re-authorized by the existing
  `ui-deliverables` route on every request.

[1.0.0]: https://github.com/nanfangtown/file-checker/releases/tag/v1.0.0
