# FileChecker

English | [中文](README.zh.md)

[![CI](https://github.com/nanfangtown/file-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/nanfangtown/file-checker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A DSH plugin that puts a visible **Open location** button on every
> delivered-file card. One click reveals the file in the system file manager.

![FileChecker adds a direct Open location button to a delivered-file card](https://raw.githubusercontent.com/nanfangtown/file-checker/main/docs/delivery-card.svg)

## Why

A delivered-file card in DeepSeek Harness can preview the file, but revealing
its folder is buried inside the native-open menu. FileChecker promotes that
gesture to a labelled button that is always visible, so a delivered report,
image, video, or Office document is one click away from Explorer, Finder, or
the Linux file manager.

## What you get

Every `present` delivery card gets an action button with four states:

| State | Label | Notes |
| --- | --- | --- |
| Idle | **Open location** | Calls the card's authenticated reveal gesture |
| Pending | **Opening…** | The Host desktop is handling the request |
| Success | **Located** | Returns to idle after 2 seconds |
| Failure | **Failed** | Returns to idle after 5 seconds; hover shows a retry hint |

- Hidden when the Host reports no usable native desktop, so there is no dead
  button on remote or headless deployments.
- Clicking the button does not trigger the card's preview overlay.
- Follows the DSH light/dark theme through `--dsw-alias-*` tokens.
- Ships Simplified Chinese and English dictionaries.

## Install

### From npm

> The package name is reserved for npm as `filechecker`; until the first
> publish, use the local checkout below.

```bash
dsh plugin add filechecker
```

Or open **Plugins → Add plugin** in the DSH Web UI, enter `filechecker`, and
install the bundle. Enable it if the dialog offers **Enable now**.

### From a local checkout

```bash
git clone https://github.com/nanfangtown/file-checker.git
dsh plugin add /absolute/path/to/file-checker
```

The same local path can be entered in **Plugins → Add plugin**. Profiles with
HMR pick up the new bundle without a restart; a profile without HMR asks for a
restart.

### Verify

Open any session that contains a delivered-file card (a `present` call from
this or a previous turn). The **Open location** button appears to the right of
the file name. Clicking it should open the containing folder and select the
file.

## How it works

The browser half registers one entry in the `deliverables.file.actions` child
slot declared by `@deepseek-ai/dsh-client-ui-deliverables`:

```js
ctx.slots.inject('deliverables.file.actions', () =>
  ctx.slots.register({ name: 'deliverables.file.actions', id: 'filechecker' }, RevealAction)
)
```

The click calls the slot's own `onAction('reveal')`, which posts to the
already-authorized delivery route:

```
POST /api/present.open?sessionId=…&seq=…&index=…&action=reveal
```

That route re-validates the Session, the delivery event, the file coordinates,
and the Host path mapping. FileChecker **does not** add a Host route, copy a
file path into the page, or increase file access authority. The Host half of
the package is an empty `apply()`; it exists only so the bundle mounts and the
client manifest can discover `./client`.

## Compatibility

- Tested with **DSH 0.2.1-rc.2** on Windows 11.
- The reveal itself is cross-platform: it uses the Host's native file-manager
  integration. The plugin UI is browser-side and theme-driven.
- Requires a managed DSH profile. Without a reported native desktop, the action
  hides instead of failing.
- `deliverables.file.actions` is an internal contract of `ui-deliverables`. If
  a future DSH renames or removes that slot, FileChecker needs a matching
  update; the button would disappear rather than throw.

## Development

No dependencies are required:

```bash
git clone https://github.com/nanfangtown/file-checker.git
cd file-checker
node --test
node --check client.js
node --check index.js
```

The offline suite covers the manifest and patch, slot registration, dictionary
parity, unavailable-desktop hiding, pending state, the reveal gesture, style
disposal, and display metadata. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
local-install workflow and pull-request expectations.

## Limitations

- **Delivery cards only.** The changed-files review and the right-sidebar
  document header keep their built-in native controls.
- **The built-in control remains.** FileChecker adds a direct, labelled button
  beside it; it does not replace DSH's native open menu.
- **Generic failure text.** `onAction` returns `revealError` without a reason.
  Missing files and unmapped paths look the same in the button; the Host route
  owns the detailed status.
- **No file contents.** The plugin never reads or copies the delivered file.

## License

[MIT](LICENSE) © nanfangtown
