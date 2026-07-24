import { Icon } from 'src/types';
import { listCustomIcons, upsertCustomIcons } from './customIcons';

const LEGACY_DB_NAME = 'isoflow-custom-icons';
const LEGACY_STORE_NAME = 'icons';
const LEGACY_DB_VERSION = 1;

const canUseIndexedDb = () => {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
};

const readLegacyCustomIcons = async (): Promise<Icon[]> => {
  if (!canUseIndexedDb()) return [];

  return new Promise((resolve) => {
    const request = indexedDB.open(LEGACY_DB_NAME, LEGACY_DB_VERSION);

    request.onerror = () => {
      resolve([]);
    };

    request.onupgradeneeded = () => {
      // Do not create legacy stores; absence means there is nothing to migrate.
    };

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(LEGACY_STORE_NAME)) {
        db.close();
        indexedDB.deleteDatabase(LEGACY_DB_NAME);
        resolve([]);
        return;
      }

      const transaction = db.transaction(LEGACY_STORE_NAME, 'readonly');
      const store = transaction.objectStore(LEGACY_STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        db.close();
        resolve((getAllRequest.result as Icon[]) ?? []);
      };

      getAllRequest.onerror = () => {
        db.close();
        resolve([]);
      };
    };
  });
};

const clearLegacyCustomIcons = async (): Promise<void> => {
  if (!canUseIndexedDb()) return;

  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(LEGACY_DB_NAME);

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      resolve();
    };
    request.onblocked = () => {
      resolve();
    };
  });
};

/** One-time move from the old IndexedDB icon store into SQLite. */
export const migrateLegacyCustomIcons = async (): Promise<void> => {
  const legacyIcons = await readLegacyCustomIcons();

  if (legacyIcons.length === 0) return;

  const existing = await listCustomIcons();
  const existingIds = new Set(
    existing.map((icon) => {
      return icon.id;
    })
  );
  const toImport = legacyIcons.filter((icon) => {
    return !existingIds.has(icon.id);
  });

  if (toImport.length > 0) {
    await upsertCustomIcons(toImport);
  }

  await clearLegacyCustomIcons();
};
