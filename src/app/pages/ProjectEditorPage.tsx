import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Isoflow from 'src/Isoflow';
import { InitialData, Model } from 'src/types';
import { WS_BASE_URL } from 'src/api/config';
import {
  getProjectById,
  getWorkspaceById,
  parseProjectModel,
  ProjectRecord,
  updateProjectModel,
  UserRecord,
  WorkspaceRecord
} from 'src/api/client';
import { prepareModelForStorage } from 'src/db/icons';
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
  const [revision, setRevision] = useState(1);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>(
    'saved'
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revisionRef = useRef(1);
  const suppressSaveUntilRef = useRef(0);

  useEffect(() => {
    revisionRef.current = revision;
  }, [revision]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadError(null);
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
          setLoadError('Project not found.');
          return;
        }

        setWorkspace(nextWorkspace);
        setProject(nextProject);
        setRevision(nextProject.revision);
        revisionRef.current = nextProject.revision;
        setInitialData({
          ...parseProjectModel(nextProject),
          fitToView: true
        });
      } catch (err) {
        if (cancelled) return;
        setWorkspace(null);
        setProject(null);
        setInitialData(null);
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Failed to load project. Is the Isoflow server running on :9324?'
        );
      }
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

  const onRemoteRevision = useCallback((nextRevision: number) => {
    setRevision(nextRevision);
    revisionRef.current = nextRevision;
    suppressSaveUntilRef.current = Date.now() + 500;
    setSaveState('saved');
  }, []);

  const onModelUpdated = useCallback(
    (model: Model) => {
      if (!project) return;
      if (Date.now() < suppressSaveUntilRef.current) return;

      setSaveState('saving');

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(async () => {
        try {
          // Strip isopack payloads before PUT — otherwise every save ships ~2MB.
          const result = await updateProjectModel(
            project.id,
            prepareModelForStorage(model),
            revisionRef.current
          );
          setRevision(result.revision);
          revisionRef.current = result.revision;
          // Ignore the echo broadcast from our own save.
          suppressSaveUntilRef.current = Date.now() + 500;
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
      <AppShell breadcrumbs={[{ label: 'Workspaces', to: '/' }]}>
        <Typography>{loadError ?? 'Loading project…'}</Typography>
      </AppShell>
    );
  }

  return (
    <AppShell
      variant="editor"
      breadcrumbs={[
        { label: 'Workspaces', to: '/' },
        { label: workspace.name },
        { label: project.name }
      ]}
      actions={
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', minWidth: 0, flexShrink: 1 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap' }}
          >
            {saveLabel}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              navigate('/');
            }}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Back
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
        bridge={{
          url: WS_BASE_URL,
          projectId: project.id,
          knownRevision: revision,
          onRemoteRevision
        }}
      />
    </AppShell>
  );
};
