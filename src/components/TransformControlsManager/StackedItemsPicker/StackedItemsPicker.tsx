import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const hasOptionName = (option: StackedItemOption) => {
  return Boolean(option.name.trim());
};

export const StackedItemsPicker = ({
  tile,
  selectedId,
  options,
  onSelect
}: Props) => {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const position = useMemo(() => {
    return getTilePosition({ tile, origin: 'BOTTOM' });
  }, [tile]);

  const useInlineLayout = options.some((option) => {
    return !hasOptionName(option);
  });

  useEffect(() => {
    setAnchorEl(anchorRef.current);
    setIsOpen(true);
  }, [tile, options.length]);

  if (options.length < 2) {
    return null;
  }

  return (
    <>
      <Box
        ref={anchorRef}
        sx={{
          position: 'absolute',
          zIndex: 2,
          width: 0,
          height: 0
        }}
        style={{
          left: position.x + PROJECTED_TILE_SIZE.width * 0.35,
          top: position.y - PROJECTED_TILE_SIZE.height * 0.75
        }}
      />

      <Popover
        open={isOpen && Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setIsOpen(false);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <Stack
          direction={useInlineLayout ? 'row' : 'column'}
          data-layout={useInlineLayout ? 'row' : 'column'}
          role="listbox"
          aria-label="Stacked icons"
          sx={{
            minWidth: useInlineLayout ? 280 : 220,
            maxWidth: useInlineLayout ? 360 : 280,
            py: 0.5,
            alignItems: 'stretch'
          }}
        >
          {options.map((option) => {
            const isSelected = option.id === selectedId;
            const named = hasOptionName(option);
            const iconSize = useInlineLayout && !named ? 48 : 28;

            return (
              <ButtonBase
                key={option.id}
                role="option"
                aria-selected={isSelected}
                aria-label={named ? undefined : 'Untitled icon'}
                onClick={() => {
                  onSelect(option.id);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: named ? 'row' : 'column',
                  alignItems: 'center',
                  justifyContent: named ? 'flex-start' : 'center',
                  gap: named ? 1 : 0,
                  flex: named ? '1 1 0' : '0 0 auto',
                  minWidth: named ? 0 : iconSize + 24,
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
                      width: iconSize,
                      height: iconSize,
                      objectFit: 'contain',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: iconSize,
                      height: iconSize,
                      flexShrink: 0
                    }}
                  />
                )}
                {(named || option.description) && (
                  <Box sx={{ minWidth: 0, flex: named ? 1 : undefined }}>
                    {named && (
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontWeight: 600 }}
                      >
                        {option.name}
                      </Typography>
                    )}
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
                )}
              </ButtonBase>
            );
          })}
        </Stack>
      </Popover>
    </>
  );
};
