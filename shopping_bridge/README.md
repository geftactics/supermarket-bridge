# Supermarket Bridge

Supermarket Bridge polls a Home Assistant todo shopping list and adds matching
items to a Sainsbury's basket. It does not automate checkout.

## Configuration

```yaml
todo_entity: todo.shopping_list
sainsburys_email: ""
sainsburys_password: ""
sainsburys_store_number: "0560"
auto_complete_todo: true
poll_interval_seconds: 30
failed_retry_seconds: 900
preferred_products:
  - term: bananas
    product_ids:
      - "7430790"
      - "1196757"
```

`auto_complete_todo` marks an item complete in Home Assistant after it has been
added to the Sainsbury's basket.

Sainsbury's favourites are always checked before normal search. Preferred
products are checked first.

`failed_retry_seconds` controls how long a failed item waits before the next
retry. This avoids repeating the same failed basket operation every poll.

## Startup

The add-on validates the configured todo entity, logs in to Sainsbury's with
Playwright under Xvfb, and only starts polling after those checks pass. Invalid
Home Assistant access, a missing todo entity, or bad Sainsbury's credentials
cause the add-on to exit so the failure is visible in Home Assistant.

When the Sainsbury's session expires, the add-on logs in again under Xvfb and
retries the basket operation once.

The `/health` endpoint is available on port `8124`.
