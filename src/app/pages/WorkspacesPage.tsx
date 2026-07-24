import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createWorkspace,
  deleteWorkspace,
  listWorkspacesForUser,
  UserRecord,
  WorkspaceRecord
} from 'src/db';
import { AppShell } from '../components/AppShell';
import { EntityList } from '../components/EntityList';
import { NameDialog } from '../components/NameDialog';

type Props = {
  user: UserRecord;
};

export const WorkspacesPage = ({ user }: Props) => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await listWorkspacesForUser(user.id);
    setWorkspaces(next);
  }, [user.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AppShell
      user={user}
      breadcrumbs={[{ label: 'Workspaces' }]}
    >
      {error && (
        <p style={{ color: '#df004c', marginTop: 0 }}>{error}</p>
      )}
      <EntityList
        title="Workspaces"
        description="Organize your diagrams into workspaces. Open the default workspace or create a new one."
        createLabel="New workspace"
        emptyLabel="No workspaces yet."
        items={workspaces.map((workspace) => {
          return {
            id: workspace.id,
            name: workspace.name,
            isDefault: workspace.isDefault,
            meta: new Date(workspace.createdAt).toLocaleString()
          };
        })}
        onCreate={() => {
          setIsCreateOpen(true);
        }}
        onOpen={(id) => {
          navigate(`/workspaces/${id}`);
        }}
        onDelete={async (id) => {
          try {
            setError(null);
            await deleteWorkspace(id);
            await refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete workspace');
          }
        }}
      />

      <NameDialog
        open={isCreateOpen}
        title="Create workspace"
        label="Workspace name"
        onClose={() => {
          setIsCreateOpen(false);
        }}
        onConfirm={async (name) => {
          setIsCreateOpen(false);
          const workspace = await createWorkspace(user.id, name);
          await refresh();
          navigate(`/workspaces/${workspace.id}`);
        }}
      />
    </AppShell>
  );
};
