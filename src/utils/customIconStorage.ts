import { Icon } from 'src/types';
import { listCustomIcons, upsertCustomIcons } from 'src/db/customIcons';
import { migrateLegacyCustomIcons } from 'src/db/migrateLegacyCustomIcons';

let migrationPromise: Promise<void> | null = null;

const ensureMigrated = () => {
  if (!migrationPromise) {
    migrationPromise = migrateLegacyCustomIcons().catch((error) => {
      console.error('Failed to migrate legacy custom icons', error);
    });
  }

  return migrationPromise;
};

export const getStoredCustomIcons = async (): Promise<Icon[]> => {
  try {
    await ensureMigrated();
    return await listCustomIcons();
  } catch (error) {
    console.error('Failed to load custom icons from SQLite', error);
    return [];
  }
};

export const addStoredCustomIcons = async (icons: Icon[]): Promise<void> => {
  if (icons.length === 0) return;

  try {
    await ensureMigrated();
    await upsertCustomIcons(icons);
  } catch (error) {
    console.error('Failed to save custom icons to SQLite', error);
  }
};

export const mergeIconsWithStoredCustomIcons = async (
  icons: Icon[]
): Promise<Icon[]> => {
  const storedCustomIcons = await getStoredCustomIcons();

  if (storedCustomIcons.length === 0) return icons;

  const existingIds = new Set(
    icons.map((icon) => {
      return icon.id;
    })
  );

  const missingCustomIcons = storedCustomIcons.filter((icon) => {
    return !existingIds.has(icon.id);
  });

  if (missingCustomIcons.length === 0) return icons;

  return [...missingCustomIcons, ...icons];
};
