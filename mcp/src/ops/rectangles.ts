import { v4 as uuid } from 'uuid';
import type { InitialData, Model } from '../../../src/types';

export type RectangleInput = {
  key?: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
};

export type RectangleUpdate = {
  key: string;
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  color?: string;
};

const resolveColorId = (
  color: string | undefined,
  colors: Model['colors']
): string | undefined => {
  if (!color) return colors[0]?.id;
  const byId = colors.find((entry) => entry.id === color);
  if (byId) return byId.id;
  const normalized = color.startsWith('#') ? color.slice(0, 7) : color;
  const byValue = colors.find((entry) => {
    return entry.value.toLowerCase() === normalized.toLowerCase();
  });
  return byValue?.id ?? colors[0]?.id;
};

export const addRectangles = (
  model: InitialData | Model,
  rectangles: RectangleInput[]
): Model => {
  const view = model.views[0];
  if (!view) {
    throw new Error('Project has no view');
  }

  const next = [...(view.rectangles ?? [])];
  rectangles.forEach((rectangle) => {
    next.push({
      id: rectangle.key?.trim() || uuid(),
      from: rectangle.from,
      to: rectangle.to,
      color: resolveColorId(rectangle.color, model.colors)
    });
  });

  return {
    ...model,
    views: [{ ...view, rectangles: next }]
  };
};

export const updateRectangles = (
  model: InitialData | Model,
  updates: RectangleUpdate[]
): Model => {
  const view = model.views[0];
  if (!view) {
    throw new Error('Project has no view');
  }

  const updateMap = new Map(
    updates.map((update) => {
      return [update.key, update] as const;
    })
  );

  const rectangles = (view.rectangles ?? []).map((rectangle) => {
    const update = updateMap.get(rectangle.id);
    if (!update) return rectangle;
    return {
      ...rectangle,
      from: update.from ?? rectangle.from,
      to: update.to ?? rectangle.to,
      color:
        update.color !== undefined
          ? resolveColorId(update.color, model.colors)
          : rectangle.color
    };
  });

  const missing = updates
    .filter((update) => {
      return !(view.rectangles ?? []).some((rectangle) => {
        return rectangle.id === update.key;
      });
    })
    .map((update) => update.key);

  if (missing.length > 0) {
    throw new Error(`Unknown rectangle keys: ${missing.join(', ')}`);
  }

  return {
    ...model,
    views: [{ ...view, rectangles }]
  };
};
