import {
  getLabelAttachTransform,
  getLabelLineEnd
} from '../labelGeometry';

describe('labelGeometry', () => {
  test('getLabelLineEnd uses top as the default direction', () => {
    expect(getLabelLineEnd(100, 0)).toEqual({ x: 0, y: -100 });
  });

  test('getLabelLineEnd points to the right at 90°', () => {
    const end = getLabelLineEnd(100, 90);
    expect(end.x).toBeCloseTo(100);
    expect(end.y).toBeCloseTo(0);
  });

  test('getLabelAttachTransform keeps text horizontal by side', () => {
    expect(getLabelAttachTransform(0)).toBe('translate(-50%, -100%)');
    expect(getLabelAttachTransform(90)).toBe('translate(0, -50%)');
    expect(getLabelAttachTransform(180)).toBe('translate(-50%, 0)');
    expect(getLabelAttachTransform(270)).toBe('translate(-100%, -50%)');
  });
});
