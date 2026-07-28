import { v4 as uuid } from 'uuid';
import type { InitialData, Model } from '../../../src/types';

export type TextBoxInput = {
  key?: string;
  content: string;
  x: number;
  y: number;
  fontSize?: number;
  orientation?: 'X' | 'Y';
};

export type TextBoxUpdate = {
  key: string;
  content?: string;
  x?: number;
  y?: number;
  fontSize?: number;
  orientation?: 'X' | 'Y';
};

export const addTextBoxes = (
  model: InitialData | Model,
  textBoxes: TextBoxInput[]
): Model => {
  const view = model.views[0];
  if (!view) {
    throw new Error('Project has no view');
  }

  const next = [...(view.textBoxes ?? [])];
  textBoxes.forEach((textBox) => {
    next.push({
      id: textBox.key?.trim() || uuid(),
      content: textBox.content,
      tile: { x: textBox.x, y: textBox.y },
      fontSize: textBox.fontSize,
      orientation: textBox.orientation
    });
  });

  return {
    ...model,
    views: [{ ...view, textBoxes: next }]
  };
};

export const updateTextBoxes = (
  model: InitialData | Model,
  updates: TextBoxUpdate[]
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

  const textBoxes = (view.textBoxes ?? []).map((textBox) => {
    const update = updateMap.get(textBox.id);
    if (!update) return textBox;
    return {
      ...textBox,
      content: update.content ?? textBox.content,
      fontSize:
        update.fontSize !== undefined ? update.fontSize : textBox.fontSize,
      orientation: update.orientation ?? textBox.orientation,
      tile: {
        x: update.x !== undefined ? update.x : textBox.tile.x,
        y: update.y !== undefined ? update.y : textBox.tile.y
      }
    };
  });

  const missing = updates
    .filter((update) => {
      return !(view.textBoxes ?? []).some((textBox) => {
        return textBox.id === update.key;
      });
    })
    .map((update) => update.key);

  if (missing.length > 0) {
    throw new Error(`Unknown text box keys: ${missing.join(', ')}`);
  }

  return {
    ...model,
    views: [{ ...view, textBoxes }]
  };
};
