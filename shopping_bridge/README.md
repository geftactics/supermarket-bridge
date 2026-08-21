# shopping-bridge

Local bridge from a Home Assistant todo shopping list to a Sainsbury's basket.

The bridge is designed so it can run locally now and later be packaged as a Home
Assistant App. It keeps supermarket session/state outside Home Assistant.

## Local setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Log in to Sainsbury's once:

```bash
npm run login:sainsburys -- --email you@example.com --password 'your-password'
```

The Sainsbury's session is saved by `open-supermarkets` in
`~/.sainsburys/session.json`. Keep that directory persistent when this becomes
a Home Assistant App.

## Safe local test

Dry-run is on by default, so this will pick a product but will not add to basket:

```bash
npm run test:item -- "Bananas"
```

To test against your HA todo list:

```bash
HA_URL=http://homeassistant.local:8123 HA_TOKEN=... npm run test:ha
```

To actually add to basket:

```bash
BRIDGE_DRY_RUN=false npm run test:item -- "Bananas"
```

## Preferred products

Create `config/preferred-products.json` to force common shopping-list terms to
specific Sainsbury's product IDs before favourites/search:

```json
{
  "bananas": ["7430790", "1196757"],
  "bacon": ["8123900", "8123902", "7640075"]
}
```

In Home Assistant App options, the same preferences are entered as:

```yaml
preferred_products:
  - term: bananas
    product_ids:
      - "7430790"
      - "1196757"
  - term: bacon
    product_ids:
      - "8123900"
      - "8123902"
      - "7640075"
```

The bridge tries IDs in order and uses the first in-stock product. If no
preferred product is usable, it falls back to favourites and then search.

## Run the webhook server

```bash
npm start
```

Then POST:

```bash
curl -X POST http://127.0.0.1:8124/ha/todo-added \
  -H 'content-type: application/json' \
  -d '{"uid":"manual-bananas","summary":"Bananas"}'
```

## Home Assistant automation shape

Use a native todo trigger and queue runs so basket writes stay sequential:

```yaml
triggers:
  - trigger: todo.item_added
    target:
      entity_id: todo.shopping_list
actions:
  - action: rest_command.shopping_bridge_todo_added
    data:
      uid: "{{ trigger.item.uid }}"
      summary: "{{ trigger.item.summary }}"
mode: queued
```

The exact `trigger.item` payload can vary by Home Assistant version. If it only
sends a UID, the bridge can fetch the list from HA when `HA_URL` and `HA_TOKEN`
are configured.

## App packaging notes

The runtime needs:

- Node 18+
- Chromium installed for Playwright login
- persistent `/data` for bridge state
- persistent Sainsbury's session storage, ideally mapped to the app user's home
- env vars or app options for `HA_URL`, `HA_TOKEN`, and Sainsbury's credentials

Do not automate checkout. This bridge only adds items to the basket.

## Home Assistant App

This repository root is also shaped as a local Home Assistant App folder:

- `config.yaml` defines App options.
- `Dockerfile` builds the Node/Playwright runtime.
- `src/addon-runner.js` reads `/data/options.json` and starts the bridge.

For the App runtime, `/data` is persistent and used for:

- `/data/state.json`
- `/data/preferred-products.json`
- `/data/.sainsburys/session.json`

The service listens on port `8124` inside the App.
