# Mock API

This folder contains a small mock API server and client helpers.

Run locally:

1. Install dependency:

```bash
npm install express
```

2. Start the mock server:

```bash
node src/api/server.js
```

The server listens on port `5174` by default and exposes:

- `GET /api/products`
- `GET /api/products/:id`

If your front-end runs on a different origin, set `API_BASE` in your client code or proxy requests accordingly.
