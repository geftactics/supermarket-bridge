const { completeTodoItem } = require('./ha');
const { parseShoppingText } = require('./item-parser');
const { productSummary } = require('./sainsburys');
const { loadState, markProcessed } = require('./state');

async function processTodoItem(config, basket, item) {
  const uid = item.uid || item.id || item.summary;
  if (!uid) throw new Error('Todo item needs uid, id, or summary');

  const state = await loadState(config.stateFile);
  const previous = state.processed[uid];
  const previousStatus = previous?.status;
  if (
    previousStatus === 'added' ||
    shouldDelayFailedRetry(config, previous)
  ) {
    return {
      skipped: true,
      reason: skipReason(previousStatus),
      uid,
      previous
    };
  }

  const parsed = parseShoppingText(item.summary);
  let match;
  try {
    match = await basket.findProduct(parsed.query);
    match.product = await addFirstWorkingProduct(basket, match.products || [match.product], parsed.quantity);
  } catch (error) {
    await markProcessed(config.stateFile, uid, {
      uid,
      status: 'failed',
      summary: item.summary,
      parsed,
      error: firstLine(error.message),
      retryAfter: new Date(Date.now() + config.failedRetrySeconds * 1000).toISOString()
    });
    throw error;
  }

  const record = await markProcessed(config.stateFile, uid, {
    uid,
    status: 'added',
    summary: item.summary,
    parsed,
    selectedFrom: match.source,
    product: productSummary(match.product)
  });

  if (config.autoCompleteTodo) {
    await completeTodoItem(config, uid);
  }

  return {
    skipped: false,
    uid,
    selectedFrom: match.source,
    parsed,
    product: productSummary(match.product),
    candidates: match.candidates,
    record
  };
}

async function addFirstWorkingProduct(basket, products, quantity) {
  const candidates = products.filter(Boolean);
  let lastError;

  for (const [index, product] of candidates.entries()) {
    try {
      await basket.addProduct(product, quantity);
      return product;
    } catch (error) {
      lastError = error;
      if (index < candidates.length - 1) {
        console.warn(`Failed to add '${product.name || product.product_uid}'; trying next candidate`);
      }
    }
  }

  throw lastError || new Error('No Sainsbury\'s product candidates to add');
}

function shouldDelayFailedRetry(config, previous) {
  if (previous?.status !== 'failed' || !previous.retryAfter) return false;
  return new Date(previous.retryAfter).getTime() > Date.now();
}

function skipReason(status) {
  if (status === 'failed') return 'failed_retry_delayed';
  return 'already_processed';
}

function firstLine(value) {
  return String(value || '').split(/\r?\n/)[0];
}

module.exports = { processTodoItem };
