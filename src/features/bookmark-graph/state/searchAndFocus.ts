import type { DraftGraphNode, DraftGraphSnapshot } from '@/domain/draft-graph/contracts';

export type SearchAndFocusInput = {
  searchQuery: string;
  duplicateOnly: boolean;
};

export type DerivedSearchResult = {
  nodeId: string;
  title: string;
  url: string;
  pathLabel: string;
  duplicateCount: number;
  matchKind: 'title' | 'url';
};

export type DuplicateHoverDetails = {
  duplicateCount: number;
  initialVisiblePaths: string[];
  allPaths: string[];
  hasMore: boolean;
};

export type DuplicateFocusGroupEntry = {
  nodeId: string;
  title: string;
  pathLabel: string;
  isMatched: boolean;
};

export type DuplicateFocusGroup = {
  url: string;
  duplicateCount: number;
  entries: DuplicateFocusGroupEntry[];
};

type DuplicateEntry = {
  nodeId: string;
  pathLabel: string;
};

type SearchableBookmarkNode = DraftGraphNode & {
  nodeType: 'bookmark';
  url: string;
};

function isSearchableBookmarkNode(node: DraftGraphNode): node is SearchableBookmarkNode {
  return node.nodeType === 'bookmark' && typeof node.url === 'string' && node.url.length > 0;
}

function buildPathLabel(node: DraftGraphNode): string {
  return node.pathTokens.join(' / ');
}

function normalizeSearchQuery(searchQuery: string): string {
  return searchQuery.trim().toLocaleLowerCase();
}

function collectBookmarkTraversal(snapshot: DraftGraphSnapshot): SearchableBookmarkNode[] {
  const traversal: SearchableBookmarkNode[] = [];

  const visitNode = (nodeId: string): void => {
    const node = snapshot.nodesById[nodeId];
    if (!node) {
      return;
    }

    if (isSearchableBookmarkNode(node)) {
      traversal.push(node);
    }

    node.childIds.forEach(visitNode);
  };

  snapshot.rootIds.forEach(visitNode);

  return traversal;
}

function withReadableDuplicateSuffix(entries: DuplicateEntry[]): DuplicateEntry[] {
  const basePathCounts = new Map<string, number>();
  entries.forEach((entry) => {
    basePathCounts.set(entry.pathLabel, (basePathCounts.get(entry.pathLabel) ?? 0) + 1);
  });

  const seenByBasePath = new Map<string, number>();

  return entries.map((entry) => {
    const duplicateCount = basePathCounts.get(entry.pathLabel) ?? 0;
    if (duplicateCount <= 1) {
      return entry;
    }

    const nextIndex = (seenByBasePath.get(entry.pathLabel) ?? 0) + 1;
    seenByBasePath.set(entry.pathLabel, nextIndex);

    return {
      ...entry,
      pathLabel: `${entry.pathLabel} #${nextIndex}`,
    };
  });
}

function deriveDuplicateEntriesByUrl(snapshot: DraftGraphSnapshot): Map<string, DuplicateEntry[]> {
  const bookmarkTraversal = collectBookmarkTraversal(snapshot);
  const entriesByUrl = new Map<string, DuplicateEntry[]>();

  bookmarkTraversal.forEach((node) => {
    const duplicateEntries = entriesByUrl.get(node.url) ?? [];
    duplicateEntries.push({
      nodeId: node.internalId,
      pathLabel: buildPathLabel(node),
    });
    entriesByUrl.set(node.url, duplicateEntries);
  });

  const duplicateOnlyEntries = new Map<string, DuplicateEntry[]>();

  entriesByUrl.forEach((entries, url) => {
    if (entries.length <= 1) {
      return;
    }

    duplicateOnlyEntries.set(url, withReadableDuplicateSuffix(entries));
  });

  return duplicateOnlyEntries;
}

function ensureHoveredPathIsInitiallyVisible(
  duplicateEntries: DuplicateEntry[],
  hoveredNodeId: string,
): DuplicateEntry[] {
  if (duplicateEntries.length <= 2) {
    return duplicateEntries;
  }

  const firstTwoEntries = duplicateEntries.slice(0, 2);
  if (firstTwoEntries.some((entry) => entry.nodeId === hoveredNodeId)) {
    return firstTwoEntries;
  }

  const hoveredEntry = duplicateEntries.find((entry) => entry.nodeId === hoveredNodeId);
  if (!hoveredEntry) {
    return firstTwoEntries;
  }

  return [firstTwoEntries[0], hoveredEntry];
}

export function deriveDuplicateNodeIds(snapshot: DraftGraphSnapshot): string[] {
  const duplicateEntriesByUrl = deriveDuplicateEntriesByUrl(snapshot);
  const bookmarkTraversal = collectBookmarkTraversal(snapshot);

  return bookmarkTraversal
    .filter((node) => duplicateEntriesByUrl.has(node.url))
    .map((node) => node.internalId);
}

