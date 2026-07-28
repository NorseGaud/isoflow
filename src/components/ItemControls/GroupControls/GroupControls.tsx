import React, { useMemo } from 'react';
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useGroup } from 'src/hooks/useGroup';
import { ColorSelector } from 'src/components/ColorSelector/ColorSelector';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useScene } from 'src/hooks/useScene';
import { useModelStore } from 'src/stores/modelStore';
import { getGroupConnectorIds } from 'src/utils';
import { ControlsContainer } from '../components/ControlsContainer';
import { Section } from '../components/Section';
import { DeleteButton } from '../components/DeleteButton';

interface Props {
  id: string;
}

export const GroupControls = ({ id }: Props) => {
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const group = useGroup(id);
  const { updateGroup, deleteGroup, items, currentView } = useScene();
  const modelItems = useModelStore((state) => state.items);

  const connectorCount = useMemo(() => {
    return getGroupConnectorIds(currentView, group).length;
  }, [currentView, group]);

  const memberOptions = useMemo(() => {
    return items
      .filter((item) => !group.memberIds.includes(item.id))
      .map((item) => {
        const modelItem = modelItems.find((entry) => entry.id === item.id);
        return {
          id: item.id,
          name: modelItem?.name ?? item.id
        };
      });
  }, [items, group.memberIds, modelItems]);

  const members = useMemo(() => {
    return group.memberIds.map((memberId) => {
      const modelItem = modelItems.find((entry) => entry.id === memberId);
      return {
        id: memberId,
        name: modelItem?.name ?? memberId
      };
    });
  }, [group.memberIds, modelItems]);

  return (
    <ControlsContainer>
      <Section title="Name">
        <TextField
          value={group.name}
          onChange={(e) => {
            updateGroup(group.id, { name: e.target.value as string });
          }}
        />
      </Section>
      <Section>
        <ColorSelector
          onChange={(color) => {
            updateGroup(group.id, { color });
          }}
          activeColor={group.color}
        />
      </Section>
      <Section title="Members">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {members.map((member) => {
            return (
              <Box
                key={member.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant="body2">{member.name}</Typography>
                <IconButton
                  size="small"
                  aria-label={`Remove ${member.name}`}
                  onClick={() => {
                    updateGroup(group.id, {
                      memberIds: group.memberIds.filter(
                        (memberId) => memberId !== member.id
                      )
                    });
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
          {memberOptions.length > 0 && (
            <Select
              displayEmpty
              value=""
              onChange={(e) => {
                const memberId = e.target.value as string;
                if (!memberId) return;
                updateGroup(group.id, {
                  memberIds: [...group.memberIds, memberId]
                });
              }}
            >
              <MenuItem value="" disabled>
                Add member
              </MenuItem>
              {memberOptions.map((option) => {
                return (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                );
              })}
            </Select>
          )}
        </Box>
      </Section>
      <Section title="Connectors">
        <Typography variant="body2">{connectorCount} in group</Typography>
      </Section>
      <Section>
        <Box>
          <DeleteButton
            onClick={() => {
              uiStateActions.setItemControls(null);
              deleteGroup(group.id);
            }}
          />
        </Box>
      </Section>
    </ControlsContainer>
  );
};
