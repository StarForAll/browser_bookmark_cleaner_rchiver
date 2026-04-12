import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import type { BrowserBookmarkTreeNode } from './contracts';

function exportNode(
  snapshot: DraftGraphSnapshot,
  nodeId: string,
  parentId: string | null,
): BrowserBookmarkTreeNode {
  const node = snapshot.nodesById[nodeId];
  if (!node) {
    throw new Error(`Draft node ${nodeId} is missing during browser export.`);
  }

  if (node.nodeType === 'folder') {
    return {
      id: node.internalId,
      parentId,
      title: node.title,
      children: node.childIds.map((childId) => exportNode(snapshot, childId, node.internalId)),
    };
  }

  if (!node.url) {
    throw new Error(`Draft bookmark node ${node.internalId} is missing a valid url for browser export.`);
  }

  return {
    id: node.internalId,
    parentId,
    title: node.title,
    url: node.url,
  };
}

export function exportDraftToBrowserTree(
  snapshot: DraftGraphSnapshot,
): BrowserBookmarkTreeNode[] {
  return snapshot.rootIds.map((rootId) => exportNode(snapshot, rootId, null));
}
