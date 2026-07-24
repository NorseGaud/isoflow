import { Icon } from 'src/types';
import { CUSTOM_ICON_COLLECTION } from 'src/config';
import { getDb, withDbWrite } from './client';

type CustomIconRow = {
  id: string;
  name: string;
  url: string;
  collection: string | null;
  is_isometric: number;
};

const rowToIcon = (row: CustomIconRow): Icon => {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    collection: row.collection ?? CUSTOM_ICON_COLLECTION,
    isIsometric: Boolean(row.is_isometric)
  };
};

export const listCustomIcons = async (): Promise<Icon[]> => {
  const db = await getDb();
  const statement = db.prepare(
    `
      SELECT id, name, url, collection, is_isometric
      FROM custom_icons
      ORDER BY created_at ASC
    `
  );

  const icons: Icon[] = [];

  while (statement.step()) {
    icons.push(rowToIcon(statement.getAsObject() as CustomIconRow));
  }

  statement.free();

  return icons;
};

export const upsertCustomIcons = async (icons: Icon[]): Promise<void> => {
  if (icons.length === 0) return;

  await withDbWrite((db) => {
    const statement = db.prepare(
      `
        INSERT INTO custom_icons (id, name, url, collection, is_isometric, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          url = excluded.url,
          collection = excluded.collection,
          is_isometric = excluded.is_isometric
      `
    );

    const createdAt = Date.now();

    icons.forEach((icon, index) => {
      statement.run([
        icon.id,
        icon.name,
        icon.url,
        icon.collection ?? CUSTOM_ICON_COLLECTION,
        icon.isIsometric ? 1 : 0,
        createdAt + index
      ]);
    });

    statement.free();
  });
};

export const deleteCustomIcon = async (id: string): Promise<void> => {
  await withDbWrite((db) => {
    db.run('DELETE FROM custom_icons WHERE id = ?', [id]);
  });
};
