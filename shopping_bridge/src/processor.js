const { completeTodoItem } = require('./ha');
const { parseShoppingText } = require('./item-parser');
const { productSummary } = require('./sainsburys');
const { loadState, markProcessed } = require('./state');

async function processTodoItem(config, basket, item) {
  const uid = item.uid || item.id || item.summary;
  if (!uid) throw new Error('Todo item needs uid, id, or summary');

  const state = await loadState(config.stateFile);
  const previousStatus = state.processed[uid]?.status;
  if (previousStatus === 'added' || (config.dryRun && previousStatus === 'dry_run')) {
    return {
      skipped: true,
      reason: previousStatus === 'dry_run' ? 'already_dry_run' : 'already_processed',
      uid,
      previous: state.processed[uid]
    };
  }

  const parsed = parseShoppingText(item.summary);
  const match = await basket.findProduct(parsed.query);
  const addResult = await basket.addProduct(match.product, parsed.quantity);

  const record = await markProcessed(config.stateFile, uid, {
    uid,
    status: addResult.dryRun ? 'dry_run' : 'added',
    summary: item.summary,
    parsed,
    selectedFrom: match.source,
    product: productSummary(match.product)
  });

  if (!addResult.dryRun && config.autoCompleteTodo) {
    await completeTodoItem(config, uid);
  }

  return {
    skipped: false,
    uid,
    dryRun: addResult.dryRun,
    selectedFrom: match.source,
    parsed,
    product: productSummary(match.product),
    candidates: match.candidates,
    record
  };
}

module.exports = { processTodoItem };
