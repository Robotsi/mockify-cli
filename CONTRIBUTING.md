# Contributing to Mockify CLI

Thank you for your interest in contributing!

## Development setup

```bash
git clone https://github.com/Robotsi/mockify-cli.git
cd mockify-cli
bun install
```

## Running locally

```bash
bun run src/cli.ts init
bun run src/cli.ts start
```

## Tests

```bash
bun test
```

## Build

```bash
bun run build
```

## Pull request guidelines

1. Keep changes focused and well-tested.
2. Update documentation when behavior changes.
3. Add or update tests for bug fixes and new features.
4. Follow the existing code style and naming conventions.

## Reporting issues

Please include:

- Runtime version (`node -v` or `bun -v`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
