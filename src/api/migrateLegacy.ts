import { readLegacySqliteBlob } from 'src/db/adapters/indexedDb';
import { hasLegacyImported, importLegacySqliteBytes } from './client';

let migratePromise: Promise<void> | null = null;

/**
 * If the browser still has an IndexedDB SQLite blob and the server has not
 * imported it yet, upload the bytes once.
 */
export const migrateLegacyBrowserDb = (): Promise<void> => {
  if (!migratePromise) {
    migratePromise = (async () => {
      try {
        if (await hasLegacyImported()) return;

        const blob = await readLegacySqliteBlob();

        if (!blob || blob.byteLength === 0) return;

        await importLegacySqliteBytes(blob);
      } catch (error) {
        console.error('Failed to migrate legacy IndexedDB database', error);
      }
    })();
  }

  return migratePromise;
};
