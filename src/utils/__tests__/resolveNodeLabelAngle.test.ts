import type { Model, View, ViewItem } from 'src/types';
import { resolveNodeLabelAngle } from '../resolveNodeLabelAngle';

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

describe('resolveNodeLabelAngle', () => {
  test('keeps the default top angle when nothing is blocked', () => {
    const angle = resolveNodeLabelAngle(
      'solo',
      { x: 10, y: 10 },
      90,
      0,
      {
        ...diagramModel,
        items: [{ id: 'solo', name: 'solo', icon: 'block' }],
        views: [
          {
            ...diagramView,
            items: [
              {
                id: 'solo',
                tile: { x: 10, y: 10 },
                labelHeight: 90,
                showLabel: true
              }
            ],
            connectors: []
          }
        ]
      },
      {
        ...diagramView,
        items: [
          {
            id: 'solo',
            tile: { x: 10, y: 10 },
            labelHeight: 90,
            showLabel: true
          }
        ],
        connectors: []
      }
    );

    expect(angle).toBe(0);
  });

  test('rotates the VM label when it would cover a nearby connector label', () => {
    const vm = diagramItems[3];
    const view = {
      ...diagramView,
      connectors: [
        {
          id: 'conn-cli-vm-0',
          anchors: [
            { id: 'a1', ref: { item: 'vm' } },
            { id: 'a2', ref: { tile: { x: 3, y: 1 } } },
            { id: 'a3', ref: { item: 'vm' } }
          ],
          description: 'creates & runs',
          width: 10,
          style: 'SOLID' as const,
          labelEmphasis: 'SUBTLE' as const
        }
      ]
    } as View;

    const angle = resolveNodeLabelAngle(
      vm.id,
      vm.tile,
      90,
      0,
      { ...diagramModel, views: [view] },
      view
    );

    expect(angle).not.toBe(0);
  });

  test('rotates the Packer label away from a connector label tile', () => {
    const packer = diagramItems[0];

    const angle = resolveNodeLabelAngle(
      packer.id,
      packer.tile,
      90,
      0,
      diagramModel,
      diagramView
    );

    expect(angle).toBe(270);
  });
});
