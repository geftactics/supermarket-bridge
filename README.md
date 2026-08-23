# supermarket-bridge

Home Assistant add-on repository for Supermarket Bridge.

Supermarket Bridge polls a Home Assistant todo shopping list and adds matching
items to a Sainsbury's basket. It does not automate checkout.

It pairs well with Home Assistant's built-in Alexa integration, which can expose
an Alexa shopping list as a Home Assistant todo entity. That lets Home Assistant
bridge items added by voice to your supermarket basket. Only Sainsbury's has
been tested.

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
```

## Runtime

Sainsbury's favourites are checked before normal search. If the app cannot find
a suitable favourite, it falls back to normal Sainsbury's search.
