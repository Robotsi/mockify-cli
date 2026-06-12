# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-12

### Added

- File-based mock API routing with Next.js-style directory structure
- Programmable `.ts` and `.js` route handlers
- Dynamic route parameters (`[id]`) and catch-all routes (`[...slug]`)
- `_delay` and `_status` query parameter simulation
- `_mockify` metadata wrapper for JSON responses
- CORS support with configurable origin
- `.mockifyrc.json` configuration file
- Reverse proxy fallback for unmatched routes
- CLI commands: `start`, `init`, `routes`, `export-openapi`
- Dual runtime support for Bun and Node.js 18+
- Docker image support
- OpenAPI 3.0 export from route files
- TypeScript handler types exported as `mockify-cli`

[1.0.0]: https://github.com/Robotsi/mockify-cli/releases/tag/v1.0.0
