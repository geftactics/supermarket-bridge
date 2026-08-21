const fs = require('node:fs/promises');
const path = require('node:path');

async function loadState(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { processed: {} };
    throw error;
  }
}

async function saveState(file, state) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(state, null, 2)}\n`);
}

async function markProcessed(file, uid, record) {
  const state = await loadState(file);
  state.processed[uid] = {
    ...record,
    updatedAt: new Date().toISOString()
  };
  await saveState(file, state);
  return state.processed[uid];
}

module.exports = {
  loadState,
  markProcessed
};
