import type { Coords, InitialData, Model, View, ViewItem } from 'src/types';
import { PROJECTED_TILE_SIZE } from 'src/config';
import {
  collectViewElementBounds,
  collectViewElementBoundsForItem,
  getConnectorLabelBox,
  NODE_LABEL_MAX_WIDTH,
  NODE_LABEL_TEXT_HEIGHT
} from './elementBounds';
import { elementBoundsOverlapAny } from './elementOverlap';
import { getLabelLineEnd } from './labelGeometry';
import { getConnectorPath } from './renderer';
import { resolveConnectorLabelTile } from './resolveConnectorLabelTile';
import { normalizeLabelAngle, resolveLabelAngle } from './resolveLabelAngle';

const LABEL_ANGLE_CANDIDATES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

export const getConnectorLabelTiles = (view: View): Coords[] => {
  const nodeTiles = view.items.map((item) => {
    return item.tile;
  });

  return (view.connectors ?? [])
    .filter((connector) => {
      return Boolean(connector.description);
    })
    .map((connector) => {
      const path = getConnectorPath({ anchors: connector.anchors, view });

      return resolveConnectorLabelTile({ path, nodeTiles });
    });
};

const rankCandidateAngles = (preferredAngle: number) => {
  return [...LABEL_ANGLE_CANDIDATES].sort((left, right) => {
    const leftDistance = Math.min(
      Math.abs(left - preferredAngle),
      360 - Math.abs(left - preferredAngle)
    );
    const rightDistance = Math.min(
      Math.abs(right - preferredAngle),
      360 - Math.abs(right - preferredAngle)
    );

    return leftDistance - rightDistance;
  });
};

const getOutwardTileVector = (labelAngle: number): Coords => {
  const radians = (resolveLabelAngle(labelAngle) * Math.PI) / 180;

  return {
    x: Math.round(Math.sin(radians)),
    y: Math.round(-Math.cos(radians))
  };
};

const pointsTowardConnectorLabel = (
  nodeTile: Coords,
  labelAngle: number,
  connectorLabelTiles: Coords[]
) => {
  const outward = getOutwardTileVector(labelAngle);

  return connectorLabelTiles.some((labelTile) => {
    const direction = {
      x: labelTile.x - nodeTile.x,
      y: labelTile.y - nodeTile.y
    };

    if (direction.x === 0 && direction.y === 0) {
      return true;
    }

    return outward.x * direction.x + outward.y * direction.y > 0;
  });
};

