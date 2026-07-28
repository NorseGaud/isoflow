import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import {
  configureDb,
  initializeAppDb,
  stripStoredProjectIcons
} from '../src/db';
import { createFsAdapter, DEFAULT_DB_PATH } from './adapters/fs';
import { createApp } from './createApp';
import { registerWsClient } from './wsHub';

const PORT = Number(process.env.ISOFLOW_PORT ?? 9324);
const DB_PATH = process.env.ISOFLOW_DB_PATH ?? DEFAULT_DB_PATH;

const locateWasm = () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  return require.resolve('sql.js/dist/sql-wasm.wasm');
};

export const startServer = async (options?: {
  port?: number;
  dbPath?: string;
}) => {
  const port = options?.port ?? PORT;
  const dbPath = options?.dbPath ?? DB_PATH;

  configureDb({
    adapter: createFsAdapter(dbPath),
    locateWasm
  });

  await initializeAppDb();
  await stripStoredProjectIcons();

  const app = createApp();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    registerWsClient(socket);
  });

  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      resolve();
    });
  });

  // eslint-disable-next-line no-console
  console.log(
    `Isoflow server listening on http://localhost:${port} (db: ${path.resolve(
      dbPath
    )})`
  );

  return { app, server, port, dbPath };
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
