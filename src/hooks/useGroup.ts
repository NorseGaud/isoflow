import { useMemo } from 'react';
import { getItemByIdOrThrow } from 'src/utils';
import { useScene } from 'src/hooks/useScene';

export const useGroup = (id: string) => {
  const { groups } = useScene();

  const group = useMemo(() => {
    return getItemByIdOrThrow(groups, id).value;
  }, [groups, id]);

  return group;
};
