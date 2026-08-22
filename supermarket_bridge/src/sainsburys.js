const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const { promisify } = require('node:util');
const { clean } = require('./logger');

const execFileAsync = promisify(execFile);

function productSummary(product) {
  if (!product) return null;
  return {
    product_uid: product.product_uid,
    name: product.name,
    price: product.retail_price?.price,
    size: product.size,
    in_stock: product.in_stock
  };
}

function chooseInStock(products) {
  return products.find((product) => product.in_stock) || products[0] || null;
}

function normalizeTerm(value) {
  return String(value || '').trim().toLowerCase();
}

class SainsburysBasket {
  constructor(config) {
    this.config = config;
    this.bin = process.env.SUPERMARKET_BIN || path.resolve(__dirname, '..', 'node_modules', '.bin', 'supermarket');
  }

  async run(args, options = {}) {
    try {
      return await this.execSupermarket(args, options);
    } catch (error) {
      const message = commandErrorMessage(error);
      if (options.retriedAuth || !isAuthFailure(message) || !hasCredentials()) {
        throw new Error(message);
      }

      console.warn("Sainsbury's auth expired or was rejected; logging in with xvfb");
      await this.loginWithVirtualDisplay();
      return this.run(args, { ...options, retriedAuth: true });
    }
  }

  async execSupermarket(args, options = {}) {
    const { stdout } = await execFileAsync(this.bin, args, {
      cwd: process.cwd(),
      timeout: options.timeout || 45000,
      maxBuffer: 1024 * 1024 * 5,
      env: commandEnv()
    });
    return stdout;
  }

  async loginWithVirtualDisplay() {
    const args = [
      '-a',
      this.bin,
      '--provider',
      'sainsburys',
      'login',
      '--email',
      process.env.SUPERMARKET_EMAIL || process.env.SAINSBURYS_EMAIL,
      '--password',
      process.env.SUPERMARKET_PASSWORD || process.env.SAINSBURYS_PASSWORD
    ];
    await execFileAsync('xvfb-run', args, {
      cwd: process.cwd(),
      timeout: 90000,
      maxBuffer: 1024 * 1024 * 5,
      env: commandEnv()
    });
    console.log("Sainsbury's login completed with xvfb");
  }

  async ensureAuthenticated() {
    if (!hasCredentials()) {
      throw new Error("Sainsbury's email and password are required");
    }
    console.log("Logging in to Sainsbury's with xvfb");
    await this.loginWithVirtualDisplay();
  }

  async runJson(args) {
    const stdout = await this.run(args);
    return JSON.parse(stdout);
  }

  async loadPreferredProducts() {
    try {
      return JSON.parse(await fs.readFile(this.config.preferredProductsFile, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return {};
      throw error;
    }
  }

  async findProduct(query) {
    const preferred = await this.findPreferredProduct(query);
    if (preferred) return preferred;

    if (this.config.useFavourites) {
      let favourites = [];
      try {
        const result = await this.runJson([
          '--provider',
          'sainsburys',
          'favourites',
          '--limit',
          String(this.config.favouritesLimit),
          '--json'
        ]);
        favourites = (result.products || []).filter((product) =>
          productScore(product, query) > 0
        ).sort((a, b) => productScore(b, query) - productScore(a, query));
      } catch (error) {
        console.warn(`favourites lookup failed, falling back to search: ${firstLine(error.message)}`);
      }

      const favourite = chooseInStock(favourites);
      if (favourite) {
        return {
          source: 'favourites',
          product: favourite,
          candidates: favourites.map(productSummary)
        };
      }
    }

    const searchResult = await this.runJson([
      '--provider',
      'sainsburys',
      'search',
      query,
      '--limit',
      String(this.config.searchLimit),
      '--json'
    ]);
    const results = searchResult.products || [];
    const product = chooseInStock(results);
    if (!product) {
      throw new Error(`No Sainsbury's product found for "${query}"`);
    }

    return {
      source: 'search',
      product,
      candidates: results.map(productSummary)
    };
  }

  async findPreferredProduct(query) {
    const preferences = await this.loadPreferredProducts();
    const ids = preferences[normalizeTerm(query)];
    const productIds = Array.isArray(ids) ? ids : ids ? [ids] : [];

    if (productIds.length === 0) return null;

    const searchResult = await this.runJson([
      '--provider',
      'sainsburys',
      'search',
      query,
      '--limit',
      String(Math.max(this.config.searchLimit, productIds.length)),
      '--json'
    ]);
    const candidates = searchResult.products || [];
    const preferredProducts = productIds.map((productId) => {
      const product = candidates.find((candidate) => candidate.product_uid === String(productId));
      return product || {
        product_uid: String(productId),
        name: `Preferred product ${productId}`,
        in_stock: true,
        retail_price: {}
      };
    });

    const product = chooseInStock(preferredProducts);
    return {
      source: 'preferred',
      product,
      candidates: preferredProducts.map(productSummary)
    };
  }

  async addProduct(product, quantity) {
    await this.run([
      '--provider',
      'sainsburys',
      'add',
      product.product_uid,
      '--qty',
      String(quantity)
    ]);
    return {};
  }
}

function productScore(product, query) {
  const haystack = `${product.name || ''} ${product.description || ''}`.toLowerCase();
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return 0;
  if (haystack === needle) return 1000;
  if (haystack.includes(needle)) return 500 + needle.length;
  return needle.split(/\s+/).reduce((score, term) => {
    return haystack.includes(term) ? score + 100 + term.length : score;
  }, 0);
}

function firstLine(value) {
  return String(value || '').split(/\r?\n/)[0];
}

function commandEnv() {
  return {
    ...process.env,
    PATH: [
      path.resolve(__dirname, '..', 'node_modules', '.bin'),
      process.env.PATH || ''
    ].filter(Boolean).join(path.delimiter),
    SUPERMARKET_EMAIL: process.env.SUPERMARKET_EMAIL || process.env.SAINSBURYS_EMAIL,
    SUPERMARKET_PASSWORD: process.env.SUPERMARKET_PASSWORD || process.env.SAINSBURYS_PASSWORD
  };
}

function commandErrorMessage(error) {
  const stderr = error.stderr ? String(error.stderr).trim() : '';
  const stdout = error.stdout ? String(error.stdout).trim() : '';
  return clean([stderr, stdout, error.message].filter(Boolean).join('\n'));
}

function isAuthFailure(message) {
  return /session rejected|HTTP 401|Not authenticated|Failed to add to basket/i.test(message);
}

function hasCredentials() {
  return Boolean(
    (process.env.SUPERMARKET_EMAIL || process.env.SAINSBURYS_EMAIL) &&
    (process.env.SUPERMARKET_PASSWORD || process.env.SAINSBURYS_PASSWORD)
  );
}

module.exports = {
  SainsburysBasket,
  productSummary
};
