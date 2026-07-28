import React, { useMemo, useState } from 'react';
import {
  Box,
  Popover,
  Stack,
  Typography,
  ButtonBase
} from '@mui/material';
import { Coords } from 'src/types';
import { getTilePosition } from 'src/utils';
import { PROJECTED_TILE_SIZE } from 'src/config';
import { StackedItemOption } from './getStackedItemOptions';

interface Props {
  tile: Coords;
  selectedId: string;
  options: StackedItemOption[];
  onSelect: (id: string) => void;
}

export const StackedItemsPicker = ({
  tile,
  selectedId,
  options,
  onSelect
}: Props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const position = useMemo(() => {
    return getTilePosition({ tile, origin: 'BOTTOM' });
  }, [tile]);

  if (options.length < 2) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          zIndex: 2
        }}
        style={{
          left: position.x + PROJECTED_TILE_SIZE.width * 0.35,
          top: position.y - PROJECTED_TILE_SIZE.height * 0.75
        }}
      >
        <ButtonBase
          aria-label={`${options.length} icons`}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            setAnchorEl(e.currentTarget);
          }}
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 1,
            bgcolor: 'common.white',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 1,
            typography: 'caption',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          {`${options.length} icons`}
        </ButtonBase>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <Stack sx={{ minWidth: 220, maxWidth: 280, py: 0.5 }}>
          {options.map((option) => {
            const isSelected = option.id === selectedId;

            return (
              <ButtonBase
                key={option.id}
                onClick={() => {
                  onSelect(option.id);
                  setAnchorEl(null);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  textAlign: 'left',
                  bgcolor: isSelected ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                {option.iconUrl ? (
                  <Box
                    component="img"
                    src={option.iconUrl}
                    alt=""
                    sx={{
                      width: 24,
                      height: 24,
                      objectFit: 'contain',
                      flexShrink: 0,
                      mt: 0.25
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      flexShrink: 0,
                      mt: 0.25
                    }}
                  />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ fontWeight: 600 }}
                  >
                    {option.name}
                  </Typography>
                  {option.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {option.description}
                    </Typography>
                  )}
                </Box>
              </ButtonBase>
            );
          })}
        </Stack>
      </Popover>
    </>
  );
};
