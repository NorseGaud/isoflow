import type { Model } from '../../src/types';

/** Compact text description — never includes icon URLs. */
export const describeModel = (model: Model): string => {
  const view = model.views[0];
  const lines: string[] = [];

  lines.push(`Title: ${model.title}`);
  lines.push(`Revision data: ${model.items.length} nodes, ${view?.connectors?.length ?? 0} connectors, ${view?.rectangles?.length ?? 0} regions`);

  if (!view) {
    lines.push('(no views)');
    return lines.join('\n');
  }

  lines.push('');
  lines.push('Nodes:');

  view.items.forEach((viewItem) => {
    const item = model.items.find((entry) => entry.id === viewItem.id);
    const icon = item?.icon
      ? model.icons.find((entry) => entry.id === item.icon)
      : undefined;
    lines.push(
      `- ${viewItem.id}: "${item?.name ?? viewItem.id}" icon=${icon?.id ?? item?.icon ?? 'none'} tile=(${viewItem.tile.x},${viewItem.tile.y})`
    );
  });

  if (view.connectors && view.connectors.length > 0) {
    lines.push('');
    lines.push('Connectors:');
    view.connectors.forEach((connector) => {
      const ends = connector.anchors
        .map((anchor) => {
          if (anchor.ref.item) return anchor.ref.item;
          if (anchor.ref.tile) {
            return `tile(${anchor.ref.tile.x},${anchor.ref.tile.y})`;
          }
          return 'anchor';
        })
        .join(' -> ');
      lines.push(`- ${connector.id}: ${ends}${connector.style ? ` [${connector.style}]` : ''}`);
    });
  }

  if (view.rectangles && view.rectangles.length > 0) {
    lines.push('');
    lines.push('Regions:');
    view.rectangles.forEach((rectangle) => {
      lines.push(
        `- ${rectangle.id}: (${rectangle.from.x},${rectangle.from.y}) -> (${rectangle.to.x},${rectangle.to.y})`
      );
    });
  }

  return lines.join('\n');
};
