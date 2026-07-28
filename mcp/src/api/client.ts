import type { Icon, InitialData, Model } from '../../../src/types';
import { getApiUrl } from '../config';

export type ProjectSummary = {
  id: string;
  workspaceId: string;
  name: string;
  revision: number;
  createdAt: number;
  updatedAt: number;
};

export type WorkspaceSummary = {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
};

const baseUrl = () => {
  return getApiUrl();
};

const request = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(`${baseUrl()}${path}`, init);

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;

    try {
      const body = (await response.json()) as {
        error?: string;
        currentRevision?: number;
      };
      if (body.error) {
        detail = body.error;
        if (body.currentRevision !== undefined) {
          detail += ` (currentRevision=${body.currentRevision})`;
        }
      }
    } catch {
      // ignore
    }

    const error = new Error(detail) as Error & {
      status?: number;
      currentRevision?: number;
    };
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const listProjects = async (
  workspaceId?: string
): Promise<ProjectSummary[]> => {
  const query = workspaceId
    ? `?workspaceId=${encodeURIComponent(workspaceId)}`
    : '';
  const projects = await request<
    Array<ProjectSummary & { modelJson?: string }>
  >(`/api/projects${query}`);

  return projects.map((project) => {
    return {
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      revision: project.revision,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  });
};

export const listWorkspaces = async (): Promise<WorkspaceSummary[]> => {
  return request('/api/workspaces');
};

export const createWorkspace = async (
  name: string
): Promise<WorkspaceSummary> => {
  return request('/api/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
};

export const renameWorkspace = async (
  id: string,
  name: string
): Promise<WorkspaceSummary> => {
  return request(`/api/workspaces/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
};

export const deleteWorkspace = async (id: string): Promise<void> => {
  await request(`/api/workspaces/${id}`, { method: 'DELETE' });
};

export const getProjectByName = async (
  name: string,
  workspaceId?: string
): Promise<ProjectSummary | null> => {
  const query = workspaceId
    ? `?workspaceId=${encodeURIComponent(workspaceId)}`
    : '';
  const response = await fetch(
    `${baseUrl()}/api/projects/by-name/${encodeURIComponent(name)}${query}`
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as ProjectSummary;
};

export const createProject = async (
  workspaceId: string,
  name: string
): Promise<ProjectSummary> => {
  return request('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId, name })
  });
};

export const renameProject = async (
  id: string,
  name: string
): Promise<ProjectSummary> => {
  return request(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
};

export const deleteProject = async (id: string): Promise<void> => {
  await request(`/api/projects/${id}`, { method: 'DELETE' });
};

export const getProjectModel = async (
  projectId: string
): Promise<{ revision: number; model: InitialData }> => {
  return request(`/api/projects/${projectId}/model`);
};

export const putProjectModel = async (
  projectId: string,
  model: Model | InitialData,
  expectedRevision?: number
): Promise<{ revision: number; model: InitialData }> => {
  return request(`/api/projects/${projectId}/model`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, expectedRevision })
  });
};

export const listCustomIcons = async (): Promise<Icon[]> => {
  return request('/api/custom-icons');
};

export const upsertCustomIcons = async (icons: Icon[]): Promise<void> => {
  await request('/api/custom-icons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ icons })
  });
};

export const deleteCustomIcon = async (id: string): Promise<void> => {
  await request(`/api/custom-icons/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
};
