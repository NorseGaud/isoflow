import type { Connector, View } from 'src/types';
import { generateId } from './common';
import { getConnectorPath } from './renderer';
import {
  getViewItemTiles,
  pathLabelTileIsBlocked,
  suggestConnectorWaypoint
} from './resolveConnectorLabelTile';

export const ensureConnectorRouteClearance = (
  connector: Connector,
  view: View
): Connector => {
  const itemAnchors = connector.anchors.filter((anchor) => {
    return Boolean(anchor.ref.item);
  });

  if (itemAnchors.length !== 2 || connector.anchors.length !== 2) {
    return connector;
  }

  const nodeTiles = getViewItemTiles(view.items ?? []);
  const path = getConnectorPath({ anchors: connector.anchors, view });

  if (!pathLabelTileIsBlocked(path, nodeTiles)) {
    return connector;
  }

  const waypoint = suggestConnectorWaypoint(connector, view, nodeTiles);

  if (!waypoint) {
    return connector;
  }

  return {
    ...connector,
    anchors: [
      connector.anchors[0],
      { id: generateId(), ref: { tile: waypoint } },
      connector.anchors[connector.anchors.length - 1]
    ]
  };
};
