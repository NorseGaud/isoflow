import { VIEW_ITEM_DEFAULTS } from 'src/config';
import { normalizeLabelAngle, resolveLabelAngle } from '../resolveLabelAngle';

describe('resolveLabelAngle', () => {
  test('defaults to top (0°)', () => {
    expect(resolveLabelAngle(undefined)).toBe(VIEW_ITEM_DEFAULTS.labelAngle);
    expect(resolveLabelAngle(undefined)).toBe(0);
  });

  test('normalizes wrapped angles', () => {
    expect(normalizeLabelAngle(390)).toBe(30);
    expect(normalizeLabelAngle(-90)).toBe(270);
  });

  test('preserves explicit angles', () => {
    expect(resolveLabelAngle(90)).toBe(90);
    expect(resolveLabelAngle(180)).toBe(180);
  });
});
