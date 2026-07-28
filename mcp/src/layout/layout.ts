export type LayoutNode = {
  key: string;
  group?: string;
};

export type LayoutEdge = {
  from: string;
  to: string;
};

export type LayoutGroup = {
  key: string;
};

export type LaidOutNode = LayoutNode & {
  tile: { x: number; y: number };
  rank: number;
  order: number;
};

export type LaidOutGroup = LayoutGroup & {
  from: { x: number; y: number };
  to: { x: number; y: number };
};

export type LayoutResult = {
  nodes: LaidOutNode[];
  groups: LaidOutGroup[];
};

const uniqueKeys = (nodes: LayoutNode[]): string[] => {
  return [...new Set(nodes.map((node) => node.key))];
};

/** Remove back-edges discovered by DFS so ranking can treat the graph as a DAG. */
export const breakCycles = (
  nodeKeys: string[],
  edges: LayoutEdge[]
): LayoutEdge[] => {
  const keySet = new Set(nodeKeys);
  const adjacency = new Map<string, string[]>();

  nodeKeys.forEach((key) => {
    adjacency.set(key, []);
  });

  edges.forEach((edge) => {
    if (!keySet.has(edge.from) || !keySet.has(edge.to)) return;
    adjacency.get(edge.from)?.push(edge.to);
  });

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const backEdges = new Set<string>();

  const visit = (node: string) => {
    if (visited.has(node)) return;
    visiting.add(node);

    (adjacency.get(node) ?? []).forEach((next) => {
      if (visiting.has(next)) {
        backEdges.add(`${node}->${next}`);
        return;
      }
      visit(next);
    });

    visiting.delete(node);
    visited.add(node);
  };

  nodeKeys.forEach((key) => {
    visit(key);
  });

  return edges.filter((edge) => {
    return !backEdges.has(`${edge.from}->${edge.to}`);
  });
};

/** Longest-path ranking on a DAG. */
export const rankNodes = (
  nodeKeys: string[],
  edges: LayoutEdge[]
): Map<string, number> => {
  const ranks = new Map<string, number>();
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  nodeKeys.forEach((key) => {
    ranks.set(key, 0);
    indegree.set(key, 0);
    outgoing.set(key, []);
  });

  edges.forEach((edge) => {
    if (!ranks.has(edge.from) || !ranks.has(edge.to)) return;
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  });

  const queue = nodeKeys.filter((key) => {
    return (indegree.get(key) ?? 0) === 0;
  });

  while (queue.length > 0) {
    const node = queue.shift() as string;
    const rank = ranks.get(node) ?? 0;

    (outgoing.get(node) ?? []).forEach((next) => {
      ranks.set(next, Math.max(ranks.get(next) ?? 0, rank + 1));
      const nextIndegee = (indegree.get(next) ?? 1) - 1;
      indegree.set(next, nextIndegee);

      if (nextIndegee === 0) {
        queue.push(next);
      }
    });
  }

  return ranks;
};

const barycenterOrder = (
  nodesInRank: string[],
  previousOrder: Map<string, number>,
  edges: LayoutEdge[],
  direction: 'forward' | 'backward'
): string[] => {
  const scores = new Map<string, number>();

  nodesInRank.forEach((node, index) => {
    const neighbors =
      direction === 'forward'
        ? edges.filter((edge) => edge.to === node).map((edge) => edge.from)
        : edges.filter((edge) => edge.from === node).map((edge) => edge.to);

    if (neighbors.length === 0) {
      scores.set(node, index);
      return;
    }

    const sum = neighbors.reduce((acc, neighbor) => {
      return acc + (previousOrder.get(neighbor) ?? 0);
    }, 0);

    scores.set(node, sum / neighbors.length);
  });

  return [...nodesInRank].sort((a, b) => {
    return (scores.get(a) ?? 0) - (scores.get(b) ?? 0) || a.localeCompare(b);
  });
};

/**
 * Map rank r and position p within the rank to isometric tile coords.
 *
 * Prefer a horizontal screen flow: keep x+y roughly constant along a lane
 * (isometric "level"), and advance x-y with rank so stages read left→right.
 * Peers in the same rank spread along x+y (up/down on screen).
 */
