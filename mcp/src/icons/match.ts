import { buildIconIndex, IconIndexEntry } from './index';

const VENDOR_PREFIXES = [
  'aws',
  'amazon',
  'azure',
  'microsoft',
  'gcp',
  'google',
  'k8s',
  'kubernetes'
];

const normalize = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

const stripPrefixes = (value: string): string => {
  let next = value;

  VENDOR_PREFIXES.forEach((prefix) => {
    if (next.startsWith(`${prefix} `)) {
      next = next.slice(prefix.length + 1);
    }

    if (next.startsWith(`${prefix}-`)) {
      next = next.slice(prefix.length + 1);
    }
  });

  return next.trim();
};

const tokens = (value: string): string[] => {
  return normalize(stripPrefixes(normalize(value)))
    .split(' ')
    .filter(Boolean);
};

const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => {
    return Array(b.length + 1).fill(0);
  });

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

export type IconMatch = IconIndexEntry & { score: number; reason: string };

const scoreIcon = (query: string, icon: IconIndexEntry): IconMatch | null => {
  const q = normalize(query);
  const qStripped = normalize(stripPrefixes(q));
  const id = normalize(icon.id);
  const name = normalize(icon.name);
  const idStripped = normalize(stripPrefixes(id));
  const nameStripped = normalize(stripPrefixes(name));
  const qTokens = tokens(query);
  const iconTokens = new Set([...tokens(icon.id), ...tokens(icon.name)]);

  if (!q) return null;

  if (id === q || name === q) {
    return { ...icon, score: 100, reason: 'exact' };
  }

  if (idStripped === qStripped || nameStripped === qStripped) {
    return { ...icon, score: 95, reason: 'exact-stripped' };
  }

  if (
    id.startsWith(q) ||
    name.startsWith(q) ||
    idStripped.startsWith(qStripped) ||
    nameStripped.startsWith(qStripped)
  ) {
    return { ...icon, score: 85, reason: 'prefix' };
  }

  if (
    qTokens.length > 0 &&
    qTokens.every((token) => {
      return iconTokens.has(token);
    })
  ) {
    return { ...icon, score: 75, reason: 'token-subset' };
  }

  if (
    id.includes(q) ||
    name.includes(q) ||
    idStripped.includes(qStripped) ||
    nameStripped.includes(qStripped)
  ) {
    return { ...icon, score: 60, reason: 'substring' };
  }

  const distance = Math.min(
    levenshtein(qStripped, idStripped),
    levenshtein(qStripped, nameStripped)
  );
  const maxLen = Math.max(qStripped.length, idStripped.length, 1);

  if (distance <= 2 || distance / maxLen <= 0.25) {
    return {
      ...icon,
      score: Math.max(10, 50 - distance * 10),
      reason: 'edit-distance'
    };
  }

  return null;
};

export const searchIcons = (
  query: string,
  limit = 10,
  collection?: string
): IconMatch[] => {
  const index = buildIconIndex().filter((icon) => {
    if (!collection) return true;
    return icon.collection.toLowerCase() === collection.toLowerCase();
  });

  return index
    .map((icon) => {
      return scoreIcon(query, icon);
    })
    .filter((match): match is IconMatch => {
      return Boolean(match);
    })
    .sort((a, b) => {
      return b.score - a.score || a.id.localeCompare(b.id);
    })
    .slice(0, limit);
};

const ISOFLOW_MATCH_MIN_SCORE = 60;

export const resolveIconId = (
  query: string | undefined,
  fallback = 'server'
): string => {
  const resolveFallback = () => {
    const isoflowFallback = searchIcons(fallback, 1, 'isoflow')[0];
    if (isoflowFallback) return isoflowFallback.id;

    const fallbackMatch = searchIcons(fallback, 1)[0];
    return fallbackMatch?.id ?? 'server';
  };

  if (!query) {
    return resolveFallback();
  }

  const isoflowMatch = searchIcons(query, 1, 'isoflow')[0];
  if (isoflowMatch && isoflowMatch.score >= ISOFLOW_MATCH_MIN_SCORE) {
    return isoflowMatch.id;
  }

  const match = searchIcons(query, 1)[0];

  if (match) return match.id;

  return resolveFallback();
};
