import type { InitialData, Model, View } from 'src/types';
import {
  type AxisAlignedBox,
  type ViewElementBounds,
  collectViewElementBounds
} from './elementBounds';

export type OverlapRelation = 'overlapping' | 'touching';

export interface ElementOverlap {
  a: ViewElementBounds;
  b: ViewElementBounds;
  relation: OverlapRelation;
  gap: number;
}

const getConnectorIdFromLabel = (elementId: string) => {
  return elementId.replace(/:label$/, '');
};

const isExpectedConnectorAnchorOverlap = (
  overlap: ElementOverlap,
  view: View
) => {
  const connectorEntry =
    overlap.a.kind === 'connector-label'
      ? overlap.a
      : overlap.b.kind === 'connector-label'
        ? overlap.b
        : null;
  const nodeEntry =
    overlap.a.kind === 'node-tile'
      ? overlap.a
      : overlap.b.kind === 'node-tile'
        ? overlap.b
        : null;

  if (!connectorEntry || !nodeEntry) {
    return false;
  }

  const connector = (view.connectors ?? []).find((entry) => {
    return entry.id === getConnectorIdFromLabel(connectorEntry.id);
  });

  if (!connector) {
    return false;
  }

  return connector.anchors.some((anchor) => {
    return anchor.ref.item === nodeEntry.id;
  });
};

export const getBoxGap = (left: AxisAlignedBox, right: AxisAlignedBox): number => {
  const horizontalGap = Math.max(
    right.left - (left.left + left.width),
    left.left - (right.left + right.width),
    0
  );
  const verticalGap = Math.max(
    right.top - (left.top + left.height),
    left.top - (right.top + right.height),
    0
  );

  if (horizontalGap === 0 && verticalGap === 0) {
    const overlapX =
      Math.min(left.left + left.width, right.left + right.width) -
      Math.max(left.left, right.left);
    const overlapY =
      Math.min(left.top + left.height, right.top + right.height) -
      Math.max(left.top, right.top);

    return -Math.min(overlapX, overlapY);
  }

  return Math.hypot(horizontalGap, verticalGap);
};

export const boxesOverlap = (
  left: AxisAlignedBox,
  right: AxisAlignedBox,
  gap = 0
) => {
  return getBoxGap(left, right) <= gap;
};

export const boxesTouch = (
  left: AxisAlignedBox,
  right: AxisAlignedBox,
  gap = 0
) => {
  return getBoxGap(left, right) <= gap;
};

const shareSameNode = (left: ViewElementBounds, right: ViewElementBounds) => {
  const leftNodeId = left.id.replace(/:label$/, '');
  const rightNodeId = right.id.replace(/:label$/, '');

  return leftNodeId === rightNodeId;
};

export const findElementOverlaps = (
  elements: ViewElementBounds[],
  touchGap = 0
): ElementOverlap[] => {
  const overlaps: ElementOverlap[] = [];

  for (let leftIndex = 0; leftIndex < elements.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < elements.length; rightIndex += 1) {
      const left = elements[leftIndex];
      const right = elements[rightIndex];

      if (shareSameNode(left, right)) {
        continue;
      }

      const gap = getBoxGap(left.box, right.box);

      if (gap > touchGap) {
        continue;
      }

      overlaps.push({
        a: left,
        b: right,
        relation: gap < 0 ? 'overlapping' : 'touching',
        gap
      });
    }
  }

  return overlaps;
};

export const findViewOverlaps = (
  model: InitialData | Model,
  view: View,
  touchGap = 0
): ElementOverlap[] => {
  return findElementOverlaps(collectViewElementBounds(model, view), touchGap).filter(
    (overlap) => {
      return !isExpectedConnectorAnchorOverlap(overlap, view);
    }
  );
};

export const hasViewOverlaps = (
  model: InitialData | Model,
  view: View,
  touchGap = 0
) => {
  return findViewOverlaps(model, view, touchGap).length > 0;
};

export const formatElementOverlap = (overlap: ElementOverlap) => {
  const relation =
    overlap.relation === 'overlapping' ? 'overlaps' : 'touches';

  return `${overlap.a.id} (${overlap.a.kind}) ${relation} ${overlap.b.id} (${overlap.b.kind})`;
};

export const formatViewOverlaps = (overlaps: ElementOverlap[]) => {
  if (overlaps.length === 0) {
    return 'Overlaps: none';
  }

  return [
    `Overlaps: ${overlaps.length}`,
    ...overlaps.map((overlap) => {
      return `- ${formatElementOverlap(overlap)}`;
    })
  ].join('\n');
};

export const elementBoundsOverlapAny = (
  box: AxisAlignedBox,
  others: ViewElementBounds[],
  touchGap = 0,
  ignoreIds: string[] = []
) => {
  return others.some((other) => {
    if (ignoreIds.includes(other.id)) {
      return false;
    }

    return boxesTouch(box, other.box, touchGap);
  });
};
