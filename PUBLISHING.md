# Publishing FileChecker

This repository publishes one npm package and one DSH bundle:

- npm package: **`filechecker`**
- GitHub repository: **`nanfangtown/file-checker`**
- DSH bundle id / plugin id: **`filechecker`**

> `file-checker` (with the hyphen) is already taken on npm. Do not rename the
> package to that name; only the GitHub repository uses the hyphen.

## Preflight

```bash
node --test
node --check client.js
node --check index.js
npm pack --dry-run
```

Confirm the package name is still available:

```bash
npm view filechecker version
```

A `404` / `E404` means the name is free. Stop if the command prints a version
that is not yours.

## Publish

```bash
npm login
npm publish --access public
```

The `prepublishOnly` script runs the tests and syntax checks first. Publishing
is irreversible for that exact version; to ship a fix, bump `version`, update
`CHANGELOG.md`, and publish again.

## Tag and release

```bash
git add -A
git commit -m "Release 1.0.0"
git tag -a v1.0.0 -m "FileChecker 1.0.0"
git push origin main --tags
```

Then create a GitHub release from `v1.0.0` and paste the matching
`CHANGELOG.md` section.

## Post-publish checks

1. `npm view filechecker version` prints the published version.
2. In a clean DSH profile, install it through **Plugins → Add plugin →
   `filechecker`**.
3. Open a session with an existing delivered-file card. The **Open location**
   button should be visible; clicking it should reveal the file in the system
   file manager.
4. Check both Chinese and English UI languages.
5. Verify that a Host without a native desktop hides the action instead of
   showing a dead button.

## What not to commit

- npm authentication tokens or `.npmrc`
- DSH profile state, session logs, or local screenshots containing user data
- `node_modules`, `*.tgz`, or build output

## Repository metadata

Suggested GitHub description:

> A DSH plugin that adds a one-click "Open location" button to delivered-file
> cards.

Suggested topics:

```
dsh
dsh-plugin
deepseek-harness
file-manager
productivity
```

Suggested license: **MIT** (the repository already contains `LICENSE`).
