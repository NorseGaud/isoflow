import type { Model, View, ViewItem } from 'src/types';
import { ensureViewItemLabelAngle, getConnectorLabelTiles } from '../resolveNodeLabelAngle';

const diagramItems = [
  { id: 'packer', tile: { x: 0, y: 0 }, labelHeight: 90, showLabel: true },
  { id: 'cli', tile: { x: 2, y: 0 }, labelHeight: 90, showLabel: true },
  { id: 'app', tile: { x: 4, y: 0 }, labelHeight: 90, showLabel: true },
  { id: 'vm', tile: { x: 3, y: 2 }, labelHeight: 90, showLabel: true }
] as ViewItem[];

const diagramView = {
  id: 'view-1',
  name: 'Main',
  lastUpdated: '2026-01-01T00:00:00.000Z',
  items: diagramItems,
  connectors: [
    {
      id: 'conn-cli-vm-0',
      anchors: [
        { id: 'a1', ref: { item: 'cli' } },
        { id: 'a2', ref: { tile: { x: 1, y: 2 } } },
        { id: 'a3', ref: { item: 'vm' } }
      ],
      description: 'creates & runs',
      width: 10,
      style: 'SOLID' as const,
      labelEmphasis: 'SUBTLE' as const
    }
  ],
  rectangles: [],
  groups: [],
  textBoxes: []
} as View;

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

describe('ensureViewItemLabelAngle', () => {
  test('sets the Packer label to the left of the node on the virtualization diagram', () => {
    const packer = diagramView.items[0];
    const connectorLabelTiles = getConnectorLabelTiles(diagramView);

    expect(connectorLabelTiles).toEqual([{ x: 1, y: 2 }]);

    const cleared = ensureViewItemLabelAngle(
      packer,
      diagramModel,
      diagramView,
      90
    );

    expect(cleared.labelAngle).toBe(270);
  });
});
