import { GROUP_TILE_PADDING } from 'src/config';
import type { Coords, Group, View } from 'src/types';

export const getGroupConnectorIds = (
  view: View,
  group: Group
): string[] => {
  const memberIds = new Set(group.memberIds);

  return (view.connectors ?? [])
    .filter((connector) => {
      if (connector.anchors.length < 2) return false;

      const from = connector.anchors[0];
      const to = connector.anchors[connector.anchors.length - 1];
      const fromItem = from.ref.item;
      const toItem = to.ref.item;

      if (!fromItem || !toItem) return false;

      return memberIds.has(fromItem) && memberIds.has(toItem);
    })
    .map((connector) => connector.id);
};

export const getGroupBounds = (
  view: View,
  group: Group
): { from: Coords; to: Coords } | null => {
  const memberTiles = group.memberIds
    .map((memberId) => {
      return view.items.find((item) => item.id === memberId)?.tile;
    })
    .filter((tile): tile is Coords => Boolean(tile));

  if (memberTiles.length === 0) return null;

  const xs = memberTiles.map((tile) => tile.x);
  const ys = memberTiles.map((tile) => tile.y);
  const padding = GROUP_TILE_PADDING;

  return {
    from: { x: Math.min(...xs) - padding, y: Math.min(...ys) - padding },
    to: { x: Math.max(...xs) + padding, y: Math.max(...ys) + padding }
  };
};
