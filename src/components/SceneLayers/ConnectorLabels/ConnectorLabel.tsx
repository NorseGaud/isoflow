import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useScene } from 'src/hooks/useScene';
import { useColor } from 'src/hooks/useColor';
import {
  getTilePosition,
  resolveConnectorLabelStyle,
  resolveConnectorLabelTile
} from 'src/utils';
import { PROJECTED_TILE_SIZE } from 'src/config';
import { Label } from 'src/components/Label/Label';
import type { Coords } from 'src/types';

interface Props {
  connector: ReturnType<typeof useScene>['connectors'][0];
  nodeTiles: Coords[];
}

export const ConnectorLabel = ({ connector, nodeTiles }: Props) => {
  const color = useColor(connector.color);
  const labelPosition = useMemo(() => {
    const tile = resolveConnectorLabelTile({
      path: connector.path,
      nodeTiles
    });

    return getTilePosition({ tile });
  }, [connector.path, nodeTiles]);

  const labelStyle = useMemo(() => {
    return resolveConnectorLabelStyle(connector.labelEmphasis, color.value);
  }, [connector.labelEmphasis, color.value]);

  return (
    <Box
      sx={{ position: 'absolute', pointerEvents: 'none' }}
      style={{
        maxWidth: PROJECTED_TILE_SIZE.width,
        left: labelPosition.x,
        top: labelPosition.y
      }}
    >
      <Label maxWidth={150} labelHeight={0} sx={labelStyle.container}>
        <Typography variant="body2" sx={labelStyle.text}>
          {connector.description}
        </Typography>
      </Label>
    </Box>
  );
};
