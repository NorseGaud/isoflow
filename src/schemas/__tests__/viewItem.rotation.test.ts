import { viewItemSchema } from '../views';

describe('viewItemSchema rotation', () => {
  test('accepts optional rotation', () => {
    const result = viewItemSchema.safeParse({
      id: 'item1',
      tile: { x: 0, y: 0 },
      rotation: 45
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rotation).toBe(45);
    }
  });

  test('omitted rotation still parses', () => {
    const result = viewItemSchema.safeParse({
      id: 'item1',
      tile: { x: 0, y: 0 }
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rotation).toBeUndefined();
    }
  });
});
