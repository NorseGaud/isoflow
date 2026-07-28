import { v4 as uuid } from 'uuid';
import { modelSchema } from '../../../src/schemas/model';
import type { InitialData, Model, View } from '../../../src/types';
import { resolveIconId } from '../icons/match';
import { layoutDiagram } from '../layout/layout';
import type { DiagramSpec } from './types';

const DEFAULT_COLORS: Model['colors'] = [
  { id: 'color1', value: '#a5b8f3' },
  { id: 'color2', value: '#bbadfb' },
  { id: 'color3', value: '#f4eb8e' },
  { id: 'color4', value: '#f0aca9' },
  { id: 'color5', value: '#fad6ac' },
  { id: 'color6', value: '#a8dc9d' },
  { id: 'color7', value: '#b3e5e3' }
];

const sanitizeKey = (key: string): string => {
  const trimmed = key.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 100) : uuid();
};

const resolveColorId = (
  color: string | undefined,
  colors: Model['colors']
): string => {
  if (!color) return colors[0]?.id ?? 'color1';

  const byId = colors.find((entry) => entry.id === color);
  if (byId) return byId.id;

  const normalized = color.startsWith('#') ? color.slice(0, 7) : color;
  const byValue = colors.find((entry) => {
    return entry.value.toLowerCase() === normalized.toLowerCase();
  });

  if (byValue) return byValue.id;

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    const id = `color-${normalized.slice(1).toLowerCase()}`;
    colors.push({ id, value: normalized });
    return id;
  }

  return colors[0]?.id ?? 'color1';
};

/**
 * Compile a semantic diagram spec into a Model.
 * When `existing` is provided, tiles for matching node keys (ids) are preserved.
 */
export const compileDiagramSpec = (
  spec: DiagramSpec,
  existing?: Model | InitialData | null
): Model => {
  const nodes = spec.nodes.map((node) => {
    return {
      ...node,
      key: sanitizeKey(node.key)
    };
  });

  const edges = (spec.edges ?? []).map((edge) => {
    return {
      ...edge,
      from: sanitizeKey(edge.from),
      to: sanitizeKey(edge.to)
    };
  });

  const groups = (spec.groups ?? []).map((group) => {
    return {
      ...group,
      key: sanitizeKey(group.key)
    };
  });

  const layout = layoutDiagram(
    nodes.map((node) => {
      return { key: node.key, group: node.group };
    }),
    edges.map((edge) => {
      return { from: edge.from, to: edge.to };
    }),
    groups.map((group) => {
      return { key: group.key };
    })
  );

  const existingTiles = new Map<string, { x: number; y: number }>();
  const existingView = existing?.views?.[0];

  existingView?.items.forEach((item) => {
    existingTiles.set(item.id, item.tile);
  });

  const colors = [...DEFAULT_COLORS];

  const items: Model['items'] = nodes.map((node) => {
    return {
      id: node.key,
      name: node.label.slice(0, 100),
      description: node.description?.slice(0, 1000),
      icon: resolveIconId(node.icon, node.label)
    };
  });

  const viewItems = layout.nodes.map((laidOut) => {
    return {
      id: laidOut.key,
      tile: existingTiles.get(laidOut.key) ?? laidOut.tile,
      showLabel: true,
      labelHeight: 90
    };
  });

  const rectangles =
    layout.groups.length === 0
      ? undefined
      : layout.groups
          .filter((group) => {
            return nodes.some((node) => node.group === group.key);
          })
          .map((group) => {
            const groupSpec = groups.find((entry) => entry.key === group.key);
            return {
              id: `rect-${group.key}`,
              color: resolveColorId(groupSpec?.color, colors),
              from: group.from,
              to: group.to
            };
          });

  const connectors = edges.map((edge, edgeIndex) => {
    return {
      id: `conn-${edge.from}-${edge.to}-${edgeIndex}`,
      description: edge.label?.slice(0, 1000),
      color: colors[0]?.id,
      style: edge.style,
      anchors: [
        { id: `a-${edgeIndex}-from`, ref: { item: edge.from } },
        { id: `a-${edgeIndex}-to`, ref: { item: edge.to } }
      ]
    };
  });

  const view: View = {
    id: existingView?.id ?? 'view-main',
    name: existingView?.name ?? 'Overview',
    items: viewItems,
    rectangles,
    connectors,
    // Intentionally no group title textBoxes — isometric text overlaps icons.
    // Region meaning comes from node names + rectangle color only.
    textBoxes: []
  };

  const neededIconIds = new Set(
    items
      .map((item) => item.icon)
      .filter((iconId): iconId is string => Boolean(iconId))
  );

  const model: Model = {
    version: existing?.version ?? '1.0.0',
    title: (spec.title ?? spec.projectName).slice(0, 100),
    description: existing?.description,
    colors,
    // Stubs satisfy referential validation; server rehydrates real isopack icons on read.
    icons: [...neededIconIds].map((id) => {
      return {
        id,
        name: id,
        url: `isopack://${id}`,
        collection: 'isoflow'
      };
    }),
    items,
    views: [view]
  };

  const parsed = modelSchema.safeParse(model);

  if (!parsed.success) {
    throw new Error(
      `Compiled model failed validation: ${parsed.error.issues
        .map((issue) => issue.message)
        .join('; ')}`
    );
  }

  return parsed.data;
};
