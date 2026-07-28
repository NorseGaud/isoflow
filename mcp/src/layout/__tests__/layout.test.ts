import {
  breakCycles,
  layoutDiagram,
  rankNodes,
  rankPositionToTile
} from '../layout';

describe('layout', () => {
  it('maps rank/position to isometric tiles without collisions in a line', () => {
    const a = rankPositionToTile(0, 0, 1);
    const b = rankPositionToTile(1, 0, 1);
    expect(a).toEqual({ x: 0, y: 0 });
    // Horizontal flow: rank advances x and retreats y (constant x+y).
    expect(b).toEqual({ x: 3, y: -3 });
  });

  it('keeps a single-lane chain on a constant isometric level (x+y)', () => {
    const tiles = [0, 1, 2, 3].map((rank) => rankPositionToTile(rank, 0, 1));
    const levels = tiles.map((tile) => tile.x + tile.y);
    expect(new Set(levels).size).toBe(1);
  });

  it('breaks cycles by removing back-edges', () => {
    const edges = breakCycles(
      ['a', 'b', 'c'],
      [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
        { from: 'c', to: 'a' }
      ]
    );

    expect(edges).toHaveLength(2);
    expect(edges.some((edge) => edge.from === 'c' && edge.to === 'a')).toBe(
      false
    );
  });

  it('ranks nodes by longest path', () => {
    const ranks = rankNodes(
      ['a', 'b', 'c'],
      [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' }
      ]
    );

    expect(ranks.get('a')).toBe(0);
    expect(ranks.get('b')).toBe(1);
    expect(ranks.get('c')).toBe(2);
  });

  it('lays out a layered graph with unique tiles and increasing flow', () => {
    const result = layoutDiagram(
      [
        { key: 'lb' },
        { key: 'web1', group: 'web' },
        { key: 'web2', group: 'web' },
        { key: 'db' }
      ],
      [
        { from: 'lb', to: 'web1' },
        { from: 'lb', to: 'web2' },
        { from: 'web1', to: 'db' },
        { from: 'web2', to: 'db' }
      ],
      [{ key: 'web' }]
    );

    const tiles = result.nodes.map((node) => `${node.tile.x},${node.tile.y}`);
    expect(new Set(tiles).size).toBe(tiles.length);

    const lb = result.nodes.find((node) => node.key === 'lb');
    const db = result.nodes.find((node) => node.key === 'db');
    expect(lb).toBeDefined();
    expect(db).toBeDefined();
    expect((lb?.rank ?? 0) < (db?.rank ?? 0)).toBe(true);

    const webGroup = result.groups.find((group) => group.key === 'web');
    expect(webGroup).toBeDefined();
  });
});
