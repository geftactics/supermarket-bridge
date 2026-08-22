# supermarket-bridge

Home Assistant add-on repository for Supermarket Bridge.

Supermarket Bridge polls a Home Assistant todo shopping list and adds matching
items to a Sainsbury's basket. It does not automate checkout.

## Install

Add this repository to the Home Assistant add-on store:

```text
https://github.com/geftactics/supermarket-bridge
```

Install the `Supermarket Bridge` add-on, then configure:

```yaml
todo_entity: todo.shopping_list
sainsburys_email: ""
sainsburys_password: ""
auto_complete_todo: true
poll_interval_seconds: 30
failed_retry_seconds: 900
verbose_logs: false
preferred_products:
  - term: bananas
    product_ids:
      - "7430790"
      - "1196757"
```

## Runtime

At startup the add-on:

- validates that the configured todo entity exists and is a `todo.*` entity
- logs in to Sainsbury's using Playwright under Xvfb
- exits immediately if Home Assistant access, the todo entity, or Sainsbury's
  credentials are invalid
- starts polling after startup checks pass

After startup, the add-on reuses the saved Sainsbury's session. When that
session expires or is rejected, it logs in again under Xvfb and retries the
basket operation once.

Failed Sainsbury's auth is rate limited to one login attempt every 90 seconds,
persisted in `/data/auth-state.json`, so a bad password or restart loop does
not repeatedly hit Sainsbury's. `verbose_logs` defaults to `false`; set it to
`true` only when you need detailed Playwright/open-supermarkets output for
debugging.

Logs are timestamped, redact credentials, and use plain messages such as:

```text
2026-08-22T09:39:48.967Z ---- supermarket-bridge starting ----
2026-08-22T09:39:51.204Z Polling todo entity 'todo.shopping_list' every 30s.
2026-08-22T09:40:22.811Z Added Bananas -> Sainsbury's Fairtrade Bananas x5 [preferred]
2026-08-22T09:40:52.112Z Skipped Marmite: retry delayed until 2026-08-22T09:55:52.112Z.
```

Processed item state is stored in `/data/state.json`. Preferred product config
is written to `/data/preferred-products.json`. Auth retry state is stored in
`/data/auth-state.json`. Sainsbury's session data is kept under
`/data/.sainsburys/`.

The todo entity is entered as text, for example `todo.shopping_list`. Home
Assistant add-on options do not provide a dynamic entity picker; the add-on
validates the entity at startup and exits if it is missing or not a todo entity.
