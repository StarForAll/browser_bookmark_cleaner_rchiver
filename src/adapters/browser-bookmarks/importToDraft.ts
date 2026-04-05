import { DRAFT_GRAPH_SCHEMA_VERSION, type DraftGraphSnapshot, type DraftSourceType } from '@/domain/draft-graph/contracts';
import type { BrowserBookmarkTreeNode } from './contracts';

type ImportBrowserTreeInput = {
  source: DraftSourceType;
  tree: BrowserBookmarkTreeNode[];
};

export function importBrowserTreeToDraftGraph(input: ImportBrowserTreeInput): DraftGraphSnapshot {
  const nodesById: DraftGraphSnapshot['nodesById'] = {};
  const rootIds: string[] = [];

  const browserTreeRoots = input.tree.flatMap((node) => {
    if (node.id === '0' && Array.isArray(node.children)) {
      return node.children;
    }
    return [node];
  });

  const managedRoots = browserTreeRoots.flatMap((node) => {
    if (node.parentId === '0' && Array.isArray(node.children)) {
      return node.children;
    }
    return [node];
  });

  const walk = (node: BrowserBookmarkTreeNode, parentId: string | null, parentTokens: string[]) => {
    const internalId = `browser-${node.id}`;
    const isFolder = Array.isArray(node.children);
    const title = node.title ?? '';
    const pathTokens = [...parentTokens, title];
    const childNodes = isFolder ? node.children ?? [] : [];
    const childIds = childNodes.map((child) => `browser-${child.id}`);
    let nodeUrl: string | null = null;

    if (!isFolder) {
      if (node.url === undefined) {
        throw new Error(`Bookmark node ${node.id} must include a validated url before import.`);
      }
      nodeUrl = node.url;
    }

    nodesById[internalId] = {
      internalId,
      sourceType: input.source,
      nodeType: isFolder ? 'folder' : 'bookmark',
      title,
      url: nodeUrl,
      parentId,
      childIds,
      pathTokens,
    };

    for (const child of childNodes) {
      walk(child, internalId, pathTokens);
    }
  };

  for (const rootNode of managedRoots) {
    const rootId = `browser-${rootNode.id}`;
    rootIds.push(rootId);
    walk(rootNode, null, []);
  }

  return {
    schemaVersion: DRAFT_GRAPH_SCHEMA_VERSION,
    snapshotVersion: 0,
    selectedNodeId: null,
    nodesById,
    rootIds,
  };
}
