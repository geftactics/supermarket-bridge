const http = require('node:http');
const { installLogger } = require('./logger');
const config = require('./config');
const { getEntityState, getTodoItems } = require('./ha');
const { processTodoItem } = require('./processor');
const { SainsburysBasket } = require('./sainsburys');

installLogger();

const basket = new SainsburysBasket(config);
let pollInProgress = false;

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(`${JSON.stringify(body, null, 2)}\n`);
}

async function handler(req, res) {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      json(res, 200, {
        ok: true,
        todoEntity: config.todoEntity,
        pollIntervalSeconds: config.pollIntervalSeconds,
        haApiConfigured: Boolean(config.haUrl && config.haToken)
      });
      return;
    }

    json(res, 404, { error: 'not_found' });
  } catch (error) {
    json(res, 500, {
      error: error.message
    });
  }
}

const server = http.createServer(handler);

server.on('error', (error) => {
  console.error(`failed to start supermarket-bridge: ${error.message}`);
  process.exitCode = 1;
});

start().catch((error) => {
  console.error(`startup failed: ${error.message}`);
  process.exit(1);
});

async function start() {
  process.stdout.write('\n');
  console.log('---- supermarket-bridge starting ----');
  await validateStartup();
  await basket.ensureAuthenticated();

  server.listen(config.port, config.bindHost, () => {
    console.log(`Listening on http://${config.bindHost}:${config.port}`);
    if (config.pollIntervalSeconds > 0) {
      console.log(`Polling todo entity '${config.todoEntity}' every ${config.pollIntervalSeconds}s.`);
      pollTodoList();
      setInterval(pollTodoList, config.pollIntervalSeconds * 1000);
    } else {
      console.log('Todo polling is disabled.');
    }
  });
}

async function validateStartup() {
  if (config.pollIntervalSeconds <= 0) return;
  if (!config.haUrl || !config.haToken) {
    throw new Error('Home Assistant API is required when todo polling is enabled');
  }

  try {
    const entity = await getEntityState(config, config.todoEntity);
    if (!entity?.entity_id || !entity.entity_id.startsWith('todo.')) {
      throw new Error(`'${config.todoEntity}' is not a todo entity`);
    }
  } catch (error) {
    throw new Error(`Todo entity '${config.todoEntity}' is not available: ${error.message}`);
  }
}

async function pollTodoList() {
  if (pollInProgress) return;
  pollInProgress = true;
  try {
    const items = await getTodoItems(config, 'needs_action');
    for (const item of items) {
      const result = await processTodoItem(config, basket, item);
      if (result.skipped) {
        console.log(skipLogLine(item, result));
      } else {
        console.log(
          `Added '${item.summary}' -> '${result.product?.name || 'unknown'}' ` +
          `[${result.selectedFrom}]`
        );
      }
    }
  } catch (error) {
    console.error(`Poll failed: ${error.message}`);
  } finally {
    pollInProgress = false;
  }
}

function skipLogLine(item, result) {
  if (result.reason === 'failed_retry_delayed') {
    return `Skipped '${item.summary}': retry delayed until ${result.previous?.retryAfter || 'later'}.`;
  }
  if (result.reason === 'already_processed') {
    return `Skipped '${item.summary}': already added.`;
  }
  return `Skipped '${item.summary}': ${result.reason}.`;
}
