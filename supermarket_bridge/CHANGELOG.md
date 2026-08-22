# Changelog

## 0.1.13

- Add this changelog so Home Assistant can show release notes during updates.

## 0.1.12

- Remove the unused Sainsbury's store number option.
- Document that Sainsbury's auth runs at startup, then only again when a saved
  session is rejected.

## 0.1.11

- Rename the add-on slug to `supermarket_bridge`.
- Update repository metadata for `geftactics/supermarket-bridge`.

## 0.1.10

- Rename the visible add-on name to Supermarket Bridge.
- Default `auto_complete_todo` to `true`.
- Always check Sainsbury's favourites before normal search.
- Remove the `use_favourites` option.
- Add a trolley icon for the Home Assistant add-on store.

## 0.1.9

- Remove dry-run mode.
- Validate the Home Assistant todo entity at startup.
- Log in to Sainsbury's at startup and fail fast if credentials are invalid.
- Simplify the runtime to Home Assistant add-on polling only.

## 0.1.8

- Add timestamped, plain-text logs.
- Redact credentials from logged command output.
- Add `xauth` for Xvfb-backed Sainsbury's login.
