import { useCallback } from 'react';
import { Icon } from 'src/types';
import { CUSTOM_ICON_COLLECTION } from 'src/config';
import { addStoredCustomIcons, generateId } from 'src/utils';
import { useModelStore } from 'src/stores/modelStore';
import { useUiStateStore } from 'src/stores/uiStateStore';

const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

export const ICON_UPLOAD_ACCEPT =
  'image/png,image/jpeg,image/gif,image/webp,image/svg+xml,.svg';

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error(`Failed to read ${file.name}`));
    };
    reader.readAsDataURL(file);
  });
};

const iconNameFromFile = (file: File) => {
  const name = file.name.replace(/\.[^.]+$/, '').trim();

  return (name || 'Custom icon').slice(0, 100);
};

const isAcceptedImageFile = (file: File) => {
  if (ACCEPTED_MIME_TYPES.indexOf(file.type) !== -1) return true;

  return file.name.toLowerCase().endsWith('.svg');
};

export const useIconUpload = () => {
  const modelActions = useModelStore((state) => {
    return state.actions;
  });
  const iconCategoriesState = useUiStateStore((state) => {
    return state.iconCategoriesState;
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });

  const uploadIcons = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter(isAcceptedImageFile);

      if (imageFiles.length === 0) return [];

      const newIcons: Icon[] = await Promise.all(
        imageFiles.map(async (file) => {
          const url = await readFileAsDataUrl(file);

          return {
            id: generateId(),
            name: iconNameFromFile(file),
            url,
            collection: CUSTOM_ICON_COLLECTION,
            isIsometric: false
          };
        })
      );

      modelActions.set((state) => {
        return {
          icons: [...state.icons, ...newIcons]
        };
      });

      await addStoredCustomIcons(newIcons);

      const existingIndex = iconCategoriesState.findIndex((collection) => {
        return collection.id === CUSTOM_ICON_COLLECTION;
      });

      if (existingIndex === -1) {
        uiStateActions.setIconCategoriesState([
          { id: CUSTOM_ICON_COLLECTION, isExpanded: true },
          ...iconCategoriesState
        ]);
      } else {
        uiStateActions.setIconCategoriesState(
          iconCategoriesState.map((collection, index) => {
            if (index !== existingIndex) return collection;

            return {
              ...collection,
              isExpanded: true
            };
          })
        );
      }

      return newIcons;
    },
    [modelActions, iconCategoriesState, uiStateActions]
  );

  return {
    uploadIcons
  };
};
