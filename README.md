# Mockify CLI 🚀

A minimalist, lightning-fast, and zero-dependency local Mock API server powered by **Bun** and **TypeScript**. 

Stop wasting time configuring heavy tools or relying on external internet services just to mock your frontend requests. With **Mockify**, you can spin up a fully dynamic, file-based routing API server locally in milliseconds.

---

## ✨ Features

- 🏎️ **Powered by Bun:** Sub-millisecond response times using Bun's native HTTP and file-system APIs.
- 📂 **File-Based Routing:** Next.js style directory structure (`.mockify/users/GET.json`).
- 🔄 **Dynamic Route Parameters:** Supports pattern matching for dynamic paths (`.mockify/users/[id]/GET.json`) and returns parameters via response headers.
- ⏳ **Delay Simulation:** Easily test your frontend loading states/spinners using the `_delay` query parameter.
- 🚨 **HTTP Status Simulation:** Test error handling (401, 403, 500, etc.) on the fly using the `_status` query parameter.

---

## 📦 Installation

Install globally via your favorite package manager (Once published to NPM):

```bash
npm install -g mockify-cli
# or
bun add -g mockify-cli

```

---

## 🚀 Quick Start

### 1. Create your mock directory

In the root of your project, create a `.mockify` directory and mirror your desired API structure:

```text
your-project/
├── .mockify/
│   ├── index/
│   │   └── GET.json       # Responds to GET /
│   ├── users/
│   │   ├── GET.json       # Responds to GET /users
│   │   └── [id]/
│   │       └── GET.json   # Responds to GET /users/123, /users/abc, etc.

```

Example JSON data (`.mockify/users/GET.json`):

```json
{
  "status": "success",
  "data": [
    { "id": 1, "name": "Alperen" },
    { "id": 2, "name": "Nehir" }
  ]
}

```

### 2. Start the server

Run the following command anywhere in your terminal:

```bash
mockify start --port 4000

```

---

## 🛠️ Advanced Usage

### 1. Delay Simulation (`_delay`)

Simulate network latency by passing the `_delay` parameter in milliseconds. Perfect for testing loading spinners.

```text
GET http://localhost:4000/users?_delay=3000
// Server delays the response for exactly 3 seconds

```

### 2. HTTP Status Code Simulation (`_status`)

Simulate server crashes or unauthorized access instantly.

```text
GET http://localhost:4000/users?_status=500
// Instantly returns a 500 Internal Server Error

```

### 3. Dynamic Route Extraction

When hitting a dynamic route like `/users/99`, Mockify matches `.mockify/users/[id]/GET.json` and automatically attaches parsed parameters to the response headers:

```text
X-Mockify-Params: {"id":"99"}
X-Powered-By: Mockify CLI

```

---

## 🛠️ Tech Stack & Architecture

* **Runtime:** Bun
* **Language:** TypeScript
* **CLI Framework:** Commander.js
* **Styling:** Picocolors

The core routing algorithm uses a highly optimized recursive directory scanner to handle deep dynamic nesting without degrading HTTP performance.

---

## 🐳 Running with Docker

If you prefer not to install the CLI globally, you can run Mockify inside an isolated Docker container:

```bash
# Build the image
docker build -t mockify-cli .

# Run the container (binds your local .mockify folder)
docker run -p 4500:4500 -v $(pwd)/.mockify:/app/.mockify mockify-cli
```

---

## 📄 License

MIT License. Feel free to contribute and open issues!

