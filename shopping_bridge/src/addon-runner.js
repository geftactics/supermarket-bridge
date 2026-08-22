const fs = require('node:fs');
const path = require('node:path');
const { installLogger } = require('./logger');

installLogger();

const optionsFile = '/data/options.json';
const preferredProductsFile = '/data/preferred-products.json';
const sainsburysSessionFile = '/data/.sainsburys/session.json';

function boolString(value, defaultValue) {
  if (value == null) return defaultValue ? 'true' : 'false';
  return value ? 'true' : 'false';
}

if (fs.existsSync(optionsFile)) {
  const options = JSON.parse(fs.readFileSync(optionsFile, 'utf8'));

  process.env.BRIDGE_DRY_RUN = boolString(options.bridge_dry_run, true);
  process.env.TODO_ENTITY = options.todo_entity || 'todo.shopping_list';
  process.env.HA_URL = options.ha_url || process.env.HA_URL || '';
  process.env.HA_TOKEN = options.ha_token || process.env.HA_TOKEN || '';
  process.env.SAINSBURYS_EMAIL = options.sainsburys_email || process.env.SAINSBURYS_EMAIL || '';
  process.env.SAINSBURYS_PASSWORD = options.sainsburys_password || process.env.SAINSBURYS_PASSWORD || '';
  process.env.SUPERMARKET_EMAIL = process.env.SAINSBURYS_EMAIL;
  process.env.SUPERMARKET_PASSWORD = process.env.SAINSBURYS_PASSWORD;
  process.env.SAINSBURYS_STORE_NUMBER = options.sainsburys_store_number || '0560';
  process.env.AUTO_COMPLETE_TODO = boolString(options.auto_complete_todo, false);
  process.env.USE_FAVOURITES = boolString(options.use_favourites, false);
  process.env.POLL_INTERVAL_SECONDS = String(options.poll_interval_seconds ?? 30);
  process.env.FAILED_RETRY_SECONDS = String(options.failed_retry_seconds ?? 900);

  if (options.sainsburys_session_json) {
    writeSessionJson(options.sainsburys_session_json);
  }

  if (options.preferred_products) {
    fs.mkdirSync(path.dirname(preferredProductsFile), { recursive: true });
    fs.writeFileSync(
      preferredProductsFile,
      `${JSON.stringify(normalizePreferredProducts(options.preferred_products), null, 2)}\n`
    );
  }
}

process.env.HOME = process.env.HOME || '/data';
process.env.HA_URL = process.env.HA_URL || 'http://supervisor/core';
process.env.HA_TOKEN = process.env.HA_TOKEN || process.env.SUPERVISOR_TOKEN || '';
process.env.STATE_FILE = process.env.STATE_FILE || '/data/state.json';
process.env.PREFERRED_PRODUCTS_FILE = process.env.PREFERRED_PRODUCTS_FILE || preferredProductsFile;
process.env.BIND_HOST = process.env.BIND_HOST || '0.0.0.0';
process.env.PORT = process.env.PORT || '8124';

require('./server');

function normalizePreferredProducts(value) {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .filter((entry) => entry?.term)
        .map((entry) => [
          String(entry.term).trim().toLowerCase(),
          Array.isArray(entry.product_ids)
            ? entry.product_ids.map(String)
            : entry.product_ids
              ? [String(entry.product_ids)]
              : []
        ])
    );
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, ids]) => [
      key.trim().toLowerCase(),
      Array.isArray(ids) ? ids.map(String) : [String(ids)]
    ])
  );
}

function writeSessionJson(raw) {
  const text = String(raw).trim();
  if (!text) return;
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.cookies)) {
    throw new Error('sainsburys_session_json must be an open-supermarkets session JSON object with a cookies array');
  }
  fs.mkdirSync(path.dirname(sainsburysSessionFile), { recursive: true });
  fs.writeFileSync(sainsburysSessionFile, `${JSON.stringify(parsed, null, 2)}\n`, { mode: 0o600 });
  console.log(`imported Sainsbury's session to ${sainsburysSessionFile}`);
}
