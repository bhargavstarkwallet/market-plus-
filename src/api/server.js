// src/api/server.js
// Simple mock API server (Node + Express) — ESM-compatible

import express from 'express';
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

// Proxy to Mistral API (local dev fallback for /api/chat)
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: 'MISTRAL_API_KEY not set' } });
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    
    if (!text) {
      console.error('[Dev Server] Empty response from Mistral API', { status: response.status });
      return res.status(502).json({ error: { message: 'Empty response from Mistral' } });
    }
    
    res.status(response.status).set('Content-Type', 'application/json').send(text);
  } catch (err) {
    console.error('[Dev Server] Error:', err.message);
    res.status(500).json({ error: { message: err.message || 'Server error' } });
  }
});

app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
