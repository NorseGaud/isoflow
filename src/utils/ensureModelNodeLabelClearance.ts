import type { InitialData, Model } from '../types';
import { isNodeLabelVisible } from './isNodeLabelVisible';
import { resolveLabelHeight } from './resolveLabelHeight';
import { ensureViewItemLabelAngle } from './resolveNodeLabelAngle';

export const ensureModelNodeLabelClearance = (
  model: InitialData | Model
): InitialData | Model => {
  const view = model.views[0];
  if (!view?.items?.length) {
    return model;
  }

  const clearedItems = view.items.map((viewItem) => {
    const modelItem = model.items.find((item) => {
      return item.id === viewItem.id;
    });

    if (!modelItem?.name || !isNodeLabelVisible(viewItem.showLabel)) {
      return viewItem;
    }

    return ensureViewItemLabelAngle(
      viewItem,
      model,
      view,
      resolveLabelHeight(viewItem.labelHeight)
    );
  });

  const changed = clearedItems.some((viewItem, index) => {
    return viewItem !== view.items[index];
  });

  if (!changed) {
    return model;
  }

  return {
    ...model,
    views: [{ ...view, items: clearedItems }]
  };
};
