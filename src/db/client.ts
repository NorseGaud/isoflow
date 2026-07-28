import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { applyMigrations } from './schema';
import { createIndexedDbAdapter } from './adapters/indexedDb';
import type {
  DbConfig,
  LocateWasm,
  SqlitePersistenceAdapter
} from './adapters/types';

let sqlPromise: Promise<SqlJsStatic> | null = null;
let dbPromise: Promise<Database> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let activeDb: Database | null = null;

let configuredAdapter: SqlitePersistenceAdapter | null = null;
let configuredLocateWasm: LocateWasm | null = null;

const PERSIST_DEBOUNCE_MS = 250;

const defaultLocateWasm: LocateWasm = () => {
  // Node / tsx: resolve the non-browser wasm asset.
  // Browser builds must call configureDb({ locateWasm }) instead.
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  return require.resolve('sql.js/dist/sql-wasm.wasm');
};

const getAdapter = (): SqlitePersistenceAdapter => {
  return configuredAdapter ?? createIndexedDbAdapter();
};

const getLocateWasm = (): LocateWasm => {
  return configuredLocateWasm ?? defaultLocateWasm;
};

/**
 * Configure the sql.js client before the first `getDb()` call.
 * Used by the Node server (fs adapter + node wasm), the browser app
 * (IndexedDB adapter + webpack wasm URL), and tests (memory adapter).
 */
export const configureDb = (config: Partial<DbConfig> & { adapter?: SqlitePersistenceAdapter }): void => {
  if (dbPromise || activeDb) {
    throw new Error(
      'configureDb() must be called before getDb(). The database is already open.'
    );
  }

  if (config.adapter) {
    configuredAdapter = config.adapter;
  }

  if (config.locateWasm) {
    configuredLocateWasm = config.locateWasm;
  }
};

/** Reset client state — for tests only. */
export const resetDbClientForTests = async (): Promise<void> => {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  if (activeDb) {
    activeDb.close();
  }

  activeDb = null;
  dbPromise = null;
  sqlPromise = null;
  configuredAdapter = null;
  configuredLocateWasm = null;
};

const getSql = () => {
  if (!sqlPromise) {
    const locateFile = getLocateWasm();

    sqlPromise = initSqlJs({
      locateFile: () => {
        return locateFile();
      }
    });
  }

  return sqlPromise;
};

const schedulePersist = () => {
  if (!activeDb) return;

  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(() => {
    if (!activeDb) return;

    const data = activeDb.export();
    void getAdapter().save(data);
  }, PERSIST_DEBOUNCE_MS);
};

export const getDb = async (): Promise<Database> => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await getSql();
      const saved = await getAdapter().load();
      const db = saved ? new SQL.Database(saved) : new SQL.Database();

      applyMigrations(db);
      activeDb = db;
      schedulePersist();

      return db;
    })().catch((error) => {
      dbPromise = null;
      activeDb = null;
      throw error;
    });
  }

  return dbPromise;
};

/** Run a write and persist the SQLite file to long-term storage. */
export const withDbWrite = async <T>(
  run: (db: Database) => T | Promise<T>
): Promise<T> => {
  const db = await getDb();
  const result = await run(db);
  schedulePersist();
  return result;
};

/** Flush any pending DB writes to disk immediately. */
export const flushDb = async (): Promise<void> => {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  if (!activeDb) return;

  await getAdapter().save(activeDb.export());
};

/**
 * Open an arbitrary SQLite byte array with sql.js (does not replace the
 * active app database). Used by legacy import.
 */
export const openSqliteBytes = async (data: Uint8Array): Promise<Database> => {
  const SQL = await getSql();
  return new SQL.Database(data);
};
