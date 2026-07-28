import type { Database } from 'sql.js';
import {
  openSqliteBytes,
  withDbWrite,
  markLegacyImported,
  hasLegacyImported,
  stripStoredProjectIcons
} from '../src/db';

const copyTable = (
  source: Database,
  target: Database,
  table: string,
  columns: string[]
) => {
  const colList = columns.join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const select = source.prepare(`SELECT ${colList} FROM ${table}`);
  const insert = target.prepare(
    `
      INSERT OR REPLACE INTO ${table} (${colList})
      VALUES (${placeholders})
    `
  );

  let count = 0;

  while (select.step()) {
    const row = select.get();
    insert.run(row as (string | number | null | Uint8Array)[]);
    count += 1;
  }

  select.free();
  insert.free();
  return count;
};

export type LegacyImportResult = {
  imported: boolean;
  alreadyImported: boolean;
  users: number;
  workspaces: number;
  projects: number;
  customIcons: number;
};

export const importLegacySqliteBytes = async (
  bytes: Uint8Array
): Promise<LegacyImportResult> => {
  if (await hasLegacyImported()) {
    return {
      imported: false,
      alreadyImported: true,
      users: 0,
      workspaces: 0,
      projects: 0,
      customIcons: 0
    };
  }

  const source = await openSqliteBytes(bytes);

  try {
    const counts = await withDbWrite((target) => {
      const users = copyTable(source, target, 'users', [
        'id',
        'name',
        'is_default',
        'created_at'
      ]);
      const workspaces = copyTable(source, target, 'workspaces', [
        'id',
        'user_id',
        'name',
        'is_default',
        'created_at'
      ]);

      // projects may lack revision in older DBs
      let projects = 0;
      const hasRevision = source.exec(
        `PRAGMA table_info(projects)`
      )[0]?.values.some((row) => {
        return String(row[1]) === 'revision';
      });

      if (hasRevision) {
        projects = copyTable(source, target, 'projects', [
          'id',
          'workspace_id',
          'name',
          'is_default',
          'model_json',
          'revision',
          'created_at',
          'updated_at'
        ]);
      } else {
        const select = source.prepare(
          `
            SELECT id, workspace_id, name, is_default, model_json, created_at, updated_at
            FROM projects
          `
        );
        const insert = target.prepare(
          `
            INSERT OR REPLACE INTO projects (
              id, workspace_id, name, is_default, model_json, revision, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, 1, ?, ?)
          `
        );

        while (select.step()) {
          insert.run(select.get() as (string | number | null | Uint8Array)[]);
          projects += 1;
        }

        select.free();
        insert.free();
      }

      let customIcons = 0;

      try {
        customIcons = copyTable(source, target, 'custom_icons', [
          'id',
          'name',
          'url',
          'collection',
          'is_isometric',
          'created_at'
        ]);
      } catch {
        customIcons = 0;
      }

      return { users, workspaces, projects, customIcons };
    });

    await stripStoredProjectIcons();
    await markLegacyImported();

    return {
      imported: true,
      alreadyImported: false,
      ...counts
    };
  } finally {
    source.close();
  }
};
