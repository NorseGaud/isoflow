import type { InitialData, Model } from '../../../src/types';

export const clearCanvas = (model: InitialData | Model): Model => {
  const view = model.views[0];

  return {
    ...model,
    items: [],
    views: view
      ? [
          {
            ...view,
            items: [],
            connectors: [],
            rectangles: [],
            groups: [],
            textBoxes: []
          }
        ]
      : model.views
  };
};
