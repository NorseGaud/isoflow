import type { Connector, InitialData, Model, View } from 'src/types';
import { collectViewElementBounds, getConnectorLabelBox } from './elementBounds';
import { boxesOverlap } from './elementOverlap';
import { generateId } from './common';
import { getConnectorPath } from './renderer';
import {
  getViewItemTiles,
  isTileBlockedForConnectorLabel,
  resolveConnectorLabelTile,
  suggestConnectorWaypoint
} from './resolveConnectorLabelTile';

const connectorLabelIsBlocked = (
  path: ReturnType<typeof getConnectorPath>,
  nodeTiles: ReturnType<typeof getViewItemTiles>,
  avoidBoxes: ReturnType<typeof collectViewElementBounds>[number]['box'][]
) => {
  const defaultLabelTile = resolveConnectorLabelTile({
    path,
    nodeTiles
  });

  if (isTileBlockedForConnectorLabel(defaultLabelTile, nodeTiles)) {
    return true;
  }

  const labelTile = resolveConnectorLabelTile({
    path,
    nodeTiles,
    avoidBoxes
  });
  const labelBox = getConnectorLabelBox(labelTile);

  return avoidBoxes.some((box) => {
    return boxesOverlap(labelBox, box);
  });
};

export const ensureConnectorRouteClearance = (
  connector: Connector,
  view: View,
  model: InitialData | Model
): Connector => {
  const itemAnchors = connector.anchors.filter((anchor) => {
    return Boolean(anchor.ref.item);
  });

  if (itemAnchors.length !== 2 || connector.anchors.length !== 2) {
    return connector;
  }

  const nodeTiles = getViewItemTiles(view.items ?? []);
  const avoidBoxes = collectViewElementBounds(model, view)
    .filter((entry) => {
      return entry.id !== `${connector.id}:label`;
    })
    .map((entry) => {
      return entry.box;
    });
  const path = getConnectorPath({ anchors: connector.anchors, view });

  if (!connectorLabelIsBlocked(path, nodeTiles, avoidBoxes)) {
    return connector;
  }

  const waypoint = suggestConnectorWaypoint(
    connector,
    view,
    nodeTiles,
    avoidBoxes
  );

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
