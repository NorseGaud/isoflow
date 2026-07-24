import { generateId } from 'src/utils';
import { getDb, withDbWrite } from './client';
import { createDefaultProjectModel } from './defaultProjectModel';
import { WorkspaceRecord } from './types';

type WorkspaceRow = {
  id: string;
  user_id: string;
  name: string;
  is_default: number;
  created_at: number;
};

const rowToWorkspace = (row: WorkspaceRow): WorkspaceRecord => {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at
  };
};

export const listWorkspacesForUser = async (
  userId: string
): Promise<WorkspaceRecord[]> => {
  const db = await getDb();
  const statement = db.prepare(
    `
      SELECT id, user_id, name, is_default, created_at
      FROM workspaces
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at ASC
    `
  );
  statement.bind([userId]);

  const workspaces: WorkspaceRecord[] = [];

  while (statement.step()) {
    workspaces.push(rowToWorkspace(statement.getAsObject() as WorkspaceRow));
  }

  statement.free();
  return workspaces;
};

export const getWorkspaceById = async (
  id: string
): Promise<WorkspaceRecord | null> => {
  const db = await getDb();
  const statement = db.prepare(
    `
      SELECT id, user_id, name, is_default, created_at
      FROM workspaces
      WHERE id = ?
    `
  );
  statement.bind([id]);

  if (!statement.step()) {
    statement.free();
    return null;
  }

  const workspace = rowToWorkspace(statement.getAsObject() as WorkspaceRow);
  statement.free();
  return workspace;
};

export const createWorkspace = async (
  userId: string,
  name: string
): Promise<WorkspaceRecord> => {
  const now = Date.now();
  const workspace: WorkspaceRecord = {
    id: generateId(),
    userId,
    name: name.trim() || 'Untitled workspace',
    isDefault: false,
    createdAt: now
  };
  const defaultProjectModel = createDefaultProjectModel('Default');

  await withDbWrite((db) => {
    db.run(
      `
        INSERT INTO workspaces (id, user_id, name, is_default, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        workspace.id,
        workspace.userId,
        workspace.name,
        workspace.isDefault ? 1 : 0,
        workspace.createdAt
      ]
    );

    db.run(
      `
        INSERT INTO projects (
          id, workspace_id, name, is_default, model_json, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        generateId(),
        workspace.id,
        'Default',
        1,
        JSON.stringify(defaultProjectModel),
        now,
        now
      ]
    );
  });

  return workspace;
};

export const deleteWorkspace = async (id: string): Promise<void> => {
  const workspace = await getWorkspaceById(id);

  if (!workspace) return;

  if (workspace.isDefault) {
    throw new Error('The default workspace cannot be deleted.');
  }

  await withDbWrite((db) => {
    db.run('DELETE FROM projects WHERE workspace_id = ?', [id]);
    db.run('DELETE FROM workspaces WHERE id = ?', [id]);
  });
};
