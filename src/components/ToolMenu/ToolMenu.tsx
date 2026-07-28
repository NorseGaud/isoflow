import React, { useCallback, useEffect } from 'react';
import { Stack, Typography } from '@mui/material';
import {
  PanToolOutlined as PanToolIcon,
  NearMeOutlined as NearMeIcon,
  AddOutlined as AddIcon,
  EastOutlined as ConnectorIcon,
  CropSquareOutlined as CropSquareIcon,
  Title as TitleIcon,
  CategoryOutlined as GroupIcon
} from '@mui/icons-material';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { IconButton } from 'src/components/IconButton/IconButton';
import { UiElement } from 'src/components/UiElement/UiElement';
import { useScene } from 'src/hooks/useScene';
import { TEXTBOX_DEFAULTS } from 'src/config';
import { generateId } from 'src/utils';

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName;

  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable
  );
};

export const ToolMenu = () => {
  const { createTextBox } = useScene();
  const mode = useUiStateStore((state) => {
    return state.mode;
  });
  const uiStateStoreActions = useUiStateStore((state) => {
    return state.actions;
  });
  const mousePosition = useUiStateStore((state) => {
    return state.mouse.position.tile;
  });

  const selectSelectTool = useCallback(() => {
    uiStateStoreActions.setMode({
      type: 'CURSOR',
      showCursor: true,
      mousedownItem: null
    });
  }, [uiStateStoreActions]);

  const selectPanTool = useCallback(() => {
    uiStateStoreActions.setMode({
      type: 'PAN',
      showCursor: false
    });

    uiStateStoreActions.setItemControls(null);
  }, [uiStateStoreActions]);

  const selectAddItemTool = useCallback(() => {
    uiStateStoreActions.setItemControls({
      type: 'ADD_ITEM'
    });
    uiStateStoreActions.setMode({
      type: 'PLACE_ICON',
      showCursor: true,
      id: null
    });
  }, [uiStateStoreActions]);

  const selectRectangleTool = useCallback(() => {
    uiStateStoreActions.setMode({
      type: 'RECTANGLE.DRAW',
      showCursor: true,
      id: null
    });
  }, [uiStateStoreActions]);

  const selectConnectorTool = useCallback(() => {
    uiStateStoreActions.setMode({
      type: 'CONNECTOR',
      id: null,
      showCursor: true
    });
  }, [uiStateStoreActions]);

  const selectTextTool = useCallback(() => {
    const textBoxId = generateId();

    createTextBox({
      ...TEXTBOX_DEFAULTS,
      id: textBoxId,
      tile: mousePosition
    });

    uiStateStoreActions.setMode({
      type: 'TEXTBOX',
      showCursor: false,
      id: textBoxId
    });
  }, [uiStateStoreActions, createTextBox, mousePosition]);

  const selectGroupTool = useCallback(() => {
    uiStateStoreActions.setMode({
      type: 'GROUP.DRAW',
      showCursor: true,
      region: null
    });
  }, [uiStateStoreActions]);

  useEffect(() => {
    const toolShortcuts: Record<string, () => void> = {
      Digit1: selectSelectTool,
      Digit2: selectPanTool,
      Digit3: selectAddItemTool,
      Digit4: selectRectangleTool,
      Digit5: selectConnectorTool,
      Digit6: selectTextTool,
      Digit7: selectGroupTool
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (isEditableTarget(e.target)) return;

      const selectTool = toolShortcuts[e.code];

      if (!selectTool) return;

      e.preventDefault();
      selectTool();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    selectSelectTool,
    selectPanTool,
    selectAddItemTool,
    selectRectangleTool,
    selectConnectorTool,
    selectTextTool,
    selectGroupTool
  ]);

  return (
    <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          px: 0.5,
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        ⌥1–7 to switch tools
      </Typography>
      <UiElement>
        <Stack direction="row">
          <IconButton
            name="Select (⌥1)"
            Icon={<NearMeIcon />}
            onClick={selectSelectTool}
            isActive={mode.type === 'CURSOR' || mode.type === 'DRAG_ITEMS'}
          />
          <IconButton
            name="Pan (⌥2)"
            Icon={<PanToolIcon />}
            onClick={selectPanTool}
            isActive={mode.type === 'PAN'}
          />
          <IconButton
            name="Add item (⌥3)"
            Icon={<AddIcon />}
            onClick={selectAddItemTool}
            isActive={mode.type === 'PLACE_ICON'}
          />
          <IconButton
            name="Rectangle (⌥4)"
            Icon={<CropSquareIcon />}
            onClick={selectRectangleTool}
            isActive={mode.type === 'RECTANGLE.DRAW'}
          />
          <IconButton
            name="Connector (⌥5)"
            Icon={<ConnectorIcon />}
            onClick={selectConnectorTool}
            isActive={mode.type === 'CONNECTOR'}
          />
          <IconButton
            name="Text (⌥6)"
            Icon={<TitleIcon />}
            onClick={selectTextTool}
            isActive={mode.type === 'TEXTBOX'}
          />
          <IconButton
            name="Group (⌥7)"
            Icon={<GroupIcon />}
            onClick={selectGroupTool}
            isActive={mode.type === 'GROUP.DRAW'}
          />
        </Stack>
      </UiElement>
    </Stack>
  );
};
