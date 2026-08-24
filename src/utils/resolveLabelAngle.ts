import { VIEW_ITEM_DEFAULTS } from 'src/config';

export const normalizeLabelAngle = (angle: number): number => {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

export const resolveLabelAngle = (labelAngle?: number): number => {
  if (typeof labelAngle !== 'number' || Number.isNaN(labelAngle)) {
    return VIEW_ITEM_DEFAULTS.labelAngle;
  }

  return normalizeLabelAngle(labelAngle);
};
