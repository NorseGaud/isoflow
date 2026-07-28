import { snapRotation } from '../rotationSlider';

describe('snapRotation', () => {
  test('snaps to nearest 45° mark within threshold', () => {
    expect(snapRotation(87)).toBe(90);
    expect(snapRotation(92)).toBe(90);
    expect(snapRotation(42)).toBe(45);
    expect(snapRotation(138)).toBe(135);
    expect(snapRotation(178)).toBe(180);
    expect(snapRotation(355)).toBe(360);
    expect(snapRotation(3)).toBe(0);
  });

  test('keeps free angles outside the snap threshold', () => {
    expect(snapRotation(20)).toBe(20);
    expect(snapRotation(100)).toBe(100);
    expect(snapRotation(200)).toBe(200);
  });
});
