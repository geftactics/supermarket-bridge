async function haFetch(config, path, options = {}) {
  if (!config.haUrl || !config.haToken) {
    throw new Error('HA_URL and HA_TOKEN are required for Home Assistant API calls');
  }

  const response = await fetch(`${config.haUrl.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${config.haToken}`,
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Home Assistant ${response.status}: ${body}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function getTodoItems(config, status = 'needs_action') {
  const body = await haFetch(config, '/api/services/todo/get_items?return_response', {
    method: 'POST',
    body: JSON.stringify({
      entity_id: config.todoEntity,
      status
    })
  });

  return body?.service_response?.[config.todoEntity]?.items || [];
}

async function getEntityState(config, entityId) {
  return haFetch(config, `/api/states/${encodeURIComponent(entityId)}`);
}

async function completeTodoItem(config, item) {
  await haFetch(config, '/api/services/todo/update_item', {
    method: 'POST',
    body: JSON.stringify({
      entity_id: config.todoEntity,
      item,
      status: 'completed'
    })
  });
}

module.exports = {
  getTodoItems,
  getEntityState,
  completeTodoItem
};
