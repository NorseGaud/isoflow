import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { UserRecord } from 'src/db';

type Props = {
  user: UserRecord;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: React.ReactNode;
  variant?: 'page' | 'editor';
  children?: React.ReactNode;
};

export const AppShell = ({
  user,
  breadcrumbs = [],
  actions,
  variant = 'page',
  children
}: Props) => {
  return (
    <Box
      sx={{
        minHeight: variant === 'page' ? '100vh' : undefined,
        height: variant === 'editor' ? '100vh' : undefined,
        display: variant === 'editor' ? 'flex' : undefined,
        flexDirection: variant === 'editor' ? 'column' : undefined,
        backgroundColor: (theme) => theme.customVars.customPalette.diagramBg
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 5 },
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'grey.300',
          bgcolor: 'common.white',
          flexShrink: 0
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Stack spacing={1}>
            <Typography
              component={RouterLink}
              to="/"
              variant="h5"
              sx={{
                color: 'text.primary',
                textDecoration: 'none',
                fontWeight: 700
              }}
            >
              Isoflow
            </Typography>
            {breadcrumbs.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;

                  return (
                    <React.Fragment key={`${crumb.label}-${index}`}>
                      {index > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          /
                        </Typography>
                      )}
                      {crumb.to && !isLast ? (
                        <Typography
                          component={RouterLink}
                          to={crumb.to}
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            textDecoration: 'none'
                          }}
                        >
                          {crumb.label}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.primary">
                          {crumb.label}
                        </Typography>
                      )}
                    </React.Fragment>
                  );
                })}
              </Stack>
            )}
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            {actions}
            <Chip
              label={`${user.name} (signed in)`}
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Stack>
      </Box>

      {variant === 'page' ? (
        <Box sx={{ px: { xs: 2, md: 5 }, py: 4, maxWidth: 960, mx: 'auto' }}>
          {children}
        </Box>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
      )}
    </Box>
  );
};
