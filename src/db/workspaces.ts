import { generateId } from 'src/utils/common';
import { getDb, withDbWrite } from './client';
import { WorkspaceRecord } from './types';

type WorkspaceRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: number;
};

const rowToWorkspace = (row: WorkspaceRow): WorkspaceRecord => {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at
  };
};

export const listWorkspacesForUser = async (
  userId: string
): Promise<WorkspaceRecord[]> => {
  const db = await getDb();
  const statement = db.prepare(
    `
      SELECT id, user_id, name, created_at
      FROM workspaces
      WHERE user_id = ?
      ORDER BY created_at ASC
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
      SELECT id, user_id, name, created_at
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
  const workspace: WorkspaceRecord = {
    id: generateId(),
    userId,
    name: name.trim() || 'Untitled workspace',
    createdAt: Date.now()
  };

  await withDbWrite((db) => {
    db.run(
      `
        INSERT INTO workspaces (id, user_id, name, is_default, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      [workspace.id, workspace.userId, workspace.name, 0, workspace.createdAt]
    );
  });

  return workspace;
};

export const renameWorkspace = async (
  id: string,
  name: string
): Promise<WorkspaceRecord | null> => {
  const workspace = await getWorkspaceById(id);

  if (!workspace) return null;

  const nextName = name.trim().slice(0, 100) || 'Untitled workspace';

  await withDbWrite((db) => {
    db.run('UPDATE workspaces SET name = ? WHERE id = ?', [nextName, id]);
  });

  return {
    ...workspace,
    name: nextName
  };
};

export const deleteWorkspace = async (id: string): Promise<void> => {
  const workspace = await getWorkspaceById(id);

  if (!workspace) return;

  await withDbWrite((db) => {
    db.run('DELETE FROM projects WHERE workspace_id = ?', [id]);
    db.run('DELETE FROM workspaces WHERE id = ?', [id]);
  });
};
