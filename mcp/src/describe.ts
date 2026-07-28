import type { Model } from '../../src/types';
import { getGroupConnectorIds } from '../../src/utils/groupGeometry';

/** Compact text description — never includes icon URLs. */
export const describeModel = (model: Model): string => {
  const view = model.views[0];
  const lines: string[] = [];

  lines.push(`Title: ${model.title}`);
  lines.push(
    `Counts: ${model.items.length} nodes, ${view?.connectors?.length ?? 0} connectors, ${view?.rectangles?.length ?? 0} regions, ${view?.groups?.length ?? 0} groups, ${view?.textBoxes?.length ?? 0} text boxes`
  );

  if (!view) {
    lines.push('(no views)');
    return lines.join('\n');
  }

  lines.push('');
  lines.push('Nodes:');

  view.items.forEach((viewItem) => {
    const item = model.items.find((entry) => entry.id === viewItem.id);
    const extras: string[] = [];
    if (viewItem.showLabel === false) extras.push('label=hidden');
    if (viewItem.rotation !== undefined) {
      extras.push(`rotation=${viewItem.rotation}`);
    }
    if (viewItem.labelHeight !== undefined) {
      extras.push(`labelHeight=${viewItem.labelHeight}`);
    }
    lines.push(
      `- ${viewItem.id}: "${item?.name ?? viewItem.id}" icon=${item?.icon ?? 'none'} tile=(${viewItem.tile.x},${viewItem.tile.y})${extras.length ? ` ${extras.join(' ')}` : ''}`
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
      const bits = [
        connector.style,
        connector.width !== undefined ? `w=${connector.width}` : undefined,
        connector.description ? `"${connector.description}"` : undefined,
        connector.labelEmphasis && connector.labelEmphasis !== 'SUBTLE'
          ? `emphasis=${connector.labelEmphasis}`
          : undefined
      ].filter(Boolean);
      lines.push(
        `- ${connector.id}: ${ends}${bits.length ? ` [${bits.join(' ')}]` : ''}`
      );
    });
  }

  if (view.rectangles && view.rectangles.length > 0) {
    lines.push('');
    lines.push('Regions:');
    view.rectangles.forEach((rectangle) => {
      lines.push(
        `- ${rectangle.id}: (${rectangle.from.x},${rectangle.from.y}) -> (${rectangle.to.x},${rectangle.to.y})${rectangle.color ? ` color=${rectangle.color}` : ''}`
      );
    });
  }

  if (view.groups && view.groups.length > 0) {
    lines.push('');
    lines.push('Groups:');
    view.groups.forEach((group) => {
      const connectorIds = getGroupConnectorIds(view, group);
      lines.push(
        `- ${group.id}: "${group.name}" members=[${group.memberIds.join(', ')}] connectors=[${connectorIds.join(', ')}]${group.color ? ` color=${group.color}` : ''}`
      );
    });
  }

  if (view.textBoxes && view.textBoxes.length > 0) {
    lines.push('');
    lines.push('Text boxes:');
    view.textBoxes.forEach((textBox) => {
      lines.push(
        `- ${textBox.id}: "${textBox.content}" tile=(${textBox.tile.x},${textBox.tile.y})${textBox.fontSize !== undefined ? ` fontSize=${textBox.fontSize}` : ''}`
      );
    });
  }

  return lines.join('\n');
};
