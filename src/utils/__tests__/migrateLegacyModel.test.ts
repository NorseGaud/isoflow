import type { InitialData } from 'src/types';
import { migrateImportedModel } from '../migrateLegacyModel';

const legacyExport = {
  version: '3.3.0',
  project: { title: 'legacy-diagram' },
  icons: [
    {
      id: 'icon-server',
      name: 'Server',
      url: 'https://example.com/icons/server.svg',
      collection: 'Isometric',
      isIsometric: true
    },
    {
      id: 'icon-vm',
      name: 'VM',
      url: 'https://example.com/icons/vm.svg',
      collection: 'Isometric',
      isIsometric: true
    }
  ],
  physicalTopology: {
    components: [
      { id: 'comp-1', name: 'Controller', icon: 'server' },
      { id: 'comp-2', name: 'Guest', icon: 'vm' },
      { id: 'comp-unused', name: 'Unused', icon: 'server' }
    ],
    views: [
      {
        id: 'view-1',
        name: 'Main',
        items: [
          {
            id: 'placement-1',
            component: 'comp-1',
            tile: { x: 1, y: 2 }
          },
          {
            id: 'placement-2',
            component: 'comp-2',
            tile: { x: 3, y: 4 }
          }
        ],
        rectangles: [
          {
            id: 'rect-1',
            color: 'color1',
            from: { x: 0, y: 0 },
            to: { x: 2, y: 2 }
          }
        ],
        connectors: [
          {
            id: 'conn-1',
            color: 'color1',
            anchors: [
              { id: 'a1', ref: { item: 'placement-1' } },
              { id: 'a2', ref: { item: 'placement-2' } }
            ]
          }
        ],
        textBoxes: [
          {
            id: 'tb-1',
            tile: { x: 0, y: 1 },
            content: 'Label',
            fontSize: 0.5,
            orientation: 'Y'
          }
        ]
      }
    ],
    colors: [{ id: 'color1', value: '#a5b8f3' }],
    flows: []
  },
  documents: {
    list: [
      {
        id: 'doc-1',
        itemReference: {
          id: 'comp-1',
          type: 'physicalTopology.component'
        },
        title: 'description',
        data: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Runs the fleet' }]
            }
          ]
        }
      }
    ]
  }
};

describe('migrateImportedModel', () => {
  test('converts physicalTopology exports into the current model schema', () => {
    const migrated = migrateImportedModel(legacyExport) as InitialData;

    expect(migrated).toMatchObject({
      version: '3.3.0',
      title: 'legacy-diagram',
      colors: [{ id: 'color1', value: '#a5b8f3' }],
      fitToView: true
    });

    expect(migrated.items).toEqual(
      expect.arrayContaining([
        {
          id: 'placement-1',
          name: 'Controller',
          icon: 'icon-server',
          description: 'Runs the fleet'
        },
        {
          id: 'placement-2',
          name: 'Guest',
          icon: 'icon-vm'
        },
        {
          id: 'comp-unused',
          name: 'Unused',
          icon: 'icon-server'
        }
      ])
    );

    expect(migrated.views[0]).toMatchObject({
      id: 'view-1',
      name: 'Main',
      items: [
        { id: 'placement-1', tile: { x: 1, y: 2 } },
        { id: 'placement-2', tile: { x: 3, y: 4 } }
      ]
    });

    expect(migrated.views[0].connectors?.[0].anchors).toEqual([
      { id: 'a1', ref: { item: 'placement-1' } },
      { id: 'a2', ref: { item: 'placement-2' } }
    ]);

    const viewItemIds = new Set(migrated.views[0].items.map((item) => item.id));
    const modelItemIds = new Set(migrated.items.map((item) => item.id));
    const iconIds = new Set(migrated.icons.map((icon) => icon.id));

    expect(
      [...viewItemIds].every((id) => {
        return modelItemIds.has(id);
      })
    ).toBe(true);
    expect(
      migrated.items.every((item) => {
        return !item.icon || iconIds.has(item.icon);
      })
    ).toBe(true);
  });

  test('returns current-format models unchanged when label heights are valid', () => {
    const current = {
      version: '1.0.0',
      title: 'Current',
      icons: [],
      colors: [{ id: 'color1', value: '#fff' }],
      items: [],
      views: []
    };

    expect(migrateImportedModel(current)).toBe(current);
  });

  test('heals invalid labelHeight values on import', () => {
    const current = {
      version: '1.0.0',
      title: 'Current',
      icons: [],
      colors: [{ id: 'color1', value: '#fff' }],
      items: [{ id: 'item1', name: 'Node' }],
      views: [
        {
          id: 'view1',
          name: 'View',
          items: [{ id: 'item1', tile: { x: 0, y: 0 }, labelHeight: 0 }]
        }
      ]
    };

    const migrated = migrateImportedModel(current) as typeof current;

    expect(migrated.views[0].items[0].labelHeight).toBe(80);
  });
});
