import React from 'react';
import {
  Slider,
  Box,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material';
import { ModelItem, ViewItem } from 'src/types';
import { MarkdownEditor } from 'src/components/MarkdownEditor/MarkdownEditor';
import { useModelItem } from 'src/hooks/useModelItem';
import { useIcon } from 'src/hooks/useIcon';
import { isNodeLabelVisible, resolveLabelHeight } from 'src/utils';
import { DeleteButton } from '../../components/DeleteButton';
import { Section } from '../../components/Section';
import { ROTATION_MARKS, snapRotation } from './rotationSlider';

export type NodeUpdates = {
  model: Partial<ModelItem>;
  view: Partial<ViewItem>;
};

interface Props {
  node: ViewItem;
  onModelItemUpdated: (updates: Partial<ModelItem>) => void;
  onViewItemUpdated: (updates: Partial<ViewItem>) => void;
  onDeleted: () => void;
}

export const NodeSettings = ({
  node,
  onModelItemUpdated,
  onViewItemUpdated,
  onDeleted
}: Props) => {
  const modelItem = useModelItem(node.id);
  const { icon } = useIcon(modelItem.icon);

  return (
    <>
      <Section title="Name">
        <TextField
          value={modelItem.name}
          onChange={(e) => {
            const text = e.target.value as string;
            if (modelItem.name !== text) onModelItemUpdated({ name: text });
          }}
        />
      </Section>
      <Section title="Description">
        <MarkdownEditor
          value={modelItem.description}
          onChange={(text) => {
            if (modelItem.description !== text)
              onModelItemUpdated({ description: text });
          }}
        />
      </Section>
      <Section>
        <FormControlLabel
          control={
            <Switch
              checked={isNodeLabelVisible(node.showLabel)}
              onChange={(e) => {
                onViewItemUpdated({ showLabel: e.target.checked });
              }}
            />
          }
          label="Show label on canvas"
        />
      </Section>
      {modelItem.name && isNodeLabelVisible(node.showLabel) && (
        <Section title="Label height">
          <Slider
            marks
            step={20}
            min={60}
            max={280}
            value={resolveLabelHeight(node.labelHeight)}
            onChange={(e, newHeight) => {
              const labelHeight = newHeight as number;
              onViewItemUpdated({ labelHeight });
            }}
          />
        </Section>
      )}
      {!icon.isIsometric && (
        <Section title="Rotation">
          <Slider
            marks={ROTATION_MARKS}
            step={1}
            min={0}
            max={360}
            value={node.rotation ?? 0}
            onChange={(e, newRotation) => {
              const rotation = snapRotation(newRotation as number);
              onViewItemUpdated({ rotation });
            }}
          />
        </Section>
      )}
      <Section>
        <Box>
          <DeleteButton onClick={onDeleted} />
        </Box>
      </Section>
    </>
  );
};
