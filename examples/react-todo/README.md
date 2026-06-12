# React Todo + mockify-cli

Minimal example showing how a React app can consume a file-based mock API.

## Run

In one terminal, from the repository root:

```bash
npx mockify-cli start --port 4000 --dir examples/react-todo/.mockify
```

In another terminal:

```bash
cd examples/react-todo
npm install
npm run dev
```

Open http://localhost:5173
