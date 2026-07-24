import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import sqlWasm from 'sql.js/dist/sql-wasm.wasm';
import { applyMigrations } from './schema';
import { loadSqliteFile, saveSqliteFile } from './persistence';

let sqlPromise: Promise<SqlJsStatic> | null = null;
let dbPromise: Promise<Database> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let activeDb: Database | null = null;

const PERSIST_DEBOUNCE_MS = 250;

const getSql = () => {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: () => {
        return sqlWasm;
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
    void saveSqliteFile(data);
  }, PERSIST_DEBOUNCE_MS);
};

export const getDb = async (): Promise<Database> => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await getSql();
      const saved = await loadSqliteFile();
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

  await saveSqliteFile(activeDb.export());
};
