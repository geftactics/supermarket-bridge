const http = require('node:http');
const { installLogger } = require('./logger');
const config = require('./config');
const { getTodoItems } = require('./ha');
const { processTodoItem } = require('./processor');
const { SainsburysBasket } = require('./sainsburys');

installLogger();

const basket = new SainsburysBasket(config);
let pollInProgress = false;

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(`${JSON.stringify(body, null, 2)}\n`);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString('utf8').trim();
  return body ? JSON.parse(body) : {};
}

async function resolveItem(payload) {
  if (payload.summary) return payload;
  if (!payload.uid) throw new Error('Payload must include summary or uid');

  const items = await getTodoItems(config);
  const item = items.find((candidate) => candidate.uid === payload.uid);
  if (!item) throw new Error(`Todo item ${payload.uid} not found in ${config.todoEntity}`);
  return item;
}

async function handler(req, res) {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      json(res, 200, {
        ok: true,
        dryRun: config.dryRun,
        todoEntity: config.todoEntity,
        pollIntervalSeconds: config.pollIntervalSeconds,
        haApiConfigured: Boolean(config.haUrl && config.haToken)
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/status') {
      json(res, 200, await basket.status());
      return;
    }

    if (req.method === 'POST' && req.url === '/ha/todo-added') {
      const payload = await readJson(req);
      const item = await resolveItem(payload);
      const result = await processTodoItem(config, basket, item);
      json(res, 200, result);
      return;
    }

    json(res, 404, { error: 'not_found' });
  } catch (error) {
    json(res, 500, {
      error: error.message,
      dryRun: config.dryRun
    });
  }
}

const server = http.createServer(handler);

server.on('error', (error) => {
  console.error(`failed to start shopping-bridge: ${error.message}`);
  process.exitCode = 1;
});

server.listen(config.port, config.bindHost, () => {
  console.log('---- shopping-bridge starting ----');
  console.log(`shopping-bridge listening on http://${config.bindHost}:${config.port}`);
  console.log(`dry-run: ${config.dryRun ? 'on' : 'off'}`);
  console.log(`todo entity: ${config.todoEntity}`);
  if (config.pollIntervalSeconds > 0 && config.haUrl && config.haToken) {
    console.log(`todo polling: every ${config.pollIntervalSeconds}s`);
    pollTodoList();
    setInterval(pollTodoList, config.pollIntervalSeconds * 1000);
  } else {
    console.log('todo polling: off');
  }
});

async function pollTodoList() {
  if (pollInProgress) return;
  pollInProgress = true;
  try {
    const items = await getTodoItems(config, 'needs_action');
    for (const item of items) {
      const result = await processTodoItem(config, basket, item);
      if (result.skipped) {
        console.log(`todo skipped: ${item.summary} (${result.reason})`);
      } else {
        console.log(
          `todo processed: ${item.summary} -> ${result.product?.name || 'unknown'} ` +
          `[${result.selectedFrom}; ${result.dryRun ? 'dry-run' : 'added'}]`
        );
      }
    }
  } catch (error) {
    console.error(`todo poll failed: ${error.message}`);
  } finally {
    pollInProgress = false;
  }
}
