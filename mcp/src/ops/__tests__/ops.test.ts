import { addRectangles, updateRectangles } from '../rectangles';
import { addTextBoxes, updateTextBoxes } from '../textBoxes';
import { applyNodeUpdates } from '../updateNodes';
import { applyConnectorUpdates } from '../updateConnectors';
import { clearCanvas } from '../clearCanvas';
import { deleteEntities } from '../deleteEntities';
import type { Model } from '../../../../src/types';

const baseModel = (): Model => {
  return {
    version: '1.0.0',
    title: 'Demo',
    colors: [{ id: 'color1', value: '#a5b8f3' }],
    icons: [{ id: 'server', name: 'Server', url: 'data:x' }],
    items: [
      { id: 'a', name: 'A', icon: 'server' },
      { id: 'b', name: 'B', icon: 'server' }
    ],
    views: [
      {
        id: 'view1',
        name: 'Main',
        items: [
          { id: 'a', tile: { x: 0, y: 0 } },
          { id: 'b', tile: { x: 1, y: 0 } }
        ],
        connectors: [
          {
            id: 'c1',
            style: 'SOLID',
            color: 'color1',
            anchors: [
              { id: 'a1', ref: { item: 'a' } },
              { id: 'a2', ref: { item: 'b' } }
            ]
          }
        ],
        rectangles: [
          {
            id: 'r1',
            from: { x: 0, y: 0 },
            to: { x: 2, y: 2 },
            color: 'color1'
          }
        ],
        textBoxes: [
          {
            id: 't1',
            content: 'Hello',
            tile: { x: 3, y: 3 }
          }
        ]
      }
    ]
  };
};

describe('mcp ops', () => {
  it('updates node labels and view props', () => {
    const next = applyNodeUpdates(baseModel(), [
      { key: 'a', label: 'Alpha', showLabel: false, rotation: 45 }
    ]);
    expect(next.items.find((item) => item.id === 'a')?.name).toBe('Alpha');
    const viewItem = next.views[0].items.find((item) => item.id === 'a');
    expect(viewItem?.showLabel).toBe(false);
    expect(viewItem?.rotation).toBe(45);
  });

  it('updates connector style and label', () => {
    const next = applyConnectorUpdates(baseModel(), [
      { id: 'c1', style: 'DASHED', label: 'link' }
    ]);
    expect(next.views[0].connectors?.[0].style).toBe('DASHED');
    expect(next.views[0].connectors?.[0].description).toBe('link');
  });

  it('adds and updates rectangles', () => {
    let next = addRectangles(baseModel(), [
      { key: 'r2', from: { x: 1, y: 1 }, to: { x: 3, y: 3 } }
    ]);
    expect(next.views[0].rectangles).toHaveLength(2);
    next = updateRectangles(next, [
      { key: 'r2', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } }
    ]);
    expect(next.views[0].rectangles?.find((r) => r.id === 'r2')?.from).toEqual({
      x: 0,
      y: 0
    });
  });

  it('adds and updates text boxes', () => {
    let next = addTextBoxes(baseModel(), [
      { key: 't2', content: 'World', x: 4, y: 4 }
    ]);
    expect(next.views[0].textBoxes).toHaveLength(2);
    next = updateTextBoxes(next, [{ key: 't2', content: 'Updated', x: 5 }]);
    const box = next.views[0].textBoxes?.find((t) => t.id === 't2');
    expect(box?.content).toBe('Updated');
    expect(box?.tile).toEqual({ x: 5, y: 4 });
  });

  it('clears canvas content', () => {
    const next = clearCanvas(baseModel());
    expect(next.items).toHaveLength(0);
    expect(next.views[0].items).toHaveLength(0);
    expect(next.views[0].connectors).toHaveLength(0);
    expect(next.views[0].rectangles).toHaveLength(0);
    expect(next.views[0].textBoxes).toHaveLength(0);
    expect(next.title).toBe('Demo');
  });

  it('deletes nodes, connectors, rectangles, and text boxes', () => {
    const next = deleteEntities(baseModel(), {
      nodeKeys: ['a'],
      connectorIds: [],
      rectangleKeys: ['r1'],
      textBoxKeys: ['t1']
    });
    expect(next.items.map((item) => item.id)).toEqual(['b']);
    expect(next.views[0].connectors).toHaveLength(0);
    expect(next.views[0].rectangles).toHaveLength(0);
    expect(next.views[0].textBoxes).toHaveLength(0);
  });
});
