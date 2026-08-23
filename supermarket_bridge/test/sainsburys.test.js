const assert = require('node:assert/strict');
const { productMatchesAllTerms } = require('../src/sainsburys');

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

console.log('sainsburys matcher tests passed');
