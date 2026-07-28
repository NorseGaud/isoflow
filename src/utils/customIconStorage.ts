import { Icon } from 'src/types';
import { listCustomIcons, upsertCustomIcons } from 'src/api/client';

export const getStoredCustomIcons = async (): Promise<Icon[]> => {
  try {
    return await listCustomIcons();
  } catch (error) {
    console.error('Failed to load custom icons from API', error);
    return [];
  }
};

export const addStoredCustomIcons = async (icons: Icon[]): Promise<void> => {
  if (icons.length === 0) return;

  try {
    await upsertCustomIcons(icons);
  } catch (error) {
    console.error('Failed to save custom icons via API', error);
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
