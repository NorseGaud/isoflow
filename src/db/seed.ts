import { withDbWrite } from './client';
import { createDefaultProjectModel } from './defaultProjectModel';
import { DEFAULT_USER_ID } from './users';

export const DEFAULT_WORKSPACE_ID = 'workspace-default';
export const DEFAULT_PROJECT_ID = 'project-default';

export const seedDefaults = async (): Promise<void> => {
  await withDbWrite((db) => {
    const existingStatement = db.prepare(
      'SELECT id FROM users WHERE id = ? LIMIT 1'
    );
    existingStatement.bind([DEFAULT_USER_ID]);
    const alreadySeeded = existingStatement.step();
    existingStatement.free();

    if (alreadySeeded) {
      return;
    }

    const now = Date.now();
    const defaultModel = createDefaultProjectModel('Default');

    db.run(
      `
        INSERT INTO users (id, name, is_default, created_at)
        VALUES (?, ?, ?, ?)
      `,
      [DEFAULT_USER_ID, 'Admin', 1, now]
    );

    db.run(
      `
        INSERT INTO workspaces (id, user_id, name, is_default, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      [DEFAULT_WORKSPACE_ID, DEFAULT_USER_ID, 'Default', 1, now]
    );

    db.run(
      `
        INSERT INTO projects (
          id, workspace_id, name, is_default, model_json, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        DEFAULT_PROJECT_ID,
        DEFAULT_WORKSPACE_ID,
        'Default',
        1,
        JSON.stringify(defaultModel),
        now,
        now
      ]
    );
  });
};
