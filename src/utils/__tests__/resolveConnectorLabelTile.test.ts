import type { Model, ViewItem } from 'src/types';
import { getConnectorPath } from '../renderer';
import { ensureConnectorRouteClearance } from '../ensureConnectorRouteClearance';
import {
  getViewItemTiles,
  isTileBlockedForConnectorLabel,
  pathLabelTileIsBlocked,
  resolveConnectorLabelTile,
  suggestConnectorWaypoint
} from '../resolveConnectorLabelTile';

const diagramItems = [
  { id: 'cli', tile: { x: 2, y: 0 } },
  { id: 'app', tile: { x: 4, y: 0 } },
  { id: 'vm', tile: { x: 3, y: 2 } }
] as ViewItem[];

const diagramView = {
  id: 'view',
  name: 'view',
  lastUpdated: '2026-01-01T00:00:00.000Z',
  items: diagramItems,
  connectors: [],
  rectangles: [],
  groups: [],
  textBoxes: []
};

const diagramModel = {
  title: 'Test',
  version: '',
  icons: [],
  colors: [],
  items: diagramItems.map((item) => {
    return {
      id: item.id,
      name: item.id,
      icon: 'block',
      description: ''
    };
  }),
  views: [diagramView]
} as Model;

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
      diagramView,
      diagramModel
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

    const cleared = ensureConnectorRouteClearance(
      connector,
      diagramView,
      diagramModel
    );

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
});
