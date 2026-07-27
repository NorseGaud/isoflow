import type { InitialData, Model } from 'src/types';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === 'object' && value !== null;
};

const getString = (value: unknown, fallback = ''): string => {
  return typeof value === 'string' ? value : fallback;
};

const extractDocumentText = (node: unknown): string => {
  if (typeof node === 'string') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(extractDocumentText).join('');
  }

  if (!isRecord(node)) {
    return '';
  }

  if (node.type === 'text') {
    return getString(node.text);
  }

  return extractDocumentText(node.content);
};

const iconIdFromUrlSlug = (icons: UnknownRecord[], slug: string): string => {
  const match = icons.find((icon) => {
    const url = getString(icon.url);
    const filename = url.split('/').pop() ?? '';
    const urlSlug = filename.replace(/\.(svg|png|jpe?g|webp)$/i, '');

    return urlSlug === slug;
  });

  return getString(match?.id, slug);
};

const isLegacyPhysicalTopologyExport = (data: unknown): boolean => {
  if (!isRecord(data)) {
    return false;
  }

  const physicalTopology = data.physicalTopology;

  return (
    isRecord(physicalTopology) && Array.isArray(physicalTopology.components)
  );
};

const migratePhysicalTopologyExport = (data: UnknownRecord): InitialData => {
  const physicalTopology = data.physicalTopology as UnknownRecord;
  const icons = Array.isArray(data.icons)
    ? (data.icons as UnknownRecord[])
    : [];
  const components = Array.isArray(physicalTopology.components)
    ? (physicalTopology.components as UnknownRecord[])
    : [];
  const legacyViews = Array.isArray(physicalTopology.views)
    ? (physicalTopology.views as UnknownRecord[])
    : [];
  const colors = Array.isArray(physicalTopology.colors)
    ? physicalTopology.colors
    : [];
  const documents = isRecord(data.documents) ? data.documents : {};
  const documentList = Array.isArray(documents.list)
    ? (documents.list as UnknownRecord[])
    : [];

  const descriptionsByComponentId = new Map<string, string>();

  documentList.forEach((document) => {
    const itemReference = isRecord(document.itemReference)
      ? document.itemReference
      : null;

    if (itemReference?.type !== 'physicalTopology.component') {
      return;
    }

    const componentId = getString(itemReference.id);
    const description = extractDocumentText(document.data).trim().slice(0, 1000);

    if (componentId && description) {
      descriptionsByComponentId.set(componentId, description);
    }
  });

  const componentsById = new Map(
    components.map((component) => {
      return [getString(component.id), component] as const;
    })
  );

  const items: Model['items'] = [];
  const placedComponentIds = new Set<string>();

  const views: Model['views'] = legacyViews.map((view) => {
    const viewItems = Array.isArray(view.items)
      ? (view.items as UnknownRecord[])
      : [];

    const migratedViewItems = viewItems.map((viewItem) => {
      const componentId = getString(viewItem.component);
      const component = componentsById.get(componentId);
      const placementId = getString(viewItem.id);
      const iconSlug = getString(component?.icon);

      placedComponentIds.add(componentId);

      const item: Model['items'][number] = {
        id: placementId,
        name: getString(component?.name),
        icon: iconIdFromUrlSlug(icons, iconSlug)
      };

      const description = descriptionsByComponentId.get(componentId);

      if (description) {
        item.description = description;
      }

      items.push(item);

      const tile = isRecord(viewItem.tile)
        ? {
            x: Number(viewItem.tile.x) || 0,
            y: Number(viewItem.tile.y) || 0
          }
        : { x: 0, y: 0 };

      return {
        id: placementId,
        tile,
        ...(typeof viewItem.labelHeight === 'number'
          ? { labelHeight: viewItem.labelHeight }
          : {})
      };
    });

    return {
      id: getString(view.id),
      name: getString(view.name, 'Untitled'),
      ...(typeof view.description === 'string'
        ? { description: view.description }
        : {}),
      items: migratedViewItems,
      ...(Array.isArray(view.rectangles)
        ? { rectangles: view.rectangles as Model['views'][number]['rectangles'] }
        : {}),
      ...(Array.isArray(view.connectors)
        ? { connectors: view.connectors as Model['views'][number]['connectors'] }
        : {}),
      ...(Array.isArray(view.textBoxes)
        ? { textBoxes: view.textBoxes as Model['views'][number]['textBoxes'] }
        : {})
    };
  });

  components.forEach((component) => {
    const componentId = getString(component.id);

    if (!componentId || placedComponentIds.has(componentId)) {
      return;
    }

    const item: Model['items'][number] = {
      id: componentId,
      name: getString(component.name),
      icon: iconIdFromUrlSlug(icons, getString(component.icon))
    };

    const description = descriptionsByComponentId.get(componentId);

    if (description) {
      item.description = description;
    }

    items.push(item);
  });

  const project = isRecord(data.project) ? data.project : null;

  return {
    version: getString(data.version),
    title: getString(project?.title, getString(data.title, 'Untitled')),
    icons: icons as Model['icons'],
    colors: colors as Model['colors'],
    items,
    views,
    fitToView: true
  };
};

/** Normalize imported JSON (including Isoflow Pro physicalTopology exports). */
export const migrateImportedModel = (data: unknown): unknown => {
  if (isLegacyPhysicalTopologyExport(data)) {
    return migratePhysicalTopologyExport(data as UnknownRecord);
  }

  return data;
};
