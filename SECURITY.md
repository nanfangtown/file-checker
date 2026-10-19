# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Use GitHub's
private vulnerability reporting:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Include the affected version, DSH version, operating system, reproduction
   steps, and the impact you observed.

You will receive an acknowledgement as soon as the report is reviewed. Please
allow time for a fix and a coordinated release before disclosing the issue.

## Scope and design notes

FileChecker is intentionally narrow:

- It does not read, copy, upload, or store file contents.
- It does not resolve paths itself and does not add a Host route.
- It calls the delivered-file card's existing `onAction('reveal')`; the
  `ui-deliverables` route re-validates the Session, delivery event, file
  coordinates, and Host path mapping.
- The action is hidden when the Host reports no native desktop.
- It does not read another plugin's DOM or patch the application root.

Reports about the underlying reveal route, DSH itself, or the Host desktop
should go to the corresponding upstream project.
