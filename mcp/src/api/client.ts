import type { InitialData, Model } from '../../../src/types';

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
  return process.env.ISOFLOW_API_URL ?? 'http://localhost:9324';
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

    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const listProjects = async (): Promise<ProjectSummary[]> => {
  const projects = await request<
    Array<ProjectSummary & { modelJson?: string }>
  >('/api/projects');

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

export const getProjectByName = async (
  name: string
): Promise<ProjectSummary | null> => {
  const response = await fetch(
    `${baseUrl()}/api/projects/by-name/${encodeURIComponent(name)}`
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

export const ensureProject = async (
  projectName: string
): Promise<ProjectSummary> => {
  const existing = await getProjectByName(projectName);
  if (existing) return existing;

  const workspaces = await listWorkspaces();
  const workspaceId = workspaces[0]?.id;

  if (!workspaceId) {
    throw new Error('No workspace available on the Isoflow server');
  }

  return createProject(workspaceId, projectName);
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
