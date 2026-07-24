import { InitialData } from 'src/types';
import { generateId } from 'src/utils';
import { createDefaultProjectModel } from './defaultProjectModel';
import { getDb, withDbWrite } from './client';
import { ProjectRecord } from './types';

type ProjectRow = {
  id: string;
  workspace_id: string;
  name: string;
  is_default: number;
  model_json: string;
  created_at: number;
  updated_at: number;
};

const rowToProject = (row: ProjectRow): ProjectRecord => {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    isDefault: Boolean(row.is_default),
    modelJson: row.model_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const listProjectsForWorkspace = async (
  workspaceId: string
): Promise<ProjectRecord[]> => {
  const db = await getDb();
  const statement = db.prepare(
    `
      SELECT id, workspace_id, name, is_default, model_json, created_at, updated_at
      FROM projects
      WHERE workspace_id = ?
      ORDER BY is_default DESC, created_at ASC
    `
  );
  statement.bind([workspaceId]);

  const projects: ProjectRecord[] = [];

  while (statement.step()) {
    projects.push(rowToProject(statement.getAsObject() as ProjectRow));
  }

  statement.free();
  return projects;
};

export const getProjectById = async (
  id: string
): Promise<ProjectRecord | null> => {
  const db = await getDb();
  const statement = db.prepare(
    `
      SELECT id, workspace_id, name, is_default, model_json, created_at, updated_at
      FROM projects
      WHERE id = ?
    `
  );
  statement.bind([id]);

  if (!statement.step()) {
    statement.free();
    return null;
  }

  const project = rowToProject(statement.getAsObject() as ProjectRow);
  statement.free();
  return project;
};

export const createProject = async (
  workspaceId: string,
  name: string
): Promise<ProjectRecord> => {
  const trimmedName = name.trim() || 'Untitled project';
  const now = Date.now();
  const model = createDefaultProjectModel(trimmedName);

  const project: ProjectRecord = {
    id: generateId(),
    workspaceId,
    name: trimmedName,
    isDefault: false,
    modelJson: JSON.stringify(model),
    createdAt: now,
    updatedAt: now
  };

  await withDbWrite((db) => {
    db.run(
      `
        INSERT INTO projects (
          id, workspace_id, name, is_default, model_json, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        project.id,
        project.workspaceId,
        project.name,
        project.isDefault ? 1 : 0,
        project.modelJson,
        project.createdAt,
        project.updatedAt
      ]
    );
  });

  return project;
};

export const updateProjectModel = async (
  id: string,
  model: InitialData | Record<string, unknown>
): Promise<void> => {
  await withDbWrite((db) => {
    db.run(
      `
        UPDATE projects
        SET model_json = ?, updated_at = ?
        WHERE id = ?
      `,
      [JSON.stringify(model), Date.now(), id]
    );
  });
};

export const deleteProject = async (id: string): Promise<void> => {
  const project = await getProjectById(id);

  if (!project) return;

  if (project.isDefault) {
    throw new Error('The default project cannot be deleted.');
  }

  await withDbWrite((db) => {
    db.run('DELETE FROM projects WHERE id = ?', [id]);
  });
};

export const parseProjectModel = (project: ProjectRecord): InitialData => {
  return JSON.parse(project.modelJson) as InitialData;
};
