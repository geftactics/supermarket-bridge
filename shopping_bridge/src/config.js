const path = require('node:path');
const fs = require('node:fs');

const root = path.resolve(__dirname, '..');

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

loadDotEnv(path.resolve(root, '.env'));

function boolEnv(name, defaultValue) {
  const value = process.env[name];
  if (value == null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function intEnv(name, defaultValue) {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : defaultValue;
}

module.exports = {
  port: intEnv('PORT', 8124),
  bindHost: process.env.BIND_HOST || '127.0.0.1',
  dryRun: boolEnv('BRIDGE_DRY_RUN', true),
  autoCompleteTodo: boolEnv('AUTO_COMPLETE_TODO', false),
  haUrl: process.env.HA_URL || '',
  haToken: process.env.HA_TOKEN || '',
  todoEntity: process.env.TODO_ENTITY || 'todo.geoff_squiggle_org_shopping_list',
  stateFile: path.resolve(root, process.env.STATE_FILE || './data/state.json'),
  preferredProductsFile: path.resolve(
    root,
    process.env.PREFERRED_PRODUCTS_FILE || './config/preferred-products.json'
  ),
  favouritesLimit: intEnv('FAVOURITES_LIMIT', 12),
  searchLimit: intEnv('SEARCH_LIMIT', 12)
};
