# Contributing to FileChecker

Thanks for taking the time to improve FileChecker. This package is deliberately
small: a Host row with an empty `apply` and one browser action. Please keep it
that way unless a change clearly needs more.

## Requirements

- Node.js **22.15 or newer** (the test suite uses `node --test`).
- A DSH installation with a managed profile for manual testing.

## Development

```bash
git clone https://github.com/nanfangtown/file-checker.git
cd file-checker
node --test
node --check client.js
node --check index.js
```

There are no runtime or development dependencies, so no install step is needed.

### Try it in DSH

Install the checkout as a local bundle from the DSH **Plugins → Add plugin**
dialog, or with the CLI:

```bash
dsh plugin add /absolute/path/to/file-checker
```

Profiles with HMR pick up the new bundle without a restart. A profile without
HMR asks for a restart. Open a session that already contains a delivered-file
card; the **Open location** button should appear on its right side.

To remove the local bundle, use **Plugins → Installed plugins → FileChecker →
Remove** (or the equivalent `dsh plugin` command).

## Pull requests

- Keep the public surface small: one action, one slot, no Host route.
- Do not import DSH Client packages from `client.js`; the client factory may
  only `require('react')` and use the context services it injects.
- Use `--dsw-alias-*` theme tokens instead of literal colors in UI chrome.
- Add or update an offline test for behavior changes.
- Run `node --test`, `node --check client.js`, and `node --check index.js`
  before opening the pull request.
- Describe the user-visible behavior and the verification you performed.

## Commit messages

Short imperative subjects are preferred, for example:

```
Add pending state to the reveal action
Fix dictionary parity test
Document the Windows verification
```

## License

By contributing, you agree that your contributions are licensed under the
repository's [MIT License](LICENSE).
