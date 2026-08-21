const config = require('./config');
const { getTodoItems } = require('./ha');
const { processTodoItem } = require('./processor');
const { SainsburysBasket } = require('./sainsburys');

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const basket = new SainsburysBasket(config);

  if (command === 'status') {
    console.log(JSON.stringify(await basket.status(), null, 2));
    return;
  }

  if (command === 'item') {
    const summary = args.join(' ').trim();
    if (!summary) throw new Error('Usage: npm run test:item -- "Bananas"');
    const uid = `manual:${summary.toLowerCase()}`;
    const result = await processTodoItem(config, basket, { uid, summary });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'ha-sync') {
    const items = await getTodoItems(config);
    const results = [];
    for (const item of items) {
      results.push(await processTodoItem(config, basket, item));
    }
    console.log(JSON.stringify({ count: results.length, results }, null, 2));
    return;
  }

  throw new Error('Usage: node src/cli.js <status|item|ha-sync>');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
