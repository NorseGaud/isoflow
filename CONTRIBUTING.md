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

Start the development server:

```bash
npm start
```

This launches webpack-dev-server with hot reload. Open [http://localhost:3001](http://localhost:3001) in your browser.

You should see the examples playground, where you can switch between:

- **Basic editor**
- **Debug tools**
- **Read-only mode**

Example entry point: `src/index.tsx` → `src/examples/`.

## Useful scripts

| Command | Description |
| --- | --- |
| `npm start` | Run the local examples app on port 3001 |
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
