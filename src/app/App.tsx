import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAppUser } from './hooks/useAppUser';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { ProjectEditorPage } from './pages/ProjectEditorPage';

const LoadingScreen = ({ message }: { message: string }) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        overflow: 'hidden'
      }}
    >
      <CircularProgress size={28} />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
};

export const App = () => {
  const { user, error, isLoading } = useAppUser();

  if (isLoading) {
    return <LoadingScreen message="Starting Isoflow…" />;
  }

  if (error || !user) {
    return <LoadingScreen message={error ?? 'Unable to load user'} />;
  }

  return (
    <Box sx={{ width: '100%', height: '100%', minWidth: 0, overflow: 'hidden' }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WorkspacesPage user={user} />} />
          <Route
            path="/workspaces/:workspaceId/projects/:projectId"
            element={<ProjectEditorPage user={user} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Box>
  );
};
