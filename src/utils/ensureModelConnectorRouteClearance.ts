import type { InitialData, Model } from '../types';
import { ensureConnectorRouteClearance } from './ensureConnectorRouteClearance';

export const ensureModelConnectorRouteClearance = (
  model: InitialData | Model
): InitialData | Model => {
  const view = model.views[0];
  if (!view?.connectors?.length) {
    return model;
  }

  const clearedConnectors = view.connectors.map((connector) => {
    return ensureConnectorRouteClearance(connector, view, model);
  });

  const changed = clearedConnectors.some((connector, index) => {
    return connector !== view.connectors![index];
  });

  if (!changed) {
    return model;
  }

  return {
    ...model,
    views: [{ ...view, connectors: clearedConnectors }]
  };
};
