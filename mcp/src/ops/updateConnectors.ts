import type { InitialData, Model } from '../../../src/types';

export type ConnectorUpdate = {
  id: string;
  style?: 'SOLID' | 'DOTTED' | 'DASHED';
  color?: string;
  width?: number;
  label?: string;
};

const resolveColorId = (
  color: string | undefined,
  colors: Model['colors']
): string | undefined => {
  if (!color) return undefined;
  const byId = colors.find((entry) => entry.id === color);
  if (byId) return byId.id;

  const normalized = color.startsWith('#') ? color.slice(0, 7) : color;
  const byValue = colors.find((entry) => {
    return entry.value.toLowerCase() === normalized.toLowerCase();
  });
  if (byValue) return byValue.id;

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return colors[0]?.id;
  }

  return color;
};

export const applyConnectorUpdates = (
  model: InitialData | Model,
  updates: ConnectorUpdate[]
): Model => {
  const view = model.views[0];
  if (!view) {
    throw new Error('Project has no view');
  }

  const updateMap = new Map(
    updates.map((update) => {
      return [update.id, update] as const;
    })
  );

  const connectors = (view.connectors ?? []).map((connector) => {
    const update = updateMap.get(connector.id);
    if (!update) return connector;

    return {
      ...connector,
      style: update.style ?? connector.style,
      width: update.width !== undefined ? update.width : connector.width,
      description:
        update.label !== undefined ? update.label : connector.description,
      color:
        update.color !== undefined
          ? resolveColorId(update.color, model.colors) ?? connector.color
          : connector.color
    };
  });

  const missing = updates
    .filter((update) => {
      return !(view.connectors ?? []).some(
        (connector) => connector.id === update.id
      );
    })
    .map((update) => update.id);

  if (missing.length > 0) {
    throw new Error(`Unknown connector ids: ${missing.join(', ')}`);
  }

  return {
    ...model,
    views: [{ ...view, connectors }]
  };
};
