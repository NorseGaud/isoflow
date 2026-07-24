import React from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

export type EntityListItem = {
  id: string;
  name: string;
  isDefault: boolean;
  meta?: string;
};

type Props = {
  title: string;
  description: string;
  items: EntityListItem[];
  createLabel: string;
  emptyLabel: string;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

export const EntityList = ({
  title,
  description,
  items,
  createLabel,
  emptyLabel,
  onCreate,
  onOpen,
  onDelete
}: Props) => {
  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>
          {createLabel}
        </Button>
      </Stack>

      {items.length === 0 ? (
        <Box
          sx={{
            p: 4,
            borderRadius: 2,
            bgcolor: 'common.white',
            border: '1px solid',
            borderColor: 'grey.300'
          }}
        >
          <Typography color="text.secondary">{emptyLabel}</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => {
            return (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'common.white',
                  border: '1px solid',
                  borderColor: 'grey.300',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => {
                  onOpen(item.id);
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                    {item.isDefault && (
                      <Chip size="small" label="Default" color="primary" />
                    )}
                  </Stack>
                  {item.meta && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {item.meta}
                    </Typography>
                  )}
                </Box>

                <IconButton
                  aria-label={`Delete ${item.name}`}
                  disabled={item.isDefault}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(item.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
                <ChevronRightIcon color="action" />
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};
