import { GROUP_TILE_PADDING } from 'src/config';
import type { Group, View } from 'src/types';
import { getGroupBounds, getGroupConnectorIds } from '../groupGeometry';

const view: View = {
  id: 'view1',
  name: 'Main',
  items: [
    { id: 'a', tile: { x: 0, y: 0 } },
    { id: 'b', tile: { x: 2, y: 1 } },
    { id: 'c', tile: { x: 5, y: 5 } }
  ],
  connectors: [
    {
      id: 'both',
      anchors: [
        { id: 'a1', ref: { item: 'a' } },
        { id: 'a2', ref: { item: 'b' } }
      ]
    },
    {
      id: 'one',
      anchors: [
        { id: 'a3', ref: { item: 'a' } },
        { id: 'a4', ref: { item: 'c' } }
      ]
    },
    {
      id: 'tile',
      anchors: [
        { id: 'a5', ref: { item: 'a' } },
        { id: 'a6', ref: { tile: { x: 1, y: 1 } } }
      ]
    }
  ]
};

const group: Group = {
  id: 'g1',
  name: 'Path',
  memberIds: ['a', 'b']
};

describe('groupGeometry', () => {
  test('getGroupConnectorIds includes only connectors with both endpoints in the group', () => {
    expect(getGroupConnectorIds(view, group)).toEqual(['both']);
  });

  test('getGroupBounds expands member tiles by GROUP_TILE_PADDING', () => {
    expect(getGroupBounds(view, group)).toEqual({
      from: { x: 0 - GROUP_TILE_PADDING, y: 0 - GROUP_TILE_PADDING },
      to: { x: 2 + GROUP_TILE_PADDING, y: 1 + GROUP_TILE_PADDING }
    });
  });

  test('getGroupBounds returns null when no members resolve', () => {
    expect(
      getGroupBounds(view, { id: 'empty', name: 'Empty', memberIds: ['missing'] })
    ).toBeNull();
  });
});
