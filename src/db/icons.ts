/* eslint-disable import/no-extraneous-dependencies */
import { flattenCollections } from '@isoflow/isopacks/dist/utils';
import isoflowIsopack from '@isoflow/isopacks/dist/isoflow';
import awsIsopack from '@isoflow/isopacks/dist/aws';
import gcpIsopack from '@isoflow/isopacks/dist/gcp';
import azureIsopack from '@isoflow/isopacks/dist/azure';
import kubernetesIsopack from '@isoflow/isopacks/dist/kubernetes';
import { CUSTOM_ICON_COLLECTION } from 'src/config';
import type { Icon, InitialData, Model } from 'src/types';

let cachedIsopackIcons: Icon[] | null = null;
let cachedIsopackIdSet: Set<string> | null = null;

export const getIsopackIcons = (): Icon[] => {
  if (!cachedIsopackIcons) {
    cachedIsopackIcons = flattenCollections([
      isoflowIsopack,
      awsIsopack,
      azureIsopack,
      gcpIsopack,
      kubernetesIsopack
    ]) as Icon[];
  }

  return cachedIsopackIcons;
};

export const getIsopackIconIdSet = (): Set<string> => {
  if (!cachedIsopackIdSet) {
    cachedIsopackIdSet = new Set(
      getIsopackIcons().map((icon) => {
        return icon.id;
      })
    );
  }

  return cachedIsopackIdSet;
};

/** Keep only non-isopack (custom / user) icons for persistence. */
export const stripIsopackIcons = <T extends Pick<Model, 'icons'>>(
  model: T
): T => {
  const isopackIds = getIsopackIconIdSet();

  return {
    ...model,
    icons: model.icons.filter((icon) => {
      if (icon.collection === CUSTOM_ICON_COLLECTION) return true;
      return !isopackIds.has(icon.id);
    })
  };
};

/**
 * Merge isopack icons with any custom icons stored on the model.
 * Custom icons win on id collision.
 */
export const rehydrateIcons = <T extends Pick<Model, 'icons'>>(model: T): T => {
  const customById = new Map(
    model.icons.map((icon) => {
      return [icon.id, icon] as const;
    })
  );

  const merged: Icon[] = getIsopackIcons().map((icon) => {
    return customById.get(icon.id) ?? icon;
  });

  model.icons.forEach((icon) => {
    if (!getIsopackIconIdSet().has(icon.id)) {
      merged.push(icon);
    }
  });

  return {
    ...model,
    icons: merged
  };
};

export const prepareModelForStorage = (
  model: InitialData | Model | Record<string, unknown>
): Model => {
  const asModel = model as Model;
  const stripped = stripIsopackIcons({
    version: asModel.version,
    title: asModel.title,
    description: asModel.description,
    colors: asModel.colors ?? [],
    icons: asModel.icons ?? [],
    items: asModel.items ?? [],
    views: asModel.views ?? []
  });

  return stripped;
};

export const prepareModelForClient = (model: Model): InitialData => {
  return {
    ...rehydrateIcons(model),
    fitToView: true
  };
};
