/*! FileChecker — MIT License — https://github.com/nanfangtown/file-checker */
/**
 * FileChecker — Host half.
 *
 * The delivered-file card already authorizes native actions through the
 * authenticated `/api/present.open` route owned by `ui-deliverables`. This
 * plugin deliberately adds no new route and no new file authority: the Host
 * half exists only so the bundle row mounts, which makes the browser manifest
 * discover `./client` and render the one-click reveal button.
 */
export function apply() {}
