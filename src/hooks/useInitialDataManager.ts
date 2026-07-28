import { useCallback, useState, useRef, useEffect } from 'react';
import { InitialData, IconCollectionState } from 'src/types';
import { INITIAL_DATA, INITIAL_SCENE_STATE } from 'src/config';
import {
  getFitToViewParams,
  CoordsUtils,
  categoriseIcons,
  generateId,
  getItemByIdOrThrow,
  mergeIconsWithStoredCustomIcons,
  migrateImportedModel
} from 'src/utils';
import * as reducers from 'src/stores/reducers';
import { useModelStore } from 'src/stores/modelStore';
import { useView } from 'src/hooks/useView';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { modelSchema } from 'src/schemas/model';

export const useInitialDataManager = () => {
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);
  const prevInitialData = useRef<InitialData | undefined>(undefined);
  const loadIdRef = useRef(0);
  const pendingFitToViewRef = useRef(false);
  const model = useModelStore((state) => {
    return state;
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const rendererEl = useUiStateStore((state) => {
    return state.rendererEl;
  });
  const rendererElRef = useRef(rendererEl);
  const activeViewId = useUiStateStore((state) => {
    return state.view;
  });
  const views = useModelStore((state) => {
    return state.views;
  });
  const { changeView } = useView();

  useEffect(() => {
    rendererElRef.current = rendererEl;
  }, [rendererEl]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  // First load often runs before Renderer mounts (renderer size is 0).
  // Re-fit once the canvas element exists — without reloading the model.
  useEffect(() => {
    if (!isReady || !rendererEl || !pendingFitToViewRef.current) return;
    if (!activeViewId) return;

    try {
      const currentView = getItemByIdOrThrow(views, activeViewId).value;
      const rendererSize = rendererEl.getBoundingClientRect();

      if (rendererSize.width <= 0 || rendererSize.height <= 0) return;

      const { zoom, scroll } = getFitToViewParams(currentView, {
        width: rendererSize.width,
        height: rendererSize.height
      });

      uiStateActions.setScroll({
        position: scroll,
        offset: CoordsUtils.zero()
      });
      uiStateActions.setZoom(zoom);
      pendingFitToViewRef.current = false;
    } catch {
      // View may not be ready yet; keep the pending flag.
    }
  }, [isReady, rendererEl, activeViewId, views, uiStateActions]);

  const load = useCallback(
    async (_initialData: InitialData) => {
      if (!_initialData || prevInitialData.current === _initialData) return;

      const loadId = loadIdRef.current + 1;
      loadIdRef.current = loadId;

      const importedData = migrateImportedModel(_initialData) as InitialData;
      const validationResult = modelSchema.safeParse(importedData);

      if (!validationResult.success) {
        // TODO: let's get better at reporting error messages here (starting with how we present them to users)
        // - not in console but in a modal
        console.log(validationResult.error.issues);
        window.alert('There is an error in your model.');
        return;
      }

      // Only unmount the editor on the first load. Reloads (fit-to-view
      // refresh, AgentBridge updates) must keep the canvas mounted — otherwise
      // setting isReady=false returns null from Isoflow and the user sees a
      // blank editor. rendererEl also must not be a load() dependency, or
      // mounting the Renderer retriggers load and blanks the canvas.
      if (!isReadyRef.current) {
        setIsReady(false);
      }

      const icons = await mergeIconsWithStoredCustomIcons(importedData.icons);

      if (loadIdRef.current !== loadId) return;

      const initialData: InitialData = {
        ...importedData,
        icons
      };

      if (initialData.views.length === 0) {
        const updates = reducers.view({
          action: 'CREATE_VIEW',
          payload: {},
          ctx: {
            state: { model: initialData, scene: INITIAL_SCENE_STATE },
            viewId: generateId()
          }
        });

        Object.assign(initialData, updates.model);
      }

      prevInitialData.current = _initialData;
      model.actions.set(initialData);

      const view = getItemByIdOrThrow(
        initialData.views,
        initialData.view ?? initialData.views[0].id
      );

      changeView(view.value.id, initialData);

      if (initialData.fitToView) {
        const rendererSize = rendererElRef.current?.getBoundingClientRect();
        const hasSize =
          (rendererSize?.width ?? 0) > 0 && (rendererSize?.height ?? 0) > 0;

        if (hasSize && rendererSize) {
          const { zoom, scroll } = getFitToViewParams(view.value, {
            width: rendererSize.width,
            height: rendererSize.height
          });

          uiStateActions.setScroll({
            position: scroll,
            offset: CoordsUtils.zero()
          });

          uiStateActions.setZoom(zoom);
          pendingFitToViewRef.current = false;
        } else {
          pendingFitToViewRef.current = true;
        }
      } else {
        pendingFitToViewRef.current = false;
      }

      const categoriesState: IconCollectionState[] = categoriseIcons(
        initialData.icons
      ).map((collection) => {
        return {
          id: collection.name,
          isExpanded: false
        };
      });

      uiStateActions.setIconCategoriesState(categoriesState);

      setIsReady(true);
    },
    [changeView, model.actions, uiStateActions]
  );

  const clear = useCallback(() => {
    load({ ...INITIAL_DATA, icons: model.icons, colors: model.colors });
    uiStateActions.resetUiState();
  }, [load, model.icons, model.colors, uiStateActions]);

  return {
    load,
    clear,
    isReady
  };
};
