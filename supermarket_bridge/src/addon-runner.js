const fs = require('node:fs');
const { installLogger } = require('./logger');

installLogger();

const optionsFile = '/data/options.json';

function boolString(value, defaultValue) {
  if (value == null) return defaultValue ? 'true' : 'false';
  return value ? 'true' : 'false';
}

if (fs.existsSync(optionsFile)) {
  const options = JSON.parse(fs.readFileSync(optionsFile, 'utf8'));

  process.env.TODO_ENTITY = options.todo_entity || 'todo.shopping_list';
  process.env.HA_URL = options.ha_url || process.env.HA_URL || '';
  process.env.HA_TOKEN = options.ha_token || process.env.HA_TOKEN || '';
  process.env.SAINSBURYS_EMAIL = options.sainsburys_email || process.env.SAINSBURYS_EMAIL || '';
  process.env.SAINSBURYS_PASSWORD = options.sainsburys_password || process.env.SAINSBURYS_PASSWORD || '';
  process.env.SUPERMARKET_EMAIL = process.env.SAINSBURYS_EMAIL;
  process.env.SUPERMARKET_PASSWORD = process.env.SAINSBURYS_PASSWORD;
  process.env.AUTO_COMPLETE_TODO = boolString(options.auto_complete_todo, true);
  process.env.POLL_INTERVAL_SECONDS = String(options.poll_interval_seconds ?? 30);
  process.env.FAILED_RETRY_SECONDS = String(options.failed_retry_seconds ?? 900);
  process.env.VERBOSE_LOGS = boolString(options.verbose_logs, false);
}

process.env.HOME = process.env.HOME || '/data';
process.env.HA_URL = process.env.HA_URL || 'http://supervisor/core';
process.env.HA_TOKEN = process.env.HA_TOKEN || process.env.SUPERVISOR_TOKEN || '';
process.env.STATE_FILE = process.env.STATE_FILE || '/data/state.json';
process.env.AUTH_STATE_FILE = process.env.AUTH_STATE_FILE || '/data/auth-state.json';
process.env.BIND_HOST = process.env.BIND_HOST || '0.0.0.0';
process.env.PORT = process.env.PORT || '8124';

require('./server');
