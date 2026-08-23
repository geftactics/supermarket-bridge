# Supermarket Bridge

Supermarket Bridge polls a Home Assistant todo shopping list and adds matching
items to a Sainsbury's basket. It does not automate checkout.

It pairs well with Home Assistant's built-in Alexa integration, which can expose
an Alexa shopping list as a Home Assistant todo entity. That lets Home Assistant
bridge items added by voice to your supermarket basket. Only Sainsbury's has
been tested.

## Configuration

```yaml
todo_entity: todo.shopping_list
sainsburys_email: ""
sainsburys_password: ""
auto_complete_todo: true
poll_interval_seconds: 30
failed_retry_seconds: 900
verbose_logs: false
```

`auto_complete_todo` marks an item complete in Home Assistant after it has been
added to the Sainsbury's basket.

Sainsbury's favourites are checked before normal search.

`failed_retry_seconds` controls how long a failed item waits before the next
retry. Failed Sainsbury's auth is limited to one login attempt every 90 seconds.

`verbose_logs` defaults to `false`; set it to `true` only when you need detailed
Playwright/open-supermarkets output for debugging.
