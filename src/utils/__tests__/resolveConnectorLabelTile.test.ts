import type { ViewItem } from 'src/types';
import { getConnectorPath } from '../renderer';
import { ensureConnectorRouteClearance } from '../ensureConnectorRouteClearance';
import {
  getViewItemTiles,
  isTileBlockedForConnectorLabel,
  pathLabelTileIsBlocked,
  resolveConnectorLabelTile,
  suggestConnectorWaypoint
} from '../resolveConnectorLabelTile';

const diagramView = {
  id: 'view',
  name: 'view',
  items: [
    { id: 'cli', tile: { x: 2, y: 0 } },
    { id: 'app', tile: { x: 4, y: 0 } },
    { id: 'vm', tile: { x: 3, y: 2 } }
  ] as ViewItem[],
  connectors: [],
  rectangles: [],
  groups: [],
  textBoxes: []
};

describe('resolveConnectorLabelTile', () => {
  test('picks the clearest tile along an already-routed connector', () => {
    const connector = ensureConnectorRouteClearance(
      {
        id: 'conn-cli-vm',
        description: 'creates & runs',
        anchors: [
          { id: 'a1', ref: { item: 'cli' } },
          { id: 'a2', ref: { item: 'vm' } }
        ]
      },
      diagramView
    );

    const path = getConnectorPath({ anchors: connector.anchors, view: diagramView });
    const labelTile = resolveConnectorLabelTile({
      path,
      nodeTiles: getViewItemTiles(diagramView.items)
    });

    expect(isTileBlockedForConnectorLabel(labelTile, [{ x: 3, y: 2 }])).toBe(
      false
    );
  });
});

describe('ensureConnectorRouteClearance', () => {
  test('adds a waypoint when the default label would cover another node', () => {
    const connector = {
      id: 'conn-cli-vm',
      description: 'creates & runs',
      anchors: [
        { id: 'a1', ref: { item: 'cli' } },
        { id: 'a2', ref: { item: 'vm' } }
      ]
    };

    const initialPath = getConnectorPath({
      anchors: connector.anchors,
      view: diagramView
    });

    expect(
      pathLabelTileIsBlocked(initialPath, getViewItemTiles(diagramView.items))
    ).toBe(true);

    expect(
      suggestConnectorWaypoint(
        connector,
        diagramView,
        getViewItemTiles(diagramView.items)
      )
    ).toEqual({ x: 1, y: 2 });

    const cleared = ensureConnectorRouteClearance(connector, diagramView);

    expect(cleared.anchors.length).toBe(3);
    expect(cleared.anchors[1]?.ref.tile).toEqual({ x: 1, y: 2 });

    const routedPath = getConnectorPath({
      anchors: cleared.anchors,
      view: diagramView
    });
    expect(
      pathLabelTileIsBlocked(routedPath, getViewItemTiles(diagramView.items))
    ).toBe(false);
  });

  test('routes the desktop app connector away from the VM label', () => {
    const connector = {
      id: 'conn-app-vm',
      description: 'manages',
      anchors: [
        { id: 'a1', ref: { item: 'app' } },
        { id: 'a2', ref: { item: 'vm' } }
      ]
    };

    const cleared = ensureConnectorRouteClearance(connector, diagramView);

    expect(cleared.anchors.length).toBe(3);
    expect(cleared.anchors[1]?.ref.tile).toEqual({ x: 5, y: 2 });
  });
});