/** Tile distance between successive ranks / peers — keeps labels readable. */
export const LAYOUT_RANK_SCALE = 3;
export const LAYOUT_PEER_SCALE = 2;

export const rankPositionToTile = (
  rank: number,
  position: number,
  rankSize: number
): { x: number; y: number } => {
  const centered = position - (rankSize - 1) / 2;
  const spread = Math.round(centered);
  return {
    x: rank * LAYOUT_RANK_SCALE + spread * LAYOUT_PEER_SCALE,
    y: -rank * LAYOUT_RANK_SCALE + spread * LAYOUT_PEER_SCALE
  };
};

export const layoutDiagram = (
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  groups: LayoutGroup[] = []
): LayoutResult => {
  const keys = uniqueKeys(nodes);
  const nodeByKey = new Map(
    nodes.map((node) => {
      return [node.key, node] as const;
    })
  );

  const dagEdges = breakCycles(keys, edges);
  const ranks = rankNodes(keys, dagEdges);

  const byRank = new Map<number, string[]>();

  keys.forEach((key) => {
    const rank = ranks.get(key) ?? 0;
    const list = byRank.get(rank) ?? [];
    list.push(key);
    byRank.set(rank, list);
  });

  const sortedRanks = [...byRank.keys()].sort((a, b) => {
    return a - b;
  });

  // Initial order: group affinity then key
  sortedRanks.forEach((rank) => {
    const list = byRank.get(rank) ?? [];
    list.sort((a, b) => {
      const groupA = nodeByKey.get(a)?.group ?? '';
      const groupB = nodeByKey.get(b)?.group ?? '';
      return groupA.localeCompare(groupB) || a.localeCompare(b);
    });
    byRank.set(rank, list);
  });

  // Two barycenter sweeps
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 1; i < sortedRanks.length; i += 1) {
      const prevRank = sortedRanks[i - 1];
      const rank = sortedRanks[i];
      const previousOrder = new Map(
        (byRank.get(prevRank) ?? []).map((key, index) => {
          return [key, index] as const;
        })
      );
      byRank.set(
        rank,
        barycenterOrder(byRank.get(rank) ?? [], previousOrder, dagEdges, 'forward')
      );
    }

    for (let i = sortedRanks.length - 2; i >= 0; i -= 1) {
      const nextRank = sortedRanks[i + 1];
      const rank = sortedRanks[i];
      const nextOrder = new Map(
        (byRank.get(nextRank) ?? []).map((key, index) => {
          return [key, index] as const;
        })
      );
      byRank.set(
        rank,
        barycenterOrder(byRank.get(rank) ?? [], nextOrder, dagEdges, 'backward')
      );
    }
  }

  const laidOut: LaidOutNode[] = [];
  const usedTiles = new Set<string>();

  sortedRanks.forEach((rank) => {
    const list = byRank.get(rank) ?? [];
    list.forEach((key, position) => {
      let tile = rankPositionToTile(rank, position, list.length);
      let guard = 0;

      while (usedTiles.has(`${tile.x},${tile.y}`) && guard < 100) {
        // Nudge along the peer (vertical) axis, not the flow axis.
        tile = {
          x: tile.x + LAYOUT_PEER_SCALE,
          y: tile.y + LAYOUT_PEER_SCALE
        };
        guard += 1;
      }

      usedTiles.add(`${tile.x},${tile.y}`);
      laidOut.push({
        key,
        group: nodeByKey.get(key)?.group,
        tile,
        rank,
        order: position
      });
    });
  });

  const laidOutGroups: LaidOutGroup[] = groups.map((group) => {
    const members = laidOut.filter((node) => {
      return node.group === group.key;
    });

    if (members.length === 0) {
      return {
        ...group,
        from: { x: 0, y: 0 },
        to: { x: 0, y: 0 }
      };
    }

    const xs = members.map((member) => member.tile.x);
    const ys = members.map((member) => member.tile.y);

    return {
      ...group,
      from: { x: Math.min(...xs) - 1, y: Math.min(...ys) - 1 },
      to: { x: Math.max(...xs) + 1, y: Math.max(...ys) + 1 }
    };
  });

  return { nodes: laidOut, groups: laidOutGroups };
};
