import type { Model, View, ViewItem } from 'src/types';
import { ensureModelLayoutClearance } from '../ensureModelLayoutClearance';
import { findViewOverlaps } from '../elementOverlap';

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
        { id: 'a2', ref: { item: 'vm' } }
      ],
      description: 'creates & runs',
      width: 10,
      style: 'SOLID' as const,
      labelEmphasis: 'SUBTLE' as const
    },
    {
      id: 'conn-packer-cli-2',
      anchors: [
        { id: 'b1', ref: { item: 'packer' } },
        { id: 'b2', ref: { item: 'cli' } }
      ],
      description: 'creates VM via',
      width: 10,
      style: 'DASHED' as const,
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

describe('ensureModelLayoutClearance', () => {
  test('clears packer label overlap with the cli-vm connector label', () => {
    const cleared = ensureModelLayoutClearance(diagramModel);
    const view = cleared.views[0]!;
    const packer = view.items.find((item) => {
      return item.id === 'packer';
    });

    expect(packer?.labelAngle).toBe(270);

    const remaining = findViewOverlaps(cleared, view).filter((overlap) => {
      const ids = [overlap.a.id, overlap.b.id];

      return ids.includes('packer:label') && ids.includes('conn-cli-vm-0:label');
    });

    expect(remaining).toHaveLength(0);
  });
});
