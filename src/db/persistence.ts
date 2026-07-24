const IDB_NAME = 'isoflow-sqlite';
const IDB_STORE = 'database';
const IDB_KEY = 'main';
const IDB_VERSION = 1;

const canUseIndexedDb = () => {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
};

const openPersistenceDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open SQLite persistence store'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
  });
};

export const loadSqliteFile = async (): Promise<Uint8Array | null> => {
  if (!canUseIndexedDb()) return null;

  try {
    const db = await openPersistenceDb();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(IDB_STORE, 'readonly');
      const store = transaction.objectStore(IDB_STORE);
      const request = store.get(IDB_KEY);

      request.onsuccess = () => {
        const result = request.result;

        if (!result) {
          resolve(null);
          return;
        }

        resolve(result instanceof Uint8Array ? result : new Uint8Array(result));
      };

      request.onerror = () => {
        reject(request.error ?? new Error('Failed to load SQLite file'));
      };
    });
  } catch (error) {
    console.error('Failed to load SQLite database file', error);
    return null;
  }
};

export const saveSqliteFile = async (data: Uint8Array): Promise<void> => {
  if (!canUseIndexedDb()) return;

  try {
    const db = await openPersistenceDb();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(IDB_STORE, 'readwrite');
      const store = transaction.objectStore(IDB_STORE);
      store.put(data, IDB_KEY);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error ?? new Error('Failed to save SQLite file'));
      };
    });
  } catch (error) {
    console.error('Failed to save SQLite database file', error);
  }
};
