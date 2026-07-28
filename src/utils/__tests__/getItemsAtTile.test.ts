import { getItemsAtTile } from '../renderer';

const makeScene = (items: { id: string; tile: { x: number; y: number } }[]) => {
  return {
    items,
    textBoxes: [],
    connectors: [],
    rectangles: []
  } as unknown as Parameters<typeof getItemsAtTile>[0]['scene'];
};

describe('getItemsAtTile', () => {
  test('returns empty array when no items on tile', () => {
    const scene = makeScene([{ id: 'a', tile: { x: 1, y: 1 } }]);

    expect(getItemsAtTile({ tile: { x: 0, y: 0 }, scene })).toEqual([]);
  });

  test('returns single item on tile', () => {
    const scene = makeScene([{ id: 'a', tile: { x: 0, y: 0 } }]);

    expect(getItemsAtTile({ tile: { x: 0, y: 0 }, scene })).toEqual([
      { type: 'ITEM', id: 'a' }
    ]);
  });

  test('returns all items on tile in scene order', () => {
    const scene = makeScene([
      { id: 'a', tile: { x: 0, y: 0 } },
      { id: 'b', tile: { x: 1, y: 0 } },
      { id: 'c', tile: { x: 0, y: 0 } }
    ]);

    expect(getItemsAtTile({ tile: { x: 0, y: 0 }, scene })).toEqual([
      { type: 'ITEM', id: 'a' },
      { type: 'ITEM', id: 'c' }
    ]);
  });
});
