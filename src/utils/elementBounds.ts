import type { Coords, InitialData, Model, View, ViewItem } from 'src/types';
import { PROJECTED_TILE_SIZE } from 'src/config';
import { getLabelLineEnd } from './labelGeometry';
import { getConnectorPath, getTilePosition } from './renderer';
import { isNodeLabelVisible } from './isNodeLabelVisible';
import { resolveLabelAngle } from './resolveLabelAngle';
import { resolveLabelHeight } from './resolveLabelHeight';
import { resolveConnectorLabelTile } from './resolveConnectorLabelTile';

export type ElementKind = 'node-tile' | 'node-label' | 'connector-label';

export interface AxisAlignedBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ViewElementBounds {
  id: string;
  kind: ElementKind;
  box: AxisAlignedBox;
}

export const LABEL_BOX_PADDING = 8;
export const NODE_LABEL_MAX_WIDTH = 250;
export const NODE_LABEL_TEXT_HEIGHT = 44;
export const CONNECTOR_LABEL_MAX_WIDTH = 150;
export const CONNECTOR_LABEL_TEXT_HEIGHT = 36;

export const expandBox = (
  box: AxisAlignedBox,
  padding: number
): AxisAlignedBox => {
  return {
    left: box.left - padding,
    top: box.top - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2
  };
};

export const getNodeTileBox = (tile: Coords): AxisAlignedBox => {
  const center = getTilePosition({ tile });
  const halfW = PROJECTED_TILE_SIZE.width / 2;
  const halfH = PROJECTED_TILE_SIZE.height / 2;

  return {
    left: center.x - halfW,
    top: center.y - halfH,
    width: PROJECTED_TILE_SIZE.width,
    height: PROJECTED_TILE_SIZE.height
  };
};

const getLocalNodeLabelTextBox = (labelHeight: number, labelAngle: number) => {
  const lineEnd = getLabelLineEnd(labelHeight, labelAngle);
  const angle = resolveLabelAngle(labelAngle);
  const width = NODE_LABEL_MAX_WIDTH;
  const height = NODE_LABEL_TEXT_HEIGHT;

  if (angle < 45 || angle >= 315) {
    return {
      left: lineEnd.x - width / 2,
      top: lineEnd.y - height,
      width,
      height
    };
  }

  if (angle < 135) {
    return {
      left: lineEnd.x,
      top: lineEnd.y - height / 2,
      width,
      height
    };
  }

  if (angle < 225) {
    return {
      left: lineEnd.x - width / 2,
      top: lineEnd.y,
      width,
      height
    };
  }

  return {
    left: lineEnd.x - width,
    top: lineEnd.y - height / 2,
    width,
    height
  };
};

export const getNodeLabelBox = (
  nodeTile: Coords,
  labelHeight: number,
  labelAngle: number
): AxisAlignedBox => {
  const nodeCenter = getTilePosition({ tile: nodeTile });
  const localBox = getLocalNodeLabelTextBox(labelHeight, labelAngle);

  return expandBox(
    {
      left: nodeCenter.x + localBox.left,
      top: nodeCenter.y + localBox.top,
      width: localBox.width,
      height: localBox.height
    },
    LABEL_BOX_PADDING
  );
};

export const getConnectorLabelBox = (labelTile: Coords): AxisAlignedBox => {
  const center = getTilePosition({ tile: labelTile });

  return expandBox(
    {
      left: center.x - CONNECTOR_LABEL_MAX_WIDTH / 2,
      top: center.y - CONNECTOR_LABEL_TEXT_HEIGHT / 2,
      width: CONNECTOR_LABEL_MAX_WIDTH,
      height: CONNECTOR_LABEL_TEXT_HEIGHT
    },
    LABEL_BOX_PADDING
  );
};

export interface CollectViewElementBoundsOptions {
  resolvedLabelAngles?: Map<string, number>;
}

export const collectViewElementBounds = (
  model: InitialData | Model,
  view: View,
  options: CollectViewElementBoundsOptions = {}
): ViewElementBounds[] => {
  const bounds: ViewElementBounds[] = [];
  const nodeTiles = view.items.map((item) => {
    return item.tile;
  });

  view.items.forEach((viewItem) => {
    bounds.push({
      id: viewItem.id,
      kind: 'node-tile',
      box: getNodeTileBox(viewItem.tile)
    });

    const modelItem = model.items.find((item) => {
      return item.id === viewItem.id;
    });
    const labelAngle =
      options.resolvedLabelAngles?.get(viewItem.id) ??
      resolveLabelAngle(viewItem.labelAngle);

    if (!modelItem?.name || !isNodeLabelVisible(viewItem.showLabel)) {
      return;
    }

    bounds.push({
      id: `${viewItem.id}:label`,
      kind: 'node-label',
      box: getNodeLabelBox(
        viewItem.tile,
        resolveLabelHeight(viewItem.labelHeight),
        labelAngle
      )
    });
  });

  (view.connectors ?? []).forEach((connector) => {
    if (!connector.description) {
      return;
    }

    const path = getConnectorPath({ anchors: connector.anchors, view });
    const labelTile = resolveConnectorLabelTile({ path, nodeTiles });

    bounds.push({
      id: `${connector.id}:label`,
      kind: 'connector-label',
      box: getConnectorLabelBox(labelTile)
    });
  });

  return bounds;
};

export const collectViewElementBoundsForItem = (
  viewItem: ViewItem,
  labelHeight: number,
  labelAngle: number
): ViewElementBounds[] => {
  return [
    {
      id: viewItem.id,
      kind: 'node-tile',
      box: getNodeTileBox(viewItem.tile)
    },
    {
      id: `${viewItem.id}:label`,
      kind: 'node-label',
      box: getNodeLabelBox(viewItem.tile, labelHeight, labelAngle)
    }
  ];
};
