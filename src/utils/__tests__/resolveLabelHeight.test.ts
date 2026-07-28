import { VIEW_ITEM_DEFAULTS } from 'src/config';
import { resolveLabelHeight } from '../resolveLabelHeight';

describe('resolveLabelHeight', () => {
  test('uses the default when missing, zero, or below the slider minimum', () => {
    expect(resolveLabelHeight(undefined)).toBe(VIEW_ITEM_DEFAULTS.labelHeight);
    expect(resolveLabelHeight(0)).toBe(VIEW_ITEM_DEFAULTS.labelHeight);
    expect(resolveLabelHeight(20)).toBe(VIEW_ITEM_DEFAULTS.labelHeight);
  });

  test('keeps valid stored heights', () => {
    expect(resolveLabelHeight(60)).toBe(60);
    expect(resolveLabelHeight(80)).toBe(80);
    expect(resolveLabelHeight(140)).toBe(140);
  });
});
