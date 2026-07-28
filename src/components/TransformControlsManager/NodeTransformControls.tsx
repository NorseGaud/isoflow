import React, { useMemo } from 'react';
import { useViewItem } from 'src/hooks/useViewItem';
import { useScene } from 'src/hooks/useScene';
import { useModelStore } from 'src/stores/modelStore';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { getItemsAtTile } from 'src/utils';
import { TransformControls } from './TransformControls';
import { StackedItemsPicker } from './StackedItemsPicker/StackedItemsPicker';
import { getStackedItemOptions } from './StackedItemsPicker/getStackedItemOptions';

interface Props {
  id: string;
}

export const NodeTransformControls = ({ id }: Props) => {
  const node = useViewItem(id);
  const scene = useScene();
  const modelItems = useModelStore((state) => {
    return state.items;
  });
  const icons = useModelStore((state) => {
    return state.icons;
  });
  const setItemControls = useUiStateStore((state) => {
    return state.actions.setItemControls;
  });
  const stackedPickerReopenToken = useUiStateStore((state) => {
    return state.stackedPickerReopenToken;
  });

  const options = useMemo(() => {
    const itemRefs = getItemsAtTile({ tile: node.tile, scene });

    return getStackedItemOptions({
      itemRefs,
      modelItems,
      icons
    });
  }, [node.tile, scene, modelItems, icons]);

  return (
    <>
      <TransformControls from={node.tile} to={node.tile} />
      <StackedItemsPicker
        tile={node.tile}
        selectedId={id}
        options={options}
        reopenToken={stackedPickerReopenToken}
        onSelect={(nextId) => {
          setItemControls({ type: 'ITEM', id: nextId });
        }}
      />
    </>
  );
};
