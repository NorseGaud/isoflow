import React, { useCallback } from 'react';
import { Connector, ConnectorStyleEnum } from 'src/types';
import { connectorStyleOptions } from 'src/validation/sceneItems';
import {
  useTheme,
  Box,
  Slider,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { useSceneStore } from 'src/stores/sceneStore';
import { useConnector } from 'src/hooks/useConnector';
import { ColorSelector } from 'src/components/ColorSelector/ColorSelector';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { ControlsContainer } from '../components/ControlsContainer';
import { Section } from '../components/Section';
import { DeleteButton } from '../components/DeleteButton';

interface Props {
  id: string;
}

export const ConnectorControls = ({ id }: Props) => {
  const theme = useTheme();
  const sceneActions = useSceneStore((state) => {
    return state.actions;
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const connector = useConnector(id);

  const onConnectorUpdated = useCallback(
    (updates: Partial<Connector>) => {
      sceneActions.updateConnector(id, updates);
    },
    [sceneActions, id]
  );

  const onConnectorDeleted = useCallback(() => {
    uiStateActions.setItemControls(null);
    sceneActions.deleteConnector(id);
  }, [sceneActions, id, uiStateActions]);

  return (
    <ControlsContainer>
      <Section>
        <TextField
          label="Label"
          value={connector.label}
          onChange={(e) => {
            return onConnectorUpdated({ label: e.target.value as string });
          }}
        />
      </Section>
      <Section>
        <ColorSelector
          colors={Object.values(theme.customVars.customPalette)}
          onChange={(color) => {
            return onConnectorUpdated({ color });
          }}
          activeColor={connector.color}
        />
      </Section>
      <Section title="Width">
        <Slider
          marks
          step={10}
          min={10}
          max={30}
          value={connector.width}
          onChange={(e, newWidth) => {
            onConnectorUpdated({ width: newWidth as number });
          }}
        />
      </Section>
      <Section title="Style">
        <Select
          value={connector.style}
          onChange={(e) => {
            return onConnectorUpdated({
              style: e.target.value as ConnectorStyleEnum
            });
          }}
        >
          {Object.values(connectorStyleOptions).map((style) => {
            return <MenuItem value={style}>{style}</MenuItem>;
          })}
        </Select>
      </Section>
      <Section>
        <Box>
          <DeleteButton onClick={onConnectorDeleted} />
        </Box>
      </Section>
    </ControlsContainer>
  );
};
