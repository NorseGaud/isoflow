export type SqlitePersistenceAdapter = {
  load: () => Promise<Uint8Array | null>;
  save: (data: Uint8Array) => Promise<void>;
};

export type LocateWasm = () => string;

export type DbConfig = {
  adapter: SqlitePersistenceAdapter;
  locateWasm: LocateWasm;
};
