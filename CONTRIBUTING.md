# Contributing to Isoflow

Thanks for your interest in contributing. This guide covers how to run Isoflow locally for development.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later (LTS recommended)
- npm (comes with Node.js)

If you use [nvm](https://github.com/nvm-sh/nvm), you can install and switch Node versions with:

```bash
nvm install --lts
nvm use --lts
```

## Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/markmanx/isoflow.git
cd isoflow
npm install
```

This project includes an `.npmrc` that sets `legacy-peer-deps=true`, which is required because `react-quill` has not yet declared React 19 peer support.

## Run locally

Isoflow now has three processes for full agent-driven editing:

1. **API server** (owns projects/models on disk) — port **9324**
2. **Web app** (webpack-dev-server) — port **9323**
3. **MCP server** (stdio; used by Cursor / other agents)

### API server

```bash
npm run start:server
```

Persists to `~/.isoflow/isoflow.sqlite` by default. Override with `ISOFLOW_DB_PATH` / `ISOFLOW_PORT`.

### Web app

In a second terminal:

```bash
npm start
```

Open [http://localhost:9323](http://localhost:9323). The app talks to the API server over HTTP and receives live diagram updates over WebSocket.

On first boot, any legacy browser IndexedDB SQLite blob is uploaded once to the server (`/api/import/legacy`).

### MCP server

See `mcp.config.example.json`. Point Cursor (or another MCP host) at:

```bash
npx tsx --tsconfig mcp/tsconfig.json mcp/src/server.ts
```

Set both (defaults are for local dev only; use real origins in deployed environments):

```bash
ISOFLOW_API_URL=http://localhost:9324
ISOFLOW_APP_URL=http://localhost:9323
```

Tools cover workspace/project CRUD, diagram editing, custom icons, JSON import/export, and `isoflow_screenshot` (see `mcp/src/server.ts`). For screenshots, install Chromium once: `npx playwright install chromium`.

**Parity rule:** any new human-persistable feature must ship API + MCP support together. See [AGENTS.md](./AGENTS.md).

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run start:server` | Run the Isoflow API + WebSocket server on port 9324 |
| `npm start` | Run the web app on port 9323 (requires API server) |
| `npm run start:mcp` | Run the MCP server over stdio |
| `npm run build` | Build the library to `dist/` (webpack + TypeScript declarations) |
| `npm run dev` | Rebuild the library on `src/` changes (watch mode via nodemon) |
| `npm test` | Run the Jest test suite |
| `npm run lint` | Typecheck and lint |
| `npm run lint:fix` | Auto-fix lint/formatting issues where possible |

## Working on the library

- Editor and component source lives under `src/`
- Production library builds use `webpack/prod.config.js` and emit to `dist/`
- The local playground (`npm start`) is the fastest way to try UI changes

If you are consuming the built package from another local project, run `npm run build` (or `npm run dev` for continuous rebuilds) and link/point that project at this repo’s `dist/` output.

## Pull requests

- Use branch names like `feature/…`, `fix/…`, or `chore/…`
- Keep each PR focused on a single change
- Squash commits before merge when possible
- Run `npm test` and `npm run lint` before opening a PR

## Getting help

- File issues: [GitHub Issues](https://github.com/markmanx/isoflow/issues)
- Chat: [Discord](https://discord.gg/QYPkvZth7D)
- Docs: [isoflow.io/docs](https://isoflow.io/docs)

## License

Isoflow is MIT licensed. See [LICENSE](./LICENSE).
