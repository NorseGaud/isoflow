import type { Database } from 'sql.js';

const MIGRATIONS: string[] = [
  `
    CREATE TABLE IF NOT EXISTS custom_icons (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      collection TEXT,
      is_isometric INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      model_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
  `,
  // Repair for DBs where migration 2 was recorded but only the first
  // statement ran (sql.js db.run executes a single statement).
  `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      model_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
  `
];

const runSql = (db: Database, sql: string) => {
  // sql.js db.run() only executes the first statement; exec runs all.
  db.exec(sql);
};

export const applyMigrations = (db: Database) => {
  runSql(db, 'PRAGMA foreign_keys = ON;');

  runSql(
    db,
    `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );
    `
  );

  const applied = new Set(
    (
      db.exec('SELECT id FROM schema_migrations')[0]?.values.map((row) => {
        return Number(row[0]);
      }) ?? []
    )
  );

  MIGRATIONS.forEach((sql, index) => {
    const migrationId = index + 1;

    if (applied.has(migrationId)) return;

    runSql(db, 'BEGIN;');

    try {
      runSql(db, sql);
      db.run('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)', [
        migrationId,
        Date.now()
      ]);
      runSql(db, 'COMMIT;');
    } catch (error) {
      runSql(db, 'ROLLBACK;');
      throw error;
    }
  });
};
