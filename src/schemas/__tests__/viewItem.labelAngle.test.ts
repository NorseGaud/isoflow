import { viewItemSchema } from '../views';

describe('viewItemSchema labelAngle', () => {
  test('accepts optional labelAngle', () => {
    const result = viewItemSchema.safeParse({
      id: 'item1',
      tile: { x: 0, y: 0 },
      labelAngle: 45
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.labelAngle).toBe(45);
    }
  });

  test('omitted labelAngle still parses', () => {
    const result = viewItemSchema.safeParse({
      id: 'item1',
      tile: { x: 0, y: 0 }
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.labelAngle).toBeUndefined();
    }
  });
});
