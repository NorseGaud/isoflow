import { v4 as uuid } from 'uuid';
import type { Group, InitialData, Model } from '../../../src/types';

export type GroupInput = {
  key?: string;
  name: string;
  color?: string;
  memberKeys: string[];
};

export type GroupUpdate = {
  key: string;
  name?: string;
  color?: string;
  addMembers?: string[];
  removeMembers?: string[];
  setMembers?: string[];
};

const resolveColorId = (
  color: string | undefined,
  colors: Model['colors']
): string | undefined => {
  if (!color) return colors[0]?.id;
  const byId = colors.find((entry) => entry.id === color);
  if (byId) return byId.id;
  const normalized = color.startsWith('#') ? color.slice(0, 7) : color;
  const byValue = colors.find((entry) => {
    return entry.value.toLowerCase() === normalized.toLowerCase();
  });
  return byValue?.id ?? colors[0]?.id;
};

const resolveMemberIds = (
  memberKeys: string[],
  viewItems: { id: string }[]
): string[] => {
  const missing = memberKeys.filter((key) => {
    return !viewItems.some((item) => item.id === key);
  });

  if (missing.length > 0) {
    throw new Error(`Unknown member keys: ${missing.join(', ')}`);
  }

  return memberKeys;
};

export const addGroups = (
  model: InitialData | Model,
  groups: GroupInput[]
): Model => {
  const view = model.views[0];
  if (!view) {
    throw new Error('Project has no view');
  }

  const next = [...(view.groups ?? [])];
  groups.forEach((group) => {
    next.push({
      id: group.key?.trim() || uuid(),
      name: group.name,
      color: resolveColorId(group.color, model.colors),
      memberIds: resolveMemberIds(group.memberKeys, view.items)
    });
  });

  return {
    ...model,
    views: [{ ...view, groups: next }]
  };
};

export const updateGroups = (
  model: InitialData | Model,
  updates: GroupUpdate[]
): Model => {
  const view = model.views[0];
  if (!view) {
    throw new Error('Project has no view');
  }

  const updateMap = new Map(
    updates.map((update) => {
      return [update.key, update] as const;
    })
  );

  const groups = (view.groups ?? []).map((group) => {
    const update = updateMap.get(group.id);
    if (!update) return group;

    let memberIds = group.memberIds;

    if (update.setMembers !== undefined) {
      memberIds = resolveMemberIds(update.setMembers, view.items);
    } else {
      if (update.addMembers?.length) {
        const added = resolveMemberIds(update.addMembers, view.items);
        memberIds = [...new Set([...memberIds, ...added])];
      }
      if (update.removeMembers?.length) {
        const removeSet = new Set(update.removeMembers);
        memberIds = memberIds.filter((memberId) => !removeSet.has(memberId));
      }
    }

    const next: Group = {
      ...group,
      name: update.name ?? group.name,
      color:
        update.color !== undefined
          ? resolveColorId(update.color, model.colors)
          : group.color,
      memberIds
    };

    return next;
  });

  const missing = updates
    .filter((update) => {
      return !(view.groups ?? []).some((group) => {
        return group.id === update.key;
      });
    })
    .map((update) => update.key);

  if (missing.length > 0) {
    throw new Error(`Unknown group keys: ${missing.join(', ')}`);
  }

  return {
    ...model,
    views: [{ ...view, groups }]
  };
};
