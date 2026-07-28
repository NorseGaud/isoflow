/* eslint-disable import/no-extraneous-dependencies */
import { flattenCollections } from '@isoflow/isopacks/dist/utils';
import isoflowIsopack from '@isoflow/isopacks/dist/isoflow';
import awsIsopack from '@isoflow/isopacks/dist/aws';
import gcpIsopack from '@isoflow/isopacks/dist/gcp';
import azureIsopack from '@isoflow/isopacks/dist/azure';
import kubernetesIsopack from '@isoflow/isopacks/dist/kubernetes';

export type IconIndexEntry = {
  id: string;
  name: string;
  collection: string;
  isIsometric: boolean;
};

let cachedIndex: IconIndexEntry[] | null = null;

export const buildIconIndex = (): IconIndexEntry[] => {
  if (cachedIndex) return cachedIndex;

  const icons = flattenCollections([
    isoflowIsopack,
    awsIsopack,
    azureIsopack,
    gcpIsopack,
    kubernetesIsopack
  ]) as Array<{
    id: string;
    name: string;
    collection?: string;
    isIsometric?: boolean;
  }>;

  cachedIndex = icons.map((icon) => {
    return {
      id: icon.id,
      name: icon.name,
      collection: icon.collection ?? 'unknown',
      isIsometric: Boolean(icon.isIsometric)
    };
  });

  return cachedIndex;
};
