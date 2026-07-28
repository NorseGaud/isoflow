import { getDb } from './client';
import { seedDefaults } from './seed';
import { stripStoredProjectIcons } from './projects';

let initPromise: Promise<void> | null = null;

/** Open SQLite, run migrations, and ensure the default Admin hierarchy exists. */
export const initializeAppDb = () => {
  if (!initPromise) {
    initPromise = (async () => {
      await getDb();
      await seedDefaults();
      // One-time compaction for DBs that still embed full isopack icon URLs.
      await stripStoredProjectIcons();
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
};

/** Reset initialize latch — for tests only. */
export const resetInitializeAppDbForTests = () => {
  initPromise = null;
};
