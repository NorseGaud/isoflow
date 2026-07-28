import React, { useEffect, useRef, useState } from 'react';
import { Box, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export type AppShellBreadcrumb = {
  label: string;
  to?: string;
  onRename?: (name: string) => void | Promise<void>;
};

type Props = {
  breadcrumbs?: AppShellBreadcrumb[];
  actions?: React.ReactNode;
  variant?: 'page' | 'editor';
  children?: React.ReactNode;
};

const EditableBreadcrumb = ({
  label,
  onRename
}: {
  label: string;
  onRename: (name: string) => void | Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(label);
    }
  }, [editing, label]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = async () => {
    const next = draft.trim();
    setEditing(false);

    if (!next || next === label) {
      setDraft(label);
      return;
    }

    await onRename(next);
  };

  if (editing) {
    return (
      <TextField
        inputRef={inputRef}
        size="small"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onBlur={() => {
          void commit();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void commit();
          }

          if (event.key === 'Escape') {
            event.preventDefault();
            setDraft(label);
            setEditing(false);
          }
        }}
        slotProps={{
          htmlInput: {
            'aria-label': `Rename ${label}`,
            maxLength: 100
          }
        }}
        sx={{
          minWidth: 0,
          maxWidth: 220,
          '& .MuiInputBase-input': {
            py: 0.25,
            px: 0.75,
            fontSize: '0.875rem',
            fontWeight: 500
          }
        }}
      />
    );
  }

  return (
    <Typography
      component="button"
      type="button"
      variant="body2"
      onClick={() => {
        setEditing(true);
      }}
      title="Click to rename"
      sx={{
        color: 'text.primary',
        fontWeight: 500,
        border: 0,
        background: 'none',
        p: 0,
        m: 0,
        cursor: 'text',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
        maxWidth: '100%',
        borderRadius: 0.5,
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}
    >
      {label}
    </Typography>
  );
};

export const AppShell = ({
  breadcrumbs = [],
  actions,
  variant = 'page',
  children
}: Props) => {
  return (
    <Box
      sx={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: (theme) => theme.customVars.customPalette.diagramBg
      }}
    >
      <Box
        sx={{
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%',
          px: { xs: 2, md: 4 },
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'grey.300',
          bgcolor: 'common.white',
          flexShrink: 0,
          minWidth: 0
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            minWidth: 0,
            width: '100%'
          }}
        >
          <Stack spacing={0.75} sx={{ minWidth: 0, flex: '1 1 auto' }}>
            <Typography
              component={RouterLink}
              to="/"
              variant="h5"
              sx={{
                color: 'text.primary',
                textDecoration: 'none',
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              Isoflow
            </Typography>
            {breadcrumbs.length > 0 && (
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  minWidth: 0,
                  overflow: 'hidden'
                }}
              >
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;

                  return (
                    <React.Fragment key={`${crumb.label}-${index}`}>
                      {index > 0 && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ flexShrink: 0 }}
                        >
                          /
                        </Typography>
                      )}
                      {crumb.onRename ? (
                        <EditableBreadcrumb
                          label={crumb.label}
                          onRename={crumb.onRename}
                        />
                      ) : crumb.to && !isLast ? (
                        <Typography
                          component={RouterLink}
                          to={crumb.to}
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            textDecoration: 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0
                          }}
                        >
                          {crumb.label}
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0
                          }}
                        >
                          {crumb.label}
                        </Typography>
                      )}
                    </React.Fragment>
                  );
                })}
              </Stack>
            )}
          </Stack>

          {actions && (
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: 'center',
                flexShrink: 0,
                maxWidth: '50%',
                minWidth: 0
              }}
            >
              {actions}
            </Stack>
          )}
        </Stack>
      </Box>

      {variant === 'page' ? (
        <Box
          sx={{
            boxSizing: 'border-box',
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
            overflow: 'auto',
            px: { xs: 2, md: 4 },
            py: { xs: 3, md: 4 }
          }}
        >
          <Box
            sx={{
              boxSizing: 'border-box',
              width: '100%',
              maxWidth: 960,
              mx: 'auto',
              minWidth: 0
            }}
          >
            {children}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            boxSizing: 'border-box',
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden'
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
};
