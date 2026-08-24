import type { Coords, Connector, ConnectorPath, View, ViewItem } from 'src/types';
import { CoordsUtils } from './CoordsUtils';
import {
  type AxisAlignedBox,
  getConnectorLabelBox
} from './elementBounds';
import { boxesOverlap } from './elementOverlap';
import { connectorPathTileToGlobal, getAnchorTile, getConnectorPath } from './renderer';

export const isTileNearNode = (
  tile: Coords,
  nodeTile: Coords,
  padding = 1
) => {
  return (
    Math.abs(tile.x - nodeTile.x) <= padding &&
    Math.abs(tile.y - nodeTile.y) <= padding
  );
};

export const isTileBlockedForConnectorLabel = (
  tile: Coords,
  nodeTiles: Coords[],
  padding = 1
) => {
  return nodeTiles.some((nodeTile) => {
    return isTileNearNode(tile, nodeTile, padding);
  });
};

interface ResolveConnectorLabelTile {
  path: ConnectorPath;
  nodeTiles: Coords[];
  labelPadding?: number;
  avoidBoxes?: AxisAlignedBox[];
}

export const resolveConnectorLabelTile = ({
  path,
  nodeTiles,
  labelPadding = 1,
  avoidBoxes = []
}: ResolveConnectorLabelTile): Coords => {
  const { tiles, rectangle } = path;

  if (tiles.length === 0) {
    throw new Error('Connector path has no tiles');
  }

  const globalTiles = tiles.map((tile) => {
    return connectorPathTileToGlobal(tile, rectangle.from);
  });

  const middleIndex = Math.floor(globalTiles.length / 2);

  const scoreTile = (tile: Coords, index: number) => {
    if (isTileBlockedForConnectorLabel(tile, nodeTiles, labelPadding)) {
      return Number.NEGATIVE_INFINITY;
    }

    if (avoidBoxes.length > 0) {
      const labelBox = getConnectorLabelBox(tile);

      if (
        avoidBoxes.some((box) => {
          return boxesOverlap(labelBox, box);
        })
      ) {
        return Number.NEGATIVE_INFINITY;
      }
    }

    const nearestNodeDistance = nodeTiles.reduce((minDistance, nodeTile) => {
      const distance =
        Math.abs(tile.x - nodeTile.x) + Math.abs(tile.y - nodeTile.y);
      return Math.min(minDistance, distance);
    }, Number.POSITIVE_INFINITY);

    const middleBias = -Math.abs(index - middleIndex) * 0.1;

    return nearestNodeDistance + middleBias;
  };

  let bestIndex = middleIndex;
  let bestScore = Number.NEGATIVE_INFINITY;

  globalTiles.forEach((tile, index) => {
    const score = scoreTile(tile, index);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return globalTiles[bestIndex];
};

export const getViewItemTiles = (items: ViewItem[]) => {
  return items.map((item) => {
    return item.tile;
  });
};

export const pathLabelTileIsBlocked = (
  path: ConnectorPath,
  nodeTiles: Coords[],
  labelPadding = 1,
  avoidBoxes: AxisAlignedBox[] = []
) => {
  const labelTile = resolveConnectorLabelTile({
    path,
    nodeTiles,
    labelPadding,
    avoidBoxes
  });

  if (isTileBlockedForConnectorLabel(labelTile, nodeTiles, labelPadding)) {
    return true;
  }

  if (avoidBoxes.length === 0) {
    return false;
  }

  const labelBox = getConnectorLabelBox(labelTile);

  return avoidBoxes.some((box) => {
    return boxesOverlap(labelBox, box);
  });
};

const buildWaypointCandidates = (from: Coords, to: Coords) => {
  const base: Coords[] = [
    { x: from.x, y: to.y },
    { x: to.x, y: from.y },
    { x: from.x, y: Math.round((from.y + to.y) / 2) },
    { x: Math.round((from.x + to.x) / 2), y: from.y },
    { x: Math.round((from.x + to.x) / 2), y: to.y },
    { x: to.x, y: Math.round((from.y + to.y) / 2) }
  ];

  const offsets = [-1, 0, 1];
  for (const dx of offsets) {
    for (const dy of offsets) {
      base.push({ x: from.x + dx, y: to.y + dy });
      base.push({ x: to.x + dx, y: from.y + dy });
    }
  }

  return base.filter((candidate, index) => {
    const isDuplicate =
      base.findIndex((other) => {
        return CoordsUtils.isEqual(other, candidate);
      }) !== index;

    const isEndpoint =
      CoordsUtils.isEqual(candidate, from) ||
      CoordsUtils.isEqual(candidate, to);

    return !isDuplicate && !isEndpoint;
  });
};

export const suggestConnectorWaypoint = (
  connector: Connector,
  view: View,
  nodeTiles: Coords[],
  avoidBoxes: AxisAlignedBox[] = []
): Coords | null => {
  const from = getAnchorTile(connector.anchors[0], view);
  const to = getAnchorTile(
    connector.anchors[connector.anchors.length - 1],
    view
  );

  for (const candidate of buildWaypointCandidates(from, to)) {
    const routedConnector: Connector = {
      ...connector,
      anchors: [
        connector.anchors[0],
        { id: '__waypoint__', ref: { tile: candidate } },
        connector.anchors[connector.anchors.length - 1]
      ]
    };
    const path = getConnectorPath({ anchors: routedConnector.anchors, view });

    if (!pathLabelTileIsBlocked(path, nodeTiles, 1, avoidBoxes)) {
      return candidate;
    }
  }

  return null;
};
