#!/usr/bin/env bash
set -euo pipefail

echo "Building mockify-cli..."
bun run build
bun test

echo "Dry-run pack:"
npm pack --dry-run

echo ""
echo "Ready to publish. Run:"
echo "  npm login"
echo "  npm publish --access public"
echo ""
echo "Then create a GitHub release:"
echo "  git tag v1.0.0"
echo "  git push origin v1.0.0"
echo "  gh release create v1.0.0 --title v1.0.0 --notes-file CHANGELOG.md"