const minConnectorLabelDistance = (
  nodeTile: Coords,
  labelHeight: number,
  labelAngle: number,
  connectorLabelTiles: Coords[]
) => {
  if (connectorLabelTiles.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const labelBox = collectViewElementBoundsForItem(
    { id: '__probe__', tile: nodeTile },
    labelHeight,
    labelAngle
  ).find((entry) => {
    return entry.kind === 'node-label';
  })!.box;

  return connectorLabelTiles.reduce((minDistance, labelTile) => {
    const connectorBox = getConnectorLabelBox(labelTile);
    const horizontalGap = Math.max(
      connectorBox.left - (labelBox.left + labelBox.width),
      labelBox.left - (connectorBox.left + connectorBox.width),
      0
    );
    const verticalGap = Math.max(
      connectorBox.top - (labelBox.top + labelBox.height),
      labelBox.top - (connectorBox.top + connectorBox.height),
      0
    );

    return Math.min(minDistance, Math.hypot(horizontalGap, verticalGap));
  }, Number.POSITIVE_INFINITY);
};

export const isNodeLabelBlocked = (
  viewItemId: string,
  nodeTile: Coords,
  labelHeight: number,
  labelAngle: number,
  otherBounds: ReturnType<typeof collectViewElementBounds>
) => {
  const labelBox = collectViewElementBoundsForItem(
    { id: viewItemId, tile: nodeTile },
    labelHeight,
    labelAngle
  ).find((entry) => {
    return entry.kind === 'node-label';
  })!.box;

  return elementBoundsOverlapAny(labelBox, otherBounds, 0, [
    viewItemId,
    `${viewItemId}:label`
  ]);
};

export const resolveNodeLabelAngle = (
  viewItemId: string,
  nodeTile: Coords,
  labelHeight: number,
  labelAngle: number | undefined,
  model: InitialData | Model,
  view: View
): number => {
  const preferred = resolveLabelAngle(labelAngle);
  const connectorLabelTiles = getConnectorLabelTiles(view);
  const otherBounds = collectViewElementBounds(model, view).filter((entry) => {
    return entry.id !== viewItemId && entry.id !== `${viewItemId}:label`;
  });
  const ranked = rankCandidateAngles(preferred);
  const unblocked = ranked.filter((candidate) => {
    if (
      pointsTowardConnectorLabel(nodeTile, candidate, connectorLabelTiles)
    ) {
      return false;
    }

    return !isNodeLabelBlocked(
      viewItemId,
      nodeTile,
      labelHeight,
      candidate,
      otherBounds
    );
  });

  if (unblocked.length === 0) {
    return preferred;
  }

  if (unblocked.length === 1) {
    return unblocked[0];
  }

  return unblocked.reduce((best, candidate) => {
    const bestConnectorDistance = minConnectorLabelDistance(
      nodeTile,
      labelHeight,
      best,
      connectorLabelTiles
    );
    const candidateConnectorDistance = minConnectorLabelDistance(
      nodeTile,
      labelHeight,
      candidate,
      connectorLabelTiles
    );

    if (candidateConnectorDistance !== bestConnectorDistance) {
      return candidateConnectorDistance > bestConnectorDistance
        ? candidate
        : best;
    }

    const preferredDistance = Math.min(
      Math.abs(candidate - preferred),
      360 - Math.abs(candidate - preferred)
    );
    const bestPreferredDistance = Math.min(
      Math.abs(best - preferred),
      360 - Math.abs(best - preferred)
    );

    return preferredDistance < bestPreferredDistance ? candidate : best;
  });
};

export const ensureViewItemLabelAngle = (
  viewItem: ViewItem,
  model: InitialData | Model,
  view: View,
  labelHeight: number
): ViewItem => {
  const resolved = resolveNodeLabelAngle(
    viewItem.id,
    viewItem.tile,
    labelHeight,
    viewItem.labelAngle,
    model,
    view
  );

  if (resolved === resolveLabelAngle(viewItem.labelAngle)) {
    return viewItem;
  }

  return {
    ...viewItem,
    labelAngle: normalizeLabelAngle(resolved)
  };
};

export const getNodeLabelFootprintTiles = (
  nodeTile: Coords,
  labelHeight: number,
  labelAngle: number
): Coords[] => {
  const lineEnd = getLabelLineEnd(labelHeight, labelAngle);
  const box = {
    left: lineEnd.x - NODE_LABEL_MAX_WIDTH / 2,
    top: lineEnd.y - NODE_LABEL_TEXT_HEIGHT,
    width: NODE_LABEL_MAX_WIDTH,
    height: NODE_LABEL_TEXT_HEIGHT
  };
  const stepX = PROJECTED_TILE_SIZE.width / 4;
  const stepY = PROJECTED_TILE_SIZE.height / 4;
  const halfW = PROJECTED_TILE_SIZE.width / 2;
  const halfH = PROJECTED_TILE_SIZE.height / 2;
  const footprint: Coords[] = [];

  for (
    let pixelY = box.top;
    pixelY <= box.top + box.height;
    pixelY += stepY
  ) {
    for (
      let pixelX = box.left;
      pixelX <= box.left + box.width;
      pixelX += stepX
    ) {
      footprint.push({
        x: Math.round(nodeTile.x + (pixelX / halfW - pixelY / halfH) / 2),
        y: Math.round(nodeTile.y + (-pixelY / halfH - pixelX / halfW) / 2)
      });
    }
  }

  return footprint;
};
