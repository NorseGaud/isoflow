import { produce } from 'immer';
import { Group } from 'src/types';
import { getItemByIdOrThrow } from 'src/utils';
import { State, ViewReducerContext } from './types';

export const updateGroup = (
  { id, ...updates }: { id: string } & Partial<Group>,
  { viewId, state }: ViewReducerContext
): State => {
  const view = getItemByIdOrThrow(state.model.views, viewId);

  const newState = produce(state, (draft) => {
    const { groups } = draft.model.views[view.index];

    if (!groups) return;

    const group = getItemByIdOrThrow(groups, id);
    const newGroup = { ...group.value, ...updates };
    groups[group.index] = newGroup;
  });

  return newState;
};

export const createGroup = (
  newGroup: Group,
  { viewId, state }: ViewReducerContext
): State => {
  const view = getItemByIdOrThrow(state.model.views, viewId);

  const newState = produce(state, (draft) => {
    const { groups } = draft.model.views[view.index];

    if (!groups) {
      draft.model.views[view.index].groups = [newGroup];
    } else {
      draft.model.views[view.index].groups?.unshift(newGroup);
    }
  });

  return updateGroup(newGroup, {
    viewId,
    state: newState
  });
};

export const deleteGroup = (
  id: string,
  { viewId, state }: ViewReducerContext
): State => {
  const view = getItemByIdOrThrow(state.model.views, viewId);
  const group = getItemByIdOrThrow(view.value.groups ?? [], id);

  const newState = produce(state, (draft) => {
    draft.model.views[view.index].groups?.splice(group.index, 1);
  });

  return newState;
};
