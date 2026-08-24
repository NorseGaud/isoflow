import type { InitialData, Model, View, ViewItem } from 'src/types';
import { isNodeLabelVisible } from './isNodeLabelVisible';
import { resolveLabelHeight } from './resolveLabelHeight';
import { ensureViewItemLabelAngle } from './resolveNodeLabelAngle';

export const ensureViewItemsLabelAngles = (
  model: InitialData | Model,
  view: View
) => {
  return view.items.map((viewItem) => {
    return ensureViewItemLabelAngle(
      viewItem,
      model,
      view,
      resolveLabelHeight(viewItem.labelHeight)
    );
  });
};

export const syncViewItemLabels = (
  viewItems: ViewItem[],
  model: InitialData | Model,
  view: Pick<View, 'items' | 'connectors'>
) => {
  const viewContext = { items: viewItems, connectors: view.connectors ?? [] };

  return viewItems.map((viewItem) => {
    const modelItem = model.items.find((item) => {
      return item.id === viewItem.id;
    });

    if (!modelItem?.name || !isNodeLabelVisible(viewItem.showLabel)) {
      return viewItem;
    }

    return ensureViewItemLabelAngle(
      viewItem,
      model,
      viewContext as View,
      resolveLabelHeight(viewItem.labelHeight)
    );
  });
};
