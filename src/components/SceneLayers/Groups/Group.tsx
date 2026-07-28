import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useScene } from 'src/hooks/useScene';
import { IsoTileArea } from 'src/components/IsoTileArea/IsoTileArea';
import { Label } from 'src/components/Label/Label';
import { useColor } from 'src/hooks/useColor';
import {
  getColorVariant,
  getGroupBounds,
  getTilePosition,
  sortByPosition
} from 'src/utils';
import { PROJECTED_TILE_SIZE } from 'src/config';

type Props = ReturnType<typeof useScene>['groups'][0];

export const Group = ({ id, name, color: colorId, memberIds }: Props) => {
  const { currentView } = useScene();
  const color = useColor(colorId);

  const bounds = useMemo(() => {
    return getGroupBounds(currentView, { id, name, color: colorId, memberIds });
  }, [currentView, id, name, colorId, memberIds]);

  const labelPosition = useMemo(() => {
    if (!bounds) return null;
    const sorted = sortByPosition([bounds.from, bounds.to]);
    return getTilePosition({
      tile: { x: sorted.lowX, y: sorted.lowY }
    });
  }, [bounds]);

  if (!bounds || !labelPosition) return null;

  return (
    <>
      <IsoTileArea
        from={bounds.from}
        to={bounds.to}
        fill={getColorVariant(color.value, 'light', { grade: 1, alpha: 0.2 })}
        cornerRadius={22}
        stroke={{
          color: getColorVariant(color.value, 'dark', { grade: 2 }),
          width: 2
        }}
      />
      <Box
        sx={{ position: 'absolute', pointerEvents: 'none' }}
        style={{
          maxWidth: PROJECTED_TILE_SIZE.width,
          left: labelPosition.x,
          top: labelPosition.y
        }}
      >
        <Label maxWidth={180} labelHeight={0} expandDirection="BOTTOM">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {name}
          </Typography>
        </Label>
      </Box>
    </>
  );
};
