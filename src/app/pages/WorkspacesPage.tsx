import React, { useCallback, useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  createProject,
  createWorkspace,
  deleteProject,
  deleteWorkspace,
  listProjectsForWorkspace,
  listWorkspacesForUser,
  ProjectRecord,
  UserRecord,
  WorkspaceRecord
} from 'src/api/client';
import { AppShell } from '../components/AppShell';
import { NameDialog } from '../components/NameDialog';
import { WorkspaceList } from '../components/WorkspaceList';

type Props = {
  user: UserRecord;
};

type CreateDialog =
  | { type: 'workspace' }
  | { type: 'project'; workspaceId: string }
  | null;

export const WorkspacesPage = ({ user }: Props) => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [projectsByWorkspace, setProjectsByWorkspace] = useState<
    Record<string, ProjectRecord[]>
  >({});
  const [createDialog, setCreateDialog] = useState<CreateDialog>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const nextWorkspaces = await listWorkspacesForUser(user.id);
    const projectEntries = await Promise.all(
      nextWorkspaces.map(async (workspace) => {
        const projects = await listProjectsForWorkspace(workspace.id);
        return [workspace.id, projects] as const;
      })
    );

    setWorkspaces(nextWorkspaces);
    setProjectsByWorkspace(Object.fromEntries(projectEntries));
  }, [user.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AppShell breadcrumbs={[{ label: 'Workspaces' }]}>
      {error && (
        <Typography color="secondary" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <WorkspaceList
        workspaces={workspaces}
        projectsByWorkspace={projectsByWorkspace}
        onCreateWorkspace={() => {
          setCreateDialog({ type: 'workspace' });
        }}
        onCreateProject={(workspaceId) => {
          setCreateDialog({ type: 'project', workspaceId });
        }}
        onDeleteWorkspace={async (id) => {
          try {
            setError(null);
            await deleteWorkspace(id);
            await refresh();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : 'Failed to delete workspace'
            );
          }
        }}
        onOpenProject={(workspaceId, projectId) => {
          navigate(`/workspaces/${workspaceId}/projects/${projectId}`);
        }}
        onDeleteProject={async (projectId) => {
          try {
            setError(null);
            await deleteProject(projectId);
            await refresh();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : 'Failed to delete project'
            );
          }
        }}
      />

      <NameDialog
        open={createDialog?.type === 'workspace'}
        title="Create workspace"
        label="Workspace name"
        onClose={() => {
          setCreateDialog(null);
        }}
        onConfirm={async (name) => {
          setCreateDialog(null);
          await createWorkspace(user.id, name);
          await refresh();
        }}
      />

      <NameDialog
        open={createDialog?.type === 'project'}
        title="Create project"
        label="Project name"
        onClose={() => {
          setCreateDialog(null);
        }}
        onConfirm={async (name) => {
          if (createDialog?.type !== 'project') return;

          const { workspaceId } = createDialog;
          setCreateDialog(null);
          const project = await createProject(workspaceId, name);
          await refresh();
          navigate(`/workspaces/${workspaceId}/projects/${project.id}`);
        }}
      />
    </AppShell>
  );
};
