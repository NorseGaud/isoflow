import { MARKDOWN_EMPTY_VALUE } from 'src/config';
import { getStackedItemOptions } from '../getStackedItemOptions';

describe('getStackedItemOptions', () => {
  const icons = [
    { id: 'icon-a', url: 'https://example.com/a.png', name: 'A' },
    { id: 'icon-b', url: 'https://example.com/b.png', name: 'B' }
  ];

  test('maps refs to name, plain description, and icon url in order', () => {
    const result = getStackedItemOptions({
      itemRefs: [
        { type: 'ITEM', id: 'n1' },
        { type: 'ITEM', id: 'n2' }
      ],
      modelItems: [
        {
          id: 'n1',
          name: 'First',
          description: '<p>Hello <strong>world</strong></p>',
          icon: 'icon-a'
        },
        {
          id: 'n2',
          name: 'Second',
          description: MARKDOWN_EMPTY_VALUE,
          icon: 'icon-b'
        }
      ],
      icons
    });

    expect(result).toEqual([
      {
        id: 'n1',
        name: 'First',
        description: 'Hello world',
        iconUrl: 'https://example.com/a.png'
      },
      {
        id: 'n2',
        name: 'Second',
        description: null,
        iconUrl: 'https://example.com/b.png'
      }
    ]);
  });

  test('skips refs with no matching model item', () => {
    const result = getStackedItemOptions({
      itemRefs: [{ type: 'ITEM', id: 'missing' }],
      modelItems: [],
      icons
    });

    expect(result).toEqual([]);
  });
});
