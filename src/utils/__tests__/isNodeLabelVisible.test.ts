import { isNodeLabelVisible } from '../isNodeLabelVisible';

describe('isNodeLabelVisible', () => {
  test('treats undefined as visible (legacy / import without field)', () => {
    expect(isNodeLabelVisible(undefined)).toBe(true);
  });

  test('treats true as visible', () => {
    expect(isNodeLabelVisible(true)).toBe(true);
  });

  test('treats false as hidden', () => {
    expect(isNodeLabelVisible(false)).toBe(false);
  });
});
