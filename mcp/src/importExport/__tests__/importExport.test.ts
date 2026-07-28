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
});
