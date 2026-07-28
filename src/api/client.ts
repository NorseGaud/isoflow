import type { Icon, InitialData, Model } from 'src/types';
import { prepareModelForClient } from 'src/db/icons';
import type {
  ProjectRecord,
  UserRecord,
  WorkspaceRecord
} from 'src/db/types';
import { RevisionConflictError } from 'src/db/types';
import { API_BASE_URL } from './config';

type UpdateProjectModelResult = {
  revision: number;
  model: InitialData;
};

const apiUrl = (path: string) => {
  return `${API_BASE_URL}${path}`;
};

const handleJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const body = (await response.json()) as {
        error?: string;
        currentRevision?: number;
      };

      if (
        response.status === 409 &&
        typeof body.currentRevision === 'number'
      ) {
        throw new RevisionConflictError(body.currentRevision);
      }

      if (body.error) message = body.error;
    } catch (error) {
      if (error instanceof RevisionConflictError) throw error;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const initializeAppDb = async (): Promise<void> => {
  const response = await fetch(apiUrl('/api/health'));
  await handleJson<{ ok: boolean }>(response);
};

export const getDefaultUser = async (): Promise<UserRecord> => {
  const response = await fetch(apiUrl('/api/users/default'));
  return handleJson<UserRecord>(response);
};

export const getUserById = async (id: string): Promise<UserRecord | null> => {
  const user = await getDefaultUser();
  return user.id === id ? user : null;
};

export const listWorkspacesForUser = async (
  userId: string
): Promise<WorkspaceRecord[]> => {
  const response = await fetch(
    apiUrl(`/api/workspaces?userId=${encodeURIComponent(userId)}`)
  );
  return handleJson<WorkspaceRecord[]>(response);
};

export const getWorkspaceById = async (
  id: string
): Promise<WorkspaceRecord | null> => {
  const response = await fetch(apiUrl(`/api/workspaces/${id}`));

  if (response.status === 404) return null;

  return handleJson<WorkspaceRecord>(response);
};

export const createWorkspace = async (
  userId: string,
  name: string
): Promise<WorkspaceRecord> => {
  const response = await fetch(apiUrl('/api/workspaces'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name })
  });
  return handleJson<WorkspaceRecord>(response);
};

export const renameWorkspace = async (
  id: string,
  name: string
): Promise<WorkspaceRecord> => {
  const response = await fetch(apiUrl(`/api/workspaces/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return handleJson<WorkspaceRecord>(response);
};

export const deleteWorkspace = async (id: string): Promise<void> => {
  const response = await fetch(apiUrl(`/api/workspaces/${id}`), {
    method: 'DELETE'
  });
  await handleJson<void>(response);
};

export const listProjectsForWorkspace = async (
  workspaceId: string
): Promise<ProjectRecord[]> => {
  const response = await fetch(
    apiUrl(`/api/projects?workspaceId=${encodeURIComponent(workspaceId)}`)
  );
  return handleJson<ProjectRecord[]>(response);
};

export const getProjectById = async (
  id: string
): Promise<ProjectRecord | null> => {
  const response = await fetch(apiUrl(`/api/projects/${id}`));

  if (response.status === 404) return null;

  return handleJson<ProjectRecord>(response);
};

export const getProjectByName = async (
  name: string,
  workspaceId?: string
): Promise<ProjectRecord | null> => {
  const query = workspaceId
    ? `?workspaceId=${encodeURIComponent(workspaceId)}`
    : '';
  const response = await fetch(
    apiUrl(`/api/projects/by-name/${encodeURIComponent(name)}${query}`)
  );

  if (response.status === 404) return null;

  return handleJson<ProjectRecord>(response);
};

export const createProject = async (
  workspaceId: string,
  name: string
): Promise<ProjectRecord> => {
  const response = await fetch(apiUrl('/api/projects'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId, name })
  });
  return handleJson<ProjectRecord>(response);
};

export const updateProjectModel = async (
  id: string,
  model: InitialData | Model | Record<string, unknown>,
  expectedRevision?: number
): Promise<UpdateProjectModelResult> => {
  const response = await fetch(apiUrl(`/api/projects/${id}/model`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, expectedRevision })
  });
  return handleJson<UpdateProjectModelResult>(response);
};

export const renameProject = async (
  id: string,
  name: string
): Promise<ProjectRecord> => {
  const response = await fetch(apiUrl(`/api/projects/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return handleJson<ProjectRecord>(response);
};

export const deleteProject = async (id: string): Promise<void> => {
  const response = await fetch(apiUrl(`/api/projects/${id}`), {
    method: 'DELETE'
  });
  await handleJson<void>(response);
};

export const parseProjectModel = (project: ProjectRecord): InitialData => {
  const parsed = JSON.parse(project.modelJson) as Model;
  return prepareModelForClient(parsed);
};

export const getProjectModel = async (
  id: string
): Promise<UpdateProjectModelResult> => {
  const response = await fetch(apiUrl(`/api/projects/${id}/model`));
  return handleJson<UpdateProjectModelResult>(response);
};

export const listCustomIcons = async (): Promise<Icon[]> => {
  const response = await fetch(apiUrl('/api/custom-icons'));
  return handleJson<Icon[]>(response);
};

export const upsertCustomIcons = async (icons: Icon[]): Promise<void> => {
  const response = await fetch(apiUrl('/api/custom-icons'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ icons })
  });
  await handleJson<void>(response);
};

export const deleteCustomIcon = async (id: string): Promise<void> => {
  const response = await fetch(apiUrl(`/api/custom-icons/${id}`), {
    method: 'DELETE'
  });
  await handleJson<void>(response);
};

export const hasLegacyImported = async (): Promise<boolean> => {
  const response = await fetch(apiUrl('/api/meta/legacy-imported'));
  const body = await handleJson<{ imported: boolean }>(response);
  return body.imported;
};

export const importLegacySqliteBytes = async (
  bytes: Uint8Array
): Promise<unknown> => {
  const body = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  const response = await fetch(apiUrl('/api/import/legacy'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body
  });
  return handleJson(response);
};

export type { UserRecord, WorkspaceRecord, ProjectRecord };
export { RevisionConflictError };

export const DEFAULT_USER_ID = 'user-admin';
