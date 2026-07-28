import { getDb, withDbWrite } from './client';

export const META_LEGACY_IMPORTED = 'legacy_imported';

export const getMeta = async (key: string): Promise<string | null> => {
  const db = await getDb();
  const statement = db.prepare(
    `
      SELECT value FROM app_meta WHERE key = ? LIMIT 1
    `
  );
  statement.bind([key]);

  if (!statement.step()) {
    statement.free();
    return null;
  }

  const value = String((statement.getAsObject() as { value: string }).value);
  statement.free();
  return value;
};

export const setMeta = async (key: string, value: string): Promise<void> => {
  await withDbWrite((db) => {
    db.run(
      `
        INSERT INTO app_meta (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `,
      [key, value]
    );
  });
};

export const hasLegacyImported = async (): Promise<boolean> => {
  const value = await getMeta(META_LEGACY_IMPORTED);
  return value === '1';
};

export const markLegacyImported = async (): Promise<void> => {
  await setMeta(META_LEGACY_IMPORTED, '1');
};
