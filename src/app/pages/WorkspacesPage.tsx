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
  renameProject,
  renameWorkspace,
  UserRecord,
  WorkspaceRecord
} from 'src/api/client';
import { AppShell } from '../components/AppShell';
import { NameDialog } from '../components/NameDialog';
import { WorkspaceList } from '../components/WorkspaceList';

type Props = {
  user: UserRecord;
};

type NameDialogState =
  | { type: 'create-workspace' }
  | { type: 'create-project'; workspaceId: string }
  | { type: 'rename-workspace'; id: string; name: string }
  | { type: 'rename-project'; id: string; name: string }
  | null;

export const WorkspacesPage = ({ user }: Props) => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [projectsByWorkspace, setProjectsByWorkspace] = useState<
    Record<string, ProjectRecord[]>
  >({});
  const [nameDialog, setNameDialog] = useState<NameDialogState>(null);
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
          setNameDialog({ type: 'create-workspace' });
        }}
        onRenameWorkspace={(id) => {
          const workspace = workspaces.find((item) => item.id === id);
          if (!workspace) return;
          setNameDialog({
            type: 'rename-workspace',
            id,
            name: workspace.name
          });
        }}
        onCreateProject={(workspaceId) => {
          setNameDialog({ type: 'create-project', workspaceId });
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
        onRenameProject={(projectId) => {
          const project = Object.values(projectsByWorkspace)
            .flat()
            .find((item) => item.id === projectId);
          if (!project) return;
          setNameDialog({
            type: 'rename-project',
            id: projectId,
            name: project.name
          });
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
        open={nameDialog?.type === 'create-workspace'}
        title="Create workspace"
        label="Workspace name"
        onClose={() => {
          setNameDialog(null);
        }}
        onConfirm={async (name) => {
          setNameDialog(null);
          await createWorkspace(user.id, name);
          await refresh();
        }}
      />

      <NameDialog
        open={nameDialog?.type === 'create-project'}
        title="Create project"
        label="Project name"
        onClose={() => {
          setNameDialog(null);
        }}
        onConfirm={async (name) => {
          if (nameDialog?.type !== 'create-project') return;

          const { workspaceId } = nameDialog;
          setNameDialog(null);
          const project = await createProject(workspaceId, name);
          await refresh();
          navigate(`/workspaces/${workspaceId}/projects/${project.id}`);
        }}
      />

      <NameDialog
        open={nameDialog?.type === 'rename-workspace'}
        title="Rename workspace"
        label="Workspace name"
        confirmLabel="Rename"
        initialValue={
          nameDialog?.type === 'rename-workspace' ? nameDialog.name : ''
        }
        onClose={() => {
          setNameDialog(null);
        }}
        onConfirm={async (name) => {
          if (nameDialog?.type !== 'rename-workspace') return;

          const { id } = nameDialog;
          setNameDialog(null);

          try {
            setError(null);
            await renameWorkspace(id, name);
            await refresh();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : 'Failed to rename workspace'
            );
          }
        }}
      />

      <NameDialog
        open={nameDialog?.type === 'rename-project'}
        title="Rename project"
        label="Project name"
        confirmLabel="Rename"
        initialValue={
          nameDialog?.type === 'rename-project' ? nameDialog.name : ''
        }
        onClose={() => {
          setNameDialog(null);
        }}
        onConfirm={async (name) => {
          if (nameDialog?.type !== 'rename-project') return;

          const { id } = nameDialog;
          setNameDialog(null);

          try {
            setError(null);
            await renameProject(id, name);
            await refresh();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : 'Failed to rename project'
            );
          }
        }}
      />
    </AppShell>
  );
};
