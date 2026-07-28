import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { SqlitePersistenceAdapter } from '../../src/db/adapters/types';

export const DEFAULT_DB_PATH = path.join(
  os.homedir(),
  '.isoflow',
  'isoflow.sqlite'
);

export const createFsAdapter = (
  filePath: string = DEFAULT_DB_PATH
): SqlitePersistenceAdapter => {
  return {
    load: async () => {
      try {
        const data = await fs.readFile(filePath);
        return new Uint8Array(data);
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') return null;
        throw error;
      }
    },
    save: async (data) => {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const tmpPath = `${filePath}.tmp`;
      await fs.writeFile(tmpPath, data);
      await fs.rename(tmpPath, filePath);
    }
  };
};
