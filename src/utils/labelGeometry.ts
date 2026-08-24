import { resolveLabelAngle } from './resolveLabelAngle';

export const getLabelLineEnd = (length: number, labelAngle?: number) => {
  const angle = resolveLabelAngle(labelAngle);
  const radians = (angle * Math.PI) / 180;

  return {
    x: Math.sin(radians) * length,
    y: -Math.cos(radians) * length
  };
};

export const getLabelAttachTransform = (labelAngle?: number): string => {
  const angle = resolveLabelAngle(labelAngle);

  if (angle < 45 || angle >= 315) {
    return 'translate(-50%, -100%)';
  }

  if (angle < 135) {
    return 'translate(0, -50%)';
  }

  if (angle < 225) {
    return 'translate(-50%, 0)';
  }

  return 'translate(-100%, -50%)';
};
