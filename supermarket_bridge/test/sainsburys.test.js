const assert = require('node:assert/strict');
const { addOrder, productMatchesAllTerms } = require('../src/sainsburys');

function product(name) {
  return { name, description: '' };
}

assert.equal(
  productMatchesAllTerms(product("Sainsbury's Fresh British Chicken Breast Fillet garlic Kyiv x2 390g"), 'chicken nuggets'),
  false
);

assert.equal(
  productMatchesAllTerms(product("Sainsbury's Chicken Nuggets 450g"), 'chicken nuggets'),
  true
);

assert.equal(
  productMatchesAllTerms(product('Tropicana Original Orange with Bits Fruit Juice 1.5L'), 'tropicana'),
  true
);

assert.equal(
  productMatchesAllTerms(product("Sainsbury's Beef Burgers x4"), 'burger'),
  true
);

assert.equal(
  productMatchesAllTerms(product('Nissin Demae Ramen Spicy Japanese Noodlesoup 100g'), 'spicy noodles'),
  true
);

assert.equal(
  productMatchesAllTerms(product('Seabrook Crinkle Cut Crisps Sea Salt & Vinegar 6x25g'), 'salt vinegar crisps'),
  true
);

assert.deepEqual(
  addOrder([
    { product_uid: '1', in_stock: false },
    { product_uid: '2', in_stock: true },
    { product_uid: '3', in_stock: true }
  ]).map((item) => item.product_uid),
  ['2', '3', '1']
);

console.log('sainsburys matcher tests passed');
