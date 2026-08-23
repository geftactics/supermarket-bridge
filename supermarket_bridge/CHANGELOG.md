# Changelog

## 0.1.20

- Change the add-on icon background to orange.
- Trim the root README runtime logging example.

## 0.1.19

- Fix Docker build after removing the preferred-products config directory.

## 0.1.18

- Simplify logs and remove `xvfb` from normal log messages.
- Quote shopping-list item and product names in add logs.
- Remove preferred products from configuration and runtime matching.
- Simplify Home Assistant add-on text around the Alexa shopping-list bridge use
  case.

## 0.1.17

- Search within Sainsbury's favourites using `fav-search` instead of only
  checking the first favourites page.
- Allow shopping-list terms to match inside favourite product words, for
  example `noodles` matching `noodlesoup`.
- Ignore unavailable favourite matches and fall back to search.

## 0.1.16

- Make favourites matching stricter by requiring all shopping-list terms to
  match before choosing a favourite.
- Log when no favourite matches and the add-on falls back to search.

## 0.1.15

- Add `verbose_logs`, defaulting to `false`, to keep Playwright and
  open-supermarkets command output quiet unless diagnostics are needed.
- Add persistent Sainsbury's auth retry limiting: one login attempt every 90
  seconds.

## 0.1.14

- Remove the manual Sainsbury's session JSON option. The add-on logs in at
  startup and persists its own session under `/data/.sainsburys/`.

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
