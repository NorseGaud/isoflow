import { exportModelJson, importModelJson } from '../../importExport';
import type { Model } from '../../../../src/types';

const sample = (): Model => {
  return {
    version: '1.0.0',
    title: 'Export Me',
    colors: [{ id: 'color1', value: '#a5b8f3' }],
    icons: [],
    items: [{ id: 'n1', name: 'Node', icon: 'server' }],
    views: [
      {
        id: 'view1',
        name: 'Main',
        items: [{ id: 'n1', tile: { x: 0, y: 0 } }]
      }
    ]
  };
};

describe('importExport', () => {
  it('round-trips stripped JSON', () => {
    const json = exportModelJson(sample());
    const parsed = JSON.parse(json) as Model;
    expect(parsed.title).toBe('Export Me');
    expect(parsed.items).toHaveLength(1);

    const imported = importModelJson(json);
    expect(imported.title).toBe('Export Me');
    expect(imported.items[0].id).toBe('n1');
    // rehydrate brings isopack icons back
    expect(imported.icons.length).toBeGreaterThan(0);
  });

  it('rejects invalid JSON', () => {
    expect(() => importModelJson('{')).toThrow(/not valid JSON/);
  });

  it('preserves connector labelEmphasis', () => {
    const model = sample();
    model.views[0].connectors = [
      {
        id: 'c1',
        labelEmphasis: 'CAPS',
        description: 'with Controller',
        anchors: [
          { id: 'a1', ref: { item: 'n1' } },
          { id: 'a2', ref: { tile: { x: 1, y: 0 } } }
        ]
      }
    ];
    const imported = importModelJson(exportModelJson(model));
    expect(imported.views[0].connectors?.[0].labelEmphasis).toBe('CAPS');
  });

  it('round-trips view groups', () => {
    const model = sample();
    model.views[0].groups = [
      {
        id: 'g1',
        name: 'Controller path',
        color: 'color1',
        memberIds: ['n1']
      }
    ];
    const imported = importModelJson(exportModelJson(model));
    expect(imported.views[0].groups).toEqual(model.views[0].groups);
  });
});
