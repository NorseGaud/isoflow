export const ROTATION_SNAP_POINTS = [
  0, 45, 90, 135, 180, 225, 270, 315, 360
] as const;

export const ROTATION_MARKS = ROTATION_SNAP_POINTS.map((value) => {
  return { value, label: `${value}°` };
});

export const ROTATION_SNAP_THRESHOLD = 8;

export const snapRotation = (
  value: number,
  threshold: number = ROTATION_SNAP_THRESHOLD
): number => {
  const nearest = ROTATION_SNAP_POINTS.reduce((best, point) => {
    return Math.abs(point - value) < Math.abs(best - value) ? point : best;
  });

  return Math.abs(nearest - value) <= threshold ? nearest : value;
};
