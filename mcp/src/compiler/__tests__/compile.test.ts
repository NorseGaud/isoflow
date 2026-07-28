import { compileDiagramSpec } from '../compile';

describe('compileDiagramSpec', () => {
  it('produces a schema-valid model with connectors and tiles', () => {
    const model = compileDiagramSpec({
      projectName: 'Demo',
      nodes: [
        { key: 'lb', label: 'Load Balancer', icon: 'load balancer' },
        { key: 'web', label: 'Web', icon: 'server' },
        { key: 'db', label: 'Database', icon: 'database' }
      ],
      edges: [
        { from: 'lb', to: 'web' },
        { from: 'web', to: 'db' }
      ]
    });

    expect(model.title).toBe('Demo');
    expect(model.items).toHaveLength(3);
    expect(model.views[0].items).toHaveLength(3);
    expect(model.views[0].connectors).toHaveLength(2);

    const tiles = model.views[0].items.map((item) => {
      return `${item.tile.x},${item.tile.y}`;
    });
    expect(new Set(tiles).size).toBe(3);
  });

  it('preserves existing tiles for matching keys', () => {
    const first = compileDiagramSpec({
      projectName: 'Demo',
      nodes: [
        { key: 'a', label: 'A', icon: 'server' },
        { key: 'b', label: 'B', icon: 'server' }
      ],
      edges: [{ from: 'a', to: 'b' }]
    });

    first.views[0].items = [
      { id: 'a', tile: { x: 10, y: -3 } },
      { id: 'b', tile: { x: 11, y: -2 } }
    ];

    const second = compileDiagramSpec(
      {
        projectName: 'Demo',
        nodes: [
          { key: 'a', label: 'A renamed', icon: 'server' },
          { key: 'b', label: 'B', icon: 'server' },
          { key: 'c', label: 'C', icon: 'server' }
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' }
        ]
      },
      first
    );

    const tileA = second.views[0].items.find((item) => item.id === 'a')?.tile;
    const tileB = second.views[0].items.find((item) => item.id === 'b')?.tile;

    expect(tileA).toEqual({ x: 10, y: -3 });
    expect(tileB).toEqual({ x: 11, y: -2 });
    expect(second.views[0].items.find((item) => item.id === 'c')).toBeDefined();
  });
});
