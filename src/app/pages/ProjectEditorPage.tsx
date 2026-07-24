import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Isoflow from 'src/Isoflow';
import { InitialData, Model } from 'src/types';
import {
  getProjectById,
  getWorkspaceById,
  parseProjectModel,
  ProjectRecord,
  updateProjectModel,
  UserRecord,
  WorkspaceRecord
} from 'src/db';
import { AppShell } from '../components/AppShell';

type Props = {
  user: UserRecord;
};

export const ProjectEditorPage = ({ user }: Props) => {
  const { workspaceId = '', projectId = '' } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<WorkspaceRecord | null>(null);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [initialData, setInitialData] = useState<InitialData | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>(
    'saved'
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const nextWorkspace = await getWorkspaceById(workspaceId);
      const nextProject = await getProjectById(projectId);

      if (cancelled) return;

      if (
        !nextWorkspace ||
        !nextProject ||
        nextWorkspace.userId !== user.id ||
        nextProject.workspaceId !== workspaceId
      ) {
        setWorkspace(null);
        setProject(null);
        setInitialData(null);
        return;
      }

      setWorkspace(nextWorkspace);
      setProject(nextProject);
      setInitialData({
        ...parseProjectModel(nextProject),
        fitToView: true
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, user.id, workspaceId]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const onModelUpdated = useCallback(
    (model: Model) => {
      if (!project) return;

      setSaveState('saving');

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(async () => {
        try {
          await updateProjectModel(project.id, model);
          setSaveState('saved');
        } catch {
          setSaveState('error');
        }
      }, 400);
    },
    [project]
  );

  const saveLabel = useMemo(() => {
    if (saveState === 'saving') return 'Saving…';
    if (saveState === 'error') return 'Save failed';
    return 'Saved';
  }, [saveState]);

  if (!workspace || !project || !initialData) {
    return (
      <AppShell user={user} breadcrumbs={[{ label: 'Workspaces', to: '/' }]}>
        <Typography>Project not found.</Typography>
      </AppShell>
    );
  }

  return (
    <AppShell
      user={user}
      variant="editor"
      breadcrumbs={[
        { label: 'Workspaces', to: '/' },
        { label: workspace.name, to: `/workspaces/${workspace.id}` },
        { label: project.name }
      ]}
      actions={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {saveLabel}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              navigate(`/workspaces/${workspace.id}`);
            }}
          >
            Back to projects
          </Button>
        </Stack>
      }
    >
      <Isoflow
        key={project.id}
        initialData={initialData}
        width="100%"
        height="100%"
        onModelUpdated={onModelUpdated}
      />
    </AppShell>
  );
};
