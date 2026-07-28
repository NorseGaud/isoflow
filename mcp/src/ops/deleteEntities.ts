import type { InitialData, Model } from '../../../src/types';

export type DeleteEntitiesInput = {
  nodeKeys?: string[];
  connectorIds?: string[];
  rectangleKeys?: string[];
  textBoxKeys?: string[];
};

export const deleteEntities = (
  model: InitialData | Model,
  input: DeleteEntitiesInput
): Model => {
  const view = model.views[0];
  if (!view) {
    throw new Error('Project has no view');
  }

  const nodeKeySet = new Set(input.nodeKeys ?? []);
  const connectorIdSet = new Set(input.connectorIds ?? []);
  const rectangleKeySet = new Set(input.rectangleKeys ?? []);
  const textBoxKeySet = new Set(input.textBoxKeys ?? []);

  return {
    ...model,
    items: model.items.filter((item) => !nodeKeySet.has(item.id)),
    views: [
      {
        ...view,
        items: view.items.filter((item) => !nodeKeySet.has(item.id)),
        connectors: (view.connectors ?? []).filter((connector) => {
          if (connectorIdSet.has(connector.id)) return false;
          return !connector.anchors.some((anchor) => {
            return anchor.ref.item && nodeKeySet.has(anchor.ref.item);
          });
        }),
        rectangles: (view.rectangles ?? []).filter((rectangle) => {
          return !rectangleKeySet.has(rectangle.id);
        }),
        textBoxes: (view.textBoxes ?? []).filter((textBox) => {
          return !textBoxKeySet.has(textBox.id);
        })
      }
    ]
  };
};
