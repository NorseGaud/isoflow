/* eslint-disable import/no-extraneous-dependencies */
import { flattenCollections } from '@isoflow/isopacks/dist/utils';
import isoflowIsopack from '@isoflow/isopacks/dist/isoflow';
import awsIsopack from '@isoflow/isopacks/dist/aws';
import gcpIsopack from '@isoflow/isopacks/dist/gcp';
import azureIsopack from '@isoflow/isopacks/dist/azure';
import kubernetesIsopack from '@isoflow/isopacks/dist/kubernetes';
import { INITIAL_DATA } from 'src/config';
import { Colors, InitialData } from 'src/types';

const isopackIcons = flattenCollections([
  isoflowIsopack,
  awsIsopack,
  azureIsopack,
  gcpIsopack,
  kubernetesIsopack
]);

const defaultColors: Colors = [
  { id: 'color1', value: '#a5b8f3' },
  { id: 'color2', value: '#bbadfb' },
  { id: 'color3', value: '#f4eb8e' },
  { id: 'color4', value: '#f0aca9' },
  { id: 'color5', value: '#fad6ac' },
  { id: 'color6', value: '#a8dc9d' },
  { id: 'color7', value: '#b3e5e3' }
];

export const createDefaultProjectModel = (title: string): InitialData => {
  return {
    ...INITIAL_DATA,
    title,
    icons: isopackIcons,
    colors: defaultColors,
    items: [],
    views: [],
    fitToView: true
  };
};
