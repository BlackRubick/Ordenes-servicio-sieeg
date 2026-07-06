const express = require('express');
const router = express.Router();

const WOO_URL = (process.env.WOO_URL || '').replace(/\/$/, '');
const WOO_KEY = process.env.WOO_KEY || '';
const WOO_SECRET = process.env.WOO_SECRET || '';

const isConfigured = () => WOO_URL && WOO_KEY && WOO_SECRET;

const basicAuth = () =>
  'Basic ' + Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');

// GET /api/woocommerce/products?search=xxx&per_page=20&page=1
router.get('/products', async (req, res) => {
  if (!isConfigured()) {
    return res.json({ error: 'WooCommerce no configurado', products: [] });
  }

  const { search = '', per_page = 20, page = 1 } = req.query;
  const params = new URLSearchParams({
    search,
    per_page: String(per_page),
    page: String(page),
    status: 'publish',
  });

  try {
    const response = await fetch(
      `${WOO_URL}/wp-json/wc/v3/products?${params.toString()}`,
      {
        headers: {
          Authorization: basicAuth(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `WooCommerce error: ${text}`, products: [] });
    }

    const data = await response.json();
    const products = (Array.isArray(data) ? data : []).map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      price: p.price || p.regular_price || '0',
      regular_price: p.regular_price || '0',
      sale_price: p.sale_price || '',
      stock_status: p.stock_status,
      stock_quantity: p.stock_quantity,
      image: p.images?.[0]?.src || null,
      categories: (p.categories || []).map(c => c.name),
    }));

    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message, products: [] });
  }
});

module.exports = router;
