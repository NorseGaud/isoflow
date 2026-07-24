import { getDb } from './client';
import { seedDefaults } from './seed';

let initPromise: Promise<void> | null = null;

/** Open SQLite, run migrations, and ensure the default Admin hierarchy exists. */
export const initializeAppDb = () => {
  if (!initPromise) {
    initPromise = (async () => {
      await getDb();
      await seedDefaults();
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
};
