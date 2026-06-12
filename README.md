# mockify-cli

[![npm version](https://img.shields.io/npm/v/mockify-cli.svg)](https://www.npmjs.com/package/mockify-cli)
[![CI](https://github.com/Robotsi/mockify-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Robotsi/mockify-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Zero-config, file-based local mock API server for frontend developers.**

Spin up a dynamic mock API from a `.mockify/` folder in seconds. No database file, no heavy setup, no external services. Works with **Node.js 18+** and **Bun**.

```bash
npx mockify-cli init && npx mockify-cli start
```

> **Note:** The npm package is published as `mockify-cli`, while the CLI command is `mockify`.

---

## Why mockify-cli?

| Feature | mockify-cli | json-server | MSW |
|---------|-------------|-------------|-----|
| Setup | `npx` one command | Requires `db.json` | Service worker / test setup |
| File routing | Next.js-style folders | REST conventions | Code-defined handlers |
| Programmable routes | `.ts` / `.js` handlers | Limited middleware | Handler functions |
| Proxy fallback | Built-in | No | No |
| Delay / status simulation | `_delay`, `_status` | No | Manual |
| Runtime | Bun + Node | Node | Browser / Node |

---

## Features

- **File-based routing** — `.mockify/users/GET.json` responds to `GET /users`
- **Dynamic routes** — `.mockify/users/[id]/GET.json` handles `/users/123`
- **Catch-all routes** — `.mockify/files/[...slug]/GET.json`
- **Programmable handlers** — export async functions from `.ts` or `.js` files
- **CORS enabled by default** — works with local frontend apps out of the box
- **Proxy mode** — forward unmatched routes to a real API
- **OpenAPI export** — generate a spec from your mock folder
- **Docker support** — run without a global install

---

## Quick Start

### 1. Scaffold mocks

```bash
npx mockify-cli init
```

This creates:

```text
.mockify/
├── index/GET.json
├── users/GET.json
├── users/[id]/GET.json
└── users/POST.ts
```

### 2. Start the server

```bash
npx mockify-cli start --port 4000
```

### 3. Try it

```bash
curl http://localhost:4000/users
curl http://localhost:4000/users/42
```

---

## Installation

```bash
# Global install
npm install -g mockify-cli

# Or run without installing
npx mockify-cli start
```

---

## CLI Reference

### `mockify start`

| Flag | Description | Default |
|------|-------------|---------|
| `-p, --port` | Server port | `4000` |
| `-H, --host` | Server host | `localhost` |
| `-d, --dir` | Mock directory | `.mockify` |

### `mockify init`

Scaffolds a `.mockify` directory with example routes.

### `mockify routes`

Lists all discovered routes from the mock directory.

### `mockify export-openapi`

Exports an OpenAPI 3.0 document.

```bash
mockify export-openapi -o openapi.json
```

---

## Configuration

Create `.mockifyrc.json` in your project root:

```json
{
  "port": 4000,
  "host": "localhost",
  "dir": ".mockify",
  "cors": true,
  "proxy": {
    "target": "https://api.example.com",
    "changeOrigin": true
  },
  "logLevel": "info"
}
```

CLI flags override config file values.

---

## Route Types

### Static JSON

`.mockify/users/GET.json`:

```json
{
  "status": "success",
  "data": [{ "id": 1, "name": "Alice" }]
}
```

### JSON with metadata

```json
{
  "_mockify": { "status": 201, "delay": 500 },
  "data": { "id": 1 }
}
```

### Programmable handler

`.mockify/users/POST.ts`:

```typescript
import type { MockHandler } from "mockify-cli";

const handle: MockHandler = async (req) => {
  const body = await req.json();

  if (!body.email) {
    return { status: 400, body: { error: "Email required" } };
  }

  return {
    status: 201,
    body: { id: 1, email: body.email },
  };
};

export default handle;
```

---

## Query Parameters

| Param | Example | Description |
|-------|---------|-------------|
| `_delay` | `?_delay=3000` | Delay response in milliseconds |
| `_status` | `?_status=500` | Return a specific HTTP status code |

---

## Dynamic Route Params

Requests to `/users/99` matching `.mockify/users/[id]/GET.json` include:

```text
X-Mockify-Params: {"id":"99"}
X-Powered-By: Mockify CLI
```

---

## Docker

```bash
docker build -t mockify-cli .
docker run -p 4500:4500 -v $(pwd)/.mockify:/app/.mockify mockify-cli
```

---

## Example Project

See [`examples/react-todo`](examples/react-todo) for a minimal React + Vite app using mockify-cli.

---

## Development

```bash
bun install
bun test
bun run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## Security

mockify-cli is a **local development tool only**. Do not expose it to the public internet or use it in production.

---

## License

MIT © [Alperen Emre Kır](https://github.com/Robotsi)
