import { modelSchema } from '../../src/schemas/model';
import { rehydrateIcons, stripIsopackIcons } from '../../src/db/icons';
import type { InitialData, Model } from '../../src/types';

/** Export model JSON without isopack URL bloat. */
export const exportModelJson = (model: InitialData | Model): string => {
  const stripped = stripIsopackIcons({
    version: model.version,
    title: model.title,
    description: model.description,
    colors: model.colors ?? [],
    icons: model.icons ?? [],
    items: model.items ?? [],
    views: model.views ?? []
  });

  return JSON.stringify(stripped, null, 2);
};

/** Parse, validate, and rehydrate an imported model JSON string. */
export const importModelJson = (json: string): Model => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('import_json: body is not valid JSON');
  }

  const asModel = parsed as Model;
  const normalized: Model = {
    version: asModel.version,
    title: asModel.title,
    description: asModel.description,
    colors: asModel.colors ?? [],
    icons: asModel.icons ?? [],
    items: asModel.items ?? [],
    views: asModel.views ?? []
  };

  const rehydrated = rehydrateIcons(normalized);
  return modelSchema.parse(rehydrated);
};
