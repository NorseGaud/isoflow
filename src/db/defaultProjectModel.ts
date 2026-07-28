import { INITIAL_DATA } from 'src/config';
import { Colors, InitialData } from 'src/types';
import { getIsopackIcons } from './icons';

const defaultColors: Colors = [
  { id: 'color1', value: '#a5b8f3' },
  { id: 'color2', value: '#bbadfb' },
  { id: 'color3', value: '#f4eb8e' },
  { id: 'color4', value: '#f0aca9' },
  { id: 'color5', value: '#fad6ac' },
  { id: 'color6', value: '#a8dc9d' },
  { id: 'color7', value: '#b3e5e3' }
];

/**
 * Build a new empty project model.
 * Icons are rehydrated from isopacks on read; storage keeps them stripped.
 * For in-memory editor bootstrap you may call with `includeIsopackIcons: true`.
 */
export const createDefaultProjectModel = (
  title: string,
  options?: { includeIsopackIcons?: boolean }
): InitialData => {
  return {
    ...INITIAL_DATA,
    title,
    icons: options?.includeIsopackIcons ? getIsopackIcons() : [],
    colors: defaultColors,
    items: [],
    views: [],
    fitToView: true
  };
};
