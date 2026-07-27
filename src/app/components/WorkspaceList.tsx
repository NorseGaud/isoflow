import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
  FolderOutlined as FolderIcon,
  AccountTreeOutlined as ProjectIcon
} from '@mui/icons-material';
import { ProjectRecord, WorkspaceRecord } from 'src/db';

type Props = {
  workspaces: WorkspaceRecord[];
  projectsByWorkspace: Record<string, ProjectRecord[]>;
  onCreateWorkspace: () => void;
  onDeleteWorkspace: (id: string) => void;
  onCreateProject: (workspaceId: string) => void;
  onOpenProject: (workspaceId: string, projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
};

export const WorkspaceList = ({
  workspaces,
  projectsByWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onCreateProject,
  onOpenProject,
  onDeleteProject
}: Props) => {
  return (
    <Stack spacing={3} sx={{ width: '100%', minWidth: 0 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          justifyContent: 'space-between',
          gap: 2,
          minWidth: 0
        }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Workspaces
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create workspaces and projects here. Open a project to start
            diagramming.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateWorkspace}
          sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
        >
          New workspace
        </Button>
      </Stack>

      {workspaces.length === 0 ? (
        <Box
          sx={{
            boxSizing: 'border-box',
            p: 4,
            borderRadius: 2,
            bgcolor: 'common.white',
            border: '1px solid',
            borderColor: 'grey.300',
            width: '100%',
            minWidth: 0
          }}
        >
          <Typography color="text.secondary">No workspaces yet.</Typography>
        </Box>
      ) : (
        <Stack spacing={2} sx={{ width: '100%', minWidth: 0 }}>
          {workspaces.map((workspace) => {
            const projects = projectsByWorkspace[workspace.id] ?? [];

            return (
              <Box
                key={workspace.id}
                sx={{
                  boxSizing: 'border-box',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.300',
                  bgcolor: 'common.white',
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 2,
                    minWidth: 0
                  }}
                >
                  <FolderIcon color="primary" sx={{ flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0
                      }}
                    >
                      {workspace.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {projects.length}{' '}
                      {projects.length === 1 ? 'project' : 'projects'}
                    </Typography>
                  </Box>
                  <IconButton
                    aria-label={`Delete ${workspace.name}`}
                    sx={{ flexShrink: 0 }}
                    onClick={() => {
                      onDeleteWorkspace(workspace.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    px: 2,
                    pb: 1.5,
                    pt: 0,
                    bgcolor: (theme) =>
                      theme.customVars.customPalette.diagramBg
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 1,
                      pt: 1.25,
                      pb: 0.75,
                      minWidth: 0
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontWeight: 600
                      }}
                    >
                      Projects
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        onCreateProject(workspace.id);
                      }}
                      sx={{ flexShrink: 0 }}
                    >
                      New project
                    </Button>
                  </Stack>

                  {projects.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ px: 1, pb: 1 }}
                    >
                      No projects yet. Create one to get started.
                    </Typography>
                  ) : (
                    <Stack
                      spacing={0.75}
                      sx={{
                        width: '100%',
                        minWidth: 0,
                        pl: 1.5,
                        borderLeft: '2px solid',
                        borderColor: 'primary.light'
                      }}
                    >
                      {projects.map((project) => {
                        return (
                          <Box
                            key={project.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              py: 0.75,
                              px: 1.25,
                              borderRadius: 1,
                              cursor: 'pointer',
                              minWidth: 0,
                              bgcolor: 'transparent',
                              '&:hover': {
                                bgcolor: 'common.white'
                              },
                              '&:hover .project-name': {
                                color: 'primary.main'
                              }
                            }}
                            onClick={() => {
                              onOpenProject(workspace.id, project.id);
                            }}
                          >
                            <ProjectIcon
                              sx={{
                                flexShrink: 0,
                                fontSize: 16,
                                color: 'text.disabled'
                              }}
                            />
                            <Box
                              sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}
                            >
                              <Typography
                                className="project-name"
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  color: 'text.primary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  minWidth: 0
                                }}
                              >
                                {project.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Updated{' '}
                                {new Date(project.updatedAt).toLocaleString()}
                              </Typography>
                            </Box>
                            <IconButton
                              aria-label={`Delete ${project.name}`}
                              size="small"
                              sx={{
                                flexShrink: 0,
                                opacity: 0.55,
                                '&:hover': { opacity: 1 }
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                onDeleteProject(project.id);
                              }}
                            >
                              <DeleteIcon fontSize="inherit" />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};
