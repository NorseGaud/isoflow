import { VIEW_ITEM_DEFAULTS } from 'src/config';

const MIN_LABEL_HEIGHT = 60;

export const resolveLabelHeight = (labelHeight?: number): number => {
  if (typeof labelHeight !== 'number' || labelHeight < MIN_LABEL_HEIGHT) {
    return VIEW_ITEM_DEFAULTS.labelHeight;
  }

  return labelHeight;
};
