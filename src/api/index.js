// src/api/index.js
// Client helpers to call the API server. Adjust base URL if needed.

const BASE = process.env.API_BASE || '';

export async function fetchProducts() {
  const res = await fetch(`${BASE}/api/products`);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
}

export async function fetchProduct(id) {
  const res = await fetch(`${BASE}/api/products/${id}`);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
}

export default { fetchProducts, fetchProduct };
