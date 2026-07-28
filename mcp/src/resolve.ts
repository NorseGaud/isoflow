import {
  createProject,
  getProjectByName,
  listProjects,
  listWorkspaces,
  type ProjectSummary,
  type WorkspaceSummary
} from './api/client';

export const resolveWorkspaceByName = async (
  workspaceName: string
): Promise<WorkspaceSummary> => {
  const workspaces = await listWorkspaces();
  const matches = workspaces.filter((workspace) => {
    return workspace.name === workspaceName;
  });

  if (matches.length === 0) {
    throw new Error(`Workspace not found: "${workspaceName}"`);
  }

  if (matches.length > 1) {
    const ids = matches.map((workspace) => workspace.id).join(', ');
    throw new Error(
      `Ambiguous workspace name "${workspaceName}" (ids: ${ids}). Rename duplicates or use a unique name.`
    );
  }

  return matches[0];
};

export const resolveProjectByName = async (
  projectName: string,
  workspaceName?: string
): Promise<ProjectSummary> => {
  const workspace = workspaceName
    ? await resolveWorkspaceByName(workspaceName)
    : undefined;

  if (workspace) {
    const project = await getProjectByName(projectName, workspace.id);
    if (!project) {
      throw new Error(
        `Project not found: "${projectName}" in workspace "${workspaceName}"`
      );
    }
    return project;
  }

  const matches = (await listProjects()).filter((project) => {
    return project.name === projectName;
  });

  if (matches.length === 0) {
    const byName = await getProjectByName(projectName);
    if (byName) return byName;
    throw new Error(`Project not found: "${projectName}"`);
  }

  if (matches.length > 1) {
    const ids = matches.map((project) => project.id).join(', ');
    throw new Error(
      `Ambiguous project name "${projectName}" (ids: ${ids}). Pass workspaceName to disambiguate.`
    );
  }

  return matches[0];
};

export const ensureProject = async (
  projectName: string,
  workspaceName?: string
): Promise<ProjectSummary> => {
  const workspace = workspaceName
    ? await resolveWorkspaceByName(workspaceName)
    : undefined;

  const existing = await getProjectByName(projectName, workspace?.id);
  if (existing) return existing;

  let workspaceId = workspace?.id;
  if (!workspaceId) {
    const workspaces = await listWorkspaces();
    workspaceId = workspaces[0]?.id;
  }

  if (!workspaceId) {
    throw new Error('No workspace available on the Isoflow server');
  }

  return createProject(workspaceId, projectName);
};