export function deriveSearchResults(
  snapshot: DraftGraphSnapshot,
  input: SearchAndFocusInput,
): DerivedSearchResult[] {
  const normalizedQuery = normalizeSearchQuery(input.searchQuery);
  const duplicateEntriesByUrl = deriveDuplicateEntriesByUrl(snapshot);
  const bookmarkTraversal = collectBookmarkTraversal(snapshot);
  const candidateNodes = input.duplicateOnly
    ? bookmarkTraversal.filter((node) => duplicateEntriesByUrl.has(node.url))
    : bookmarkTraversal;

  const titleMatches: DerivedSearchResult[] = [];
  const urlMatches: DerivedSearchResult[] = [];

  candidateNodes.forEach((node) => {
    const duplicateCount = duplicateEntriesByUrl.get(node.url)?.length ?? 1;
    const resultBase = {
      nodeId: node.internalId,
      title: node.title,
      url: node.url,
      pathLabel: buildPathLabel(node),
      duplicateCount,
    } satisfies Omit<DerivedSearchResult, 'matchKind'>;

    if (normalizedQuery === '') {
      titleMatches.push({
        ...resultBase,
        matchKind: 'title',
      });
      return;
    }

    const titleMatchesQuery = node.title.toLocaleLowerCase().includes(normalizedQuery);
    if (titleMatchesQuery) {
      titleMatches.push({
        ...resultBase,
        matchKind: 'title',
      });
      return;
    }

    if (node.url.toLocaleLowerCase().includes(normalizedQuery)) {
      urlMatches.push({
        ...resultBase,
        matchKind: 'url',
      });
    }
  });

  return [...titleMatches, ...urlMatches];
}

export function deriveDuplicateFocusGroups(
  snapshot: DraftGraphSnapshot,
  input: SearchAndFocusInput,
): DuplicateFocusGroup[] {
  if (!input.duplicateOnly) {
    return [];
  }

  const normalizedQuery = normalizeSearchQuery(input.searchQuery);
  const duplicateEntriesByUrl = deriveDuplicateEntriesByUrl(snapshot);
  const bookmarkTraversal = collectBookmarkTraversal(snapshot);
  const matchingNodeIdsByUrl = new Map<string, Set<string>>();

  if (normalizedQuery !== '') {
    bookmarkTraversal.forEach((node) => {
      if (!duplicateEntriesByUrl.has(node.url)) {
        return;
      }

      const matchesQuery =
        node.title.toLocaleLowerCase().includes(normalizedQuery) ||
        node.url.toLocaleLowerCase().includes(normalizedQuery);

      if (!matchesQuery) {
        return;
      }

      const matchedIds = matchingNodeIdsByUrl.get(node.url) ?? new Set<string>();
      matchedIds.add(node.internalId);
      matchingNodeIdsByUrl.set(node.url, matchedIds);
    });
  }

  return Array.from(duplicateEntriesByUrl.entries())
    .filter(([url]) => normalizedQuery === '' || matchingNodeIdsByUrl.has(url))
    .map(([url, duplicateEntries]) => {
      const matchedNodeIds = matchingNodeIdsByUrl.get(url) ?? new Set<string>();
      const entries = duplicateEntries.map((entry) => {
        const node = snapshot.nodesById[entry.nodeId];

        return {
          nodeId: entry.nodeId,
          title: node?.title ?? '',
          pathLabel: entry.pathLabel,
          isMatched: matchedNodeIds.has(entry.nodeId),
        } satisfies DuplicateFocusGroupEntry;
      });

      const orderedEntries =
        normalizedQuery === ''
          ? entries
          : [
              ...entries.filter((entry) => entry.isMatched),
              ...entries.filter((entry) => !entry.isMatched),
            ];

      return {
        url,
        duplicateCount: duplicateEntries.length,
        entries: orderedEntries,
      } satisfies DuplicateFocusGroup;
    });
}

export function deriveDuplicateHoverDetails(
  snapshot: DraftGraphSnapshot,
  nodeId: string,
): DuplicateHoverDetails | null {
  const hoveredNode = snapshot.nodesById[nodeId];
  if (!hoveredNode || hoveredNode.nodeType !== 'bookmark' || !hoveredNode.url) {
    return null;
  }

  const duplicateEntries = deriveDuplicateEntriesByUrl(snapshot).get(hoveredNode.url);
  if (!duplicateEntries) {
    return null;
  }

  const initialVisibleEntries = ensureHoveredPathIsInitiallyVisible(duplicateEntries, nodeId);
  const allPaths = duplicateEntries.map((entry) => entry.pathLabel);
  const initialVisiblePaths = initialVisibleEntries.map((entry) => entry.pathLabel);

  return {
    duplicateCount: duplicateEntries.length,
    initialVisiblePaths,
    allPaths,
    hasMore: duplicateEntries.length > initialVisibleEntries.length,
  };
}
