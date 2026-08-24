import type { InitialData, Model } from '../types';
import { ensureModelConnectorRouteClearance } from './ensureModelConnectorRouteClearance';
import { ensureModelNodeLabelClearance } from './ensureModelNodeLabelClearance';

export const ensureModelLayoutClearance = (
  model: InitialData | Model
): InitialData | Model => {
  let next = ensureModelConnectorRouteClearance(model);
  next = ensureModelNodeLabelClearance(next);
  next = ensureModelConnectorRouteClearance(next);

  return next;
};
