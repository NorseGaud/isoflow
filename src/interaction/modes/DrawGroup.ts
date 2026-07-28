import { ModeActions } from 'src/types';
import { produce } from 'immer';
import {
  generateId,
  hasMovedTile,
  isWithinBounds,
  setWindowCursor
} from 'src/utils';

export const DrawGroup: ModeActions = {
  entry: () => {
    setWindowCursor('crosshair');
  },
  exit: () => {
    setWindowCursor('default');
  },
  mousemove: ({ uiState }) => {
    if (
      uiState.mode.type !== 'GROUP.DRAW' ||
      !hasMovedTile(uiState.mouse) ||
      !uiState.mode.region ||
      !uiState.mouse.mousedown
    )
      return;

    const newMode = produce(uiState.mode, (draft) => {
      if (!draft.region) return;
      draft.region.to = uiState.mouse.position.tile;
    });

    uiState.actions.setMode(newMode);
  },
  mousedown: ({ uiState, isRendererInteraction }) => {
    if (uiState.mode.type !== 'GROUP.DRAW' || !isRendererInteraction) return;

    const tile = uiState.mouse.position.tile;

    uiState.actions.setMode({
      type: 'GROUP.DRAW',
      showCursor: true,
      region: { from: tile, to: tile }
    });
  },
  mouseup: ({ uiState, scene }) => {
    if (uiState.mode.type !== 'GROUP.DRAW' || !uiState.mode.region) return;

    const { from, to } = uiState.mode.region;
    const memberIds = scene.items
      .filter((item) => isWithinBounds(item.tile, [from, to]))
      .map((item) => item.id);

    if (memberIds.length > 0) {
      scene.createGroup({
        id: generateId(),
        name: 'Group',
        color: scene.colors[0]?.id,
        memberIds
      });
    }

    uiState.actions.setMode({
      type: 'CURSOR',
      showCursor: true,
      mousedownItem: null
    });
  }
};
