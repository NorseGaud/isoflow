import { MARKDOWN_EMPTY_VALUE } from 'src/config';
import { ItemReference } from 'src/types';

export type StackedItemOption = {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string;
};

const toPlainDescription = (
  description: string | undefined
): string | null => {
  if (!description || description === MARKDOWN_EMPTY_VALUE) {
    return null;
  }

  const text = description.replace(/<[^>]*>/g, '').trim();

  return text || null;
};

export const getStackedItemOptions = ({
  itemRefs,
  modelItems,
  icons
}: {
  itemRefs: ItemReference[];
  modelItems: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
  }[];
  icons: { id: string; url: string; name: string }[];
}): StackedItemOption[] => {
  return itemRefs.flatMap((ref) => {
    const modelItem = modelItems.find((item) => {
      return item.id === ref.id;
    });

    if (!modelItem) {
      return [];
    }

    const icon = icons.find((entry) => {
      return entry.id === modelItem.icon;
    });

    return [
      {
        id: modelItem.id,
        name: modelItem.name,
        description: toPlainDescription(modelItem.description),
        iconUrl: icon?.url ?? ''
      }
    ];
  });
};
