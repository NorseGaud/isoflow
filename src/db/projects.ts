import { InitialData, Model } from 'src/types';
import { generateId } from 'src/utils/common';
import { createDefaultProjectModel } from './defaultProjectModel';
import { getDb, withDbWrite } from './client';
import {
  prepareModelForClient,
  prepareModelForStorage
} from './icons';
import { ProjectRecord, RevisionConflictError } from './types';

type ProjectRow = {
  id: string;
  workspace_id: string;
  name: string;
  model_json: string;
  revision: number;
  created_at: number;
  updated_at: number;
};

const rowToProject = (row: ProjectRow): ProjectRecord => {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    modelJson: row.model_json,
    revision: Number(row.revision ?? 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const SELECT_PROJECT_COLUMNS = `
  id, workspace_id, name, model_json,
  COALESCE(revision, 1) AS revision,
  created_at, updated_at
`;

export const listProjectsForWorkspace = async (
  workspaceId: string
): Promise<ProjectRecord[]> => {
  const db = await getDb();
  const statement = db.prepare(
    `
      SELECT ${SELECT_PROJECT_COLUMNS}
      FROM projects
      WHERE workspace_id = ?
      ORDER BY created_at ASC
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

export const listAllProjects = async (): Promise<ProjectRecord[]> => {
  const db = await getDb();
  const statement = db.prepare(
    `
      SELECT ${SELECT_PROJECT_COLUMNS}
      FROM projects
      ORDER BY updated_at DESC
    `
  );

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
      SELECT ${SELECT_PROJECT_COLUMNS}
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

export const getProjectByName = async (
  name: string,
  workspaceId?: string
): Promise<ProjectRecord | null> => {
  const db = await getDb();
  const trimmed = name.trim();

  const statement = workspaceId
    ? db.prepare(
        `
          SELECT ${SELECT_PROJECT_COLUMNS}
          FROM projects
          WHERE workspace_id = ? AND lower(name) = lower(?)
          LIMIT 1
        `
      )
    : db.prepare(
        `
          SELECT ${SELECT_PROJECT_COLUMNS}
          FROM projects
          WHERE lower(name) = lower(?)
          ORDER BY updated_at DESC
          LIMIT 1
        `
      );

  if (workspaceId) {
    statement.bind([workspaceId, trimmed]);
  } else {
    statement.bind([trimmed]);
  }

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
  const model = prepareModelForStorage(createDefaultProjectModel(trimmedName));

  const project: ProjectRecord = {
    id: generateId(),
    workspaceId,
    name: trimmedName,
    modelJson: JSON.stringify(model),
    revision: 1,
    createdAt: now,
    updatedAt: now
  };

  await withDbWrite((db) => {
    db.run(
      `
        INSERT INTO projects (
          id, workspace_id, name, is_default, model_json, revision, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        project.id,
        project.workspaceId,
        project.name,
        0,
        project.modelJson,
        project.revision,
        project.createdAt,
        project.updatedAt
      ]
    );
  });

  return project;
};

export const renameProject = async (
  id: string,
  name: string
): Promise<ProjectRecord | null> => {
  const project = await getProjectById(id);

  if (!project) return null;

  const nextName = name.trim().slice(0, 100) || 'Untitled project';
  const model = prepareModelForStorage({
    ...JSON.parse(project.modelJson),
    title: nextName
  });
  const modelJson = JSON.stringify(model);
  const updatedAt = Date.now();

  await withDbWrite((db) => {
    db.run(
      `
        UPDATE projects
        SET name = ?, model_json = ?, updated_at = ?
        WHERE id = ?
      `,
      [nextName, modelJson, updatedAt, id]
    );
  });

  return {
    ...project,
    name: nextName,
    modelJson,
    updatedAt
  };
};

export type UpdateProjectModelResult = {
  revision: number;
  model: InitialData;
};

/**
 * Persist a model. When `expectedRevision` is provided, fails with
 * RevisionConflictError if the stored revision does not match.
 */
export const updateProjectModel = async (
  id: string,
  model: InitialData | Model | Record<string, unknown>,
  expectedRevision?: number
): Promise<UpdateProjectModelResult> => {
  const stored = prepareModelForStorage(model);

  const result = await withDbWrite((db) => {
    const current = db.prepare(
      `
        SELECT COALESCE(revision, 1) AS revision
        FROM projects
        WHERE id = ?
      `
    );
    current.bind([id]);

    if (!current.step()) {
      current.free();
      throw new Error(`Project not found: ${id}`);
    }

    const currentRevision = Number(
      (current.getAsObject() as { revision: number }).revision
    );
    current.free();

    if (
      expectedRevision !== undefined &&
      expectedRevision !== currentRevision
    ) {
      throw new RevisionConflictError(currentRevision);
    }

    const nextRevision = currentRevision + 1;

    db.run(
      `
        UPDATE projects
        SET model_json = ?, updated_at = ?, revision = ?
        WHERE id = ?
      `,
      [JSON.stringify(stored), Date.now(), nextRevision, id]
    );

    return {
      revision: nextRevision,
      model: prepareModelForClient(stored)
    };
  });

  return result;
};

export const deleteProject = async (id: string): Promise<void> => {
  const project = await getProjectById(id);

  if (!project) return;

  await withDbWrite((db) => {
    db.run('DELETE FROM projects WHERE id = ?', [id]);
  });
};

export const parseProjectModel = (project: ProjectRecord): InitialData => {
  const parsed = JSON.parse(project.modelJson) as Model;
  return prepareModelForClient(parsed);
};

/** Rewrite all stored project models to strip embedded isopack icons. */
export const stripStoredProjectIcons = async (): Promise<number> => {
  const projects = await listAllProjects();
  let updated = 0;

  await withDbWrite((db) => {
    projects.forEach((project) => {
      const parsed = JSON.parse(project.modelJson) as Model;
      const stripped = prepareModelForStorage(parsed);
      const before = JSON.stringify(parsed.icons ?? []);
      const after = JSON.stringify(stripped.icons);

      if (before === after) return;

      db.run(
        `
          UPDATE projects
          SET model_json = ?
          WHERE id = ?
        `,
        [JSON.stringify(stripped), project.id]
      );
      updated += 1;
    });
  });

  return updated;
};
