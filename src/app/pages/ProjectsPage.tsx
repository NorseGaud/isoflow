import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createProject,
  deleteProject,
  getWorkspaceById,
  listProjectsForWorkspace,
  ProjectRecord,
  UserRecord,
  WorkspaceRecord
} from 'src/db';
import { AppShell } from '../components/AppShell';
import { EntityList } from '../components/EntityList';
import { NameDialog } from '../components/NameDialog';

type Props = {
  user: UserRecord;
};

export const ProjectsPage = ({ user }: Props) => {
  const { workspaceId = '' } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<WorkspaceRecord | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const nextWorkspace = await getWorkspaceById(workspaceId);

    if (!nextWorkspace || nextWorkspace.userId !== user.id) {
      setWorkspace(null);
      setProjects([]);
      return;
    }

    setWorkspace(nextWorkspace);
    setProjects(await listProjectsForWorkspace(workspaceId));
  }, [user.id, workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!workspace) {
    return (
      <AppShell user={user} breadcrumbs={[{ label: 'Workspaces', to: '/' }]}>
        <p>Workspace not found.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      user={user}
      breadcrumbs={[
        { label: 'Workspaces', to: '/' },
        { label: workspace.name }
      ]}
    >
      {error && (
        <p style={{ color: '#df004c', marginTop: 0 }}>{error}</p>
      )}
      <EntityList
        title="Projects"
        description={`Projects in ${workspace.name}. Each project is an Isoflow board.`}
        createLabel="New project"
        emptyLabel="No projects yet."
        items={projects.map((project) => {
          return {
            id: project.id,
            name: project.name,
            isDefault: project.isDefault,
            meta: `Updated ${new Date(project.updatedAt).toLocaleString()}`
          };
        })}
        onCreate={() => {
          setIsCreateOpen(true);
        }}
        onOpen={(id) => {
          navigate(`/workspaces/${workspaceId}/projects/${id}`);
        }}
        onDelete={async (id) => {
          try {
            setError(null);
            await deleteProject(id);
            await refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete project');
          }
        }}
      />

      <NameDialog
        open={isCreateOpen}
        title="Create project"
        label="Project name"
        onClose={() => {
          setIsCreateOpen(false);
        }}
        onConfirm={async (name) => {
          setIsCreateOpen(false);
          const project = await createProject(workspaceId, name);
          await refresh();
          navigate(`/workspaces/${workspaceId}/projects/${project.id}`);
        }}
      />
    </AppShell>
  );
};
