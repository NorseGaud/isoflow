import type { Database } from 'sql.js';
import { withDbWrite } from './client';
import { createDefaultProjectModel } from './defaultProjectModel';
import { DEFAULT_USER_ID } from './users';

/** Stable IDs used only for the first-launch seed rows. */
export const INITIAL_WORKSPACE_ID = 'workspace-initial';
export const INITIAL_PROJECT_ID = 'project-initial';

const INITIAL_NAME = 'Default';

const hasRow = (db: Database, sql: string, params: string[]) => {
  const statement = db.prepare(sql);
  statement.bind(params);
  const exists = statement.step();
  statement.free();
  return exists;
};

export const seedDefaults = async (): Promise<void> => {
  await withDbWrite((db) => {
    const now = Date.now();
    const initialModel = createDefaultProjectModel(INITIAL_NAME);

    if (
      !hasRow(db, 'SELECT id FROM users WHERE id = ? LIMIT 1', [DEFAULT_USER_ID])
    ) {
      db.run(
        `
          INSERT INTO users (id, name, is_default, created_at)
          VALUES (?, ?, ?, ?)
        `,
        [DEFAULT_USER_ID, 'Admin', 1, now]
      );
    }

    // Prefer the modern seed IDs; also recognize the older seed IDs so we
    // don't create a second "Default" workspace for existing browsers.
    const hasWorkspace =
      hasRow(db, 'SELECT id FROM workspaces WHERE user_id = ? LIMIT 1', [
        DEFAULT_USER_ID
      ]);

    if (!hasWorkspace) {
      db.run(
        `
          INSERT INTO workspaces (id, user_id, name, is_default, created_at)
          VALUES (?, ?, ?, ?, ?)
        `,
        [INITIAL_WORKSPACE_ID, DEFAULT_USER_ID, INITIAL_NAME, 0, now]
      );
    }

    const workspaceId = (() => {
      const statement = db.prepare(
        `
          SELECT id FROM workspaces
          WHERE user_id = ?
          ORDER BY created_at ASC
          LIMIT 1
        `
      );
      statement.bind([DEFAULT_USER_ID]);
      const id = statement.step()
        ? String((statement.getAsObject() as { id: string }).id)
        : INITIAL_WORKSPACE_ID;
      statement.free();
      return id;
    })();

    const hasProject = hasRow(
      db,
      'SELECT id FROM projects WHERE workspace_id = ? LIMIT 1',
      [workspaceId]
    );

    if (!hasProject) {
      db.run(
        `
          INSERT INTO projects (
            id, workspace_id, name, is_default, model_json, revision, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          INITIAL_PROJECT_ID,
          workspaceId,
          INITIAL_NAME,
          0,
          JSON.stringify(initialModel),
          1,
          now,
          now
        ]
      );
    }
  });
};
