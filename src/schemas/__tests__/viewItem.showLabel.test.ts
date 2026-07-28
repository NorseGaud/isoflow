import { viewItemSchema } from '../views';

describe('viewItemSchema showLabel', () => {
  test('accepts optional showLabel boolean', () => {
    const result = viewItemSchema.safeParse({
      id: 'item1',
      tile: { x: 0, y: 0 },
      showLabel: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showLabel).toBe(false);
    }
  });

  test('omitted showLabel still parses', () => {
    const result = viewItemSchema.safeParse({
      id: 'item1',
      tile: { x: 0, y: 0 }
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showLabel).toBeUndefined();
    }
  });

  test('rejects non-boolean showLabel', () => {
    const result = viewItemSchema.safeParse({
      id: 'item1',
      tile: { x: 0, y: 0 },
      showLabel: 'yes'
    });

    expect(result.success).toBe(false);
  });
});
