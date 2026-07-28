import React from 'react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useScene } from 'src/hooks/useScene';
import { IsoTileArea } from 'src/components/IsoTileArea/IsoTileArea';
import { getColorVariant } from 'src/utils';
import { useColor } from 'src/hooks/useColor';
import { Group } from './Group';

interface Props {
  groups: ReturnType<typeof useScene>['groups'];
}

const DrawPreview = () => {
  const mode = useUiStateStore((state) => state.mode);
  const { colors } = useScene();
  const color = useColor(colors[0]?.id);

  if (mode.type !== 'GROUP.DRAW' || !mode.region) return null;

  return (
    <IsoTileArea
      from={mode.region.from}
      to={mode.region.to}
      fill={getColorVariant(color.value, 'light', { grade: 1, alpha: 0.2 })}
      cornerRadius={22}
      stroke={{
        color: getColorVariant(color.value, 'dark', { grade: 2 }),
        width: 2
      }}
    />
  );
};

export const Groups = ({ groups }: Props) => {
  return (
    <>
      <DrawPreview />
      {[...groups].reverse().map((group) => {
        return <Group key={group.id} {...group} />;
      })}
    </>
  );
};
