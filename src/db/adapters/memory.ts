import type { SqlitePersistenceAdapter } from './types';

/** In-memory adapter for tests — never touches disk or IndexedDB. */
export const createMemoryAdapter = (
  initial?: Uint8Array | null
): SqlitePersistenceAdapter => {
  let stored: Uint8Array | null = initial ?? null;

  return {
    load: async () => {
      return stored ? new Uint8Array(stored) : null;
    },
    save: async (data) => {
      stored = new Uint8Array(data);
    }
  };
};
