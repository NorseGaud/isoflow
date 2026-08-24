import type { InitialData, Model } from '../../../src/types';
import { resolveIconId } from '../icons/match';

export type NodeUpdate = {
  key: string;
  label?: string;
  description?: string;
  icon?: string;
  showLabel?: boolean;
  labelHeight?: number;
  labelAngle?: number;
  rotation?: number;
};

export const applyNodeUpdates = (
  model: InitialData | Model,
  updates: NodeUpdate[]
): Model => {
  const view = model.views[0];
  if (!view) {
    throw new Error('Project has no view');
  }

  const updateMap = new Map(
    updates.map((update) => {
      return [update.key, update] as const;
    })
  );

  const items = model.items.map((item) => {
    const update = updateMap.get(item.id);
    if (!update) return item;

    return {
      ...item,
      name: update.label ?? item.name,
      description:
        update.description !== undefined ? update.description : item.description,
      icon:
        update.icon !== undefined ? resolveIconId(update.icon) : item.icon
    };
  });

  const viewItems = view.items.map((viewItem) => {
    const update = updateMap.get(viewItem.id);
    if (!update) return viewItem;

    return {
      ...viewItem,
      showLabel:
        update.showLabel !== undefined ? update.showLabel : viewItem.showLabel,
      labelHeight:
        update.labelHeight !== undefined
          ? update.labelHeight
          : viewItem.labelHeight,
      labelAngle:
        update.labelAngle !== undefined
          ? update.labelAngle
          : viewItem.labelAngle,
      rotation:
        update.rotation !== undefined ? update.rotation : viewItem.rotation
    };
  });

  const missing = updates
    .filter((update) => {
      return !model.items.some((item) => item.id === update.key);
    })
    .map((update) => update.key);

  if (missing.length > 0) {
    throw new Error(`Unknown node keys: ${missing.join(', ')}`);
  }

  return {
    ...model,
    items,
    views: [{ ...view, items: viewItems }]
  };
};
