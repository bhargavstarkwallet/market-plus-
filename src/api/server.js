// src/api/server.js
// Simple mock API server (Node + Express)

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5174;
app.use(express.json());

const products = [
  { id: 1, name: 'Sample Product', price: 9.99 },
  { id: 2, name: 'Another Item', price: 19.99 }
];

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const p = products.find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
