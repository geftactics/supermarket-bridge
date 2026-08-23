const path = require('node:path');
const packageJson = require('../package.json');

const root = path.resolve(__dirname, '..');

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
  appVersion: packageJson.version,
  port: intEnv('PORT', 8124),
  bindHost: process.env.BIND_HOST || '127.0.0.1',
  autoCompleteTodo: boolEnv('AUTO_COMPLETE_TODO', true),
  useFavourites: true,
  haUrl: process.env.HA_URL || '',
  haToken: process.env.HA_TOKEN || '',
  todoEntity: process.env.TODO_ENTITY || 'todo.shopping_list',
  pollIntervalSeconds: intEnv('POLL_INTERVAL_SECONDS', 0),
  failedRetrySeconds: intEnv('FAILED_RETRY_SECONDS', 900),
  verboseLogs: boolEnv('VERBOSE_LOGS', false),
  stateFile: path.resolve(root, process.env.STATE_FILE || './data/state.json'),
  authStateFile: path.resolve(root, process.env.AUTH_STATE_FILE || './data/auth-state.json'),
  favouritesLimit: intEnv('FAVOURITES_LIMIT', 12),
  searchLimit: intEnv('SEARCH_LIMIT', 12)
};
