import { DRAFT_GRAPH_SCHEMA_VERSION, type DraftGraphSnapshot } from '@/domain/draft-graph/contracts';

export function createDraftGraphFixture(): DraftGraphSnapshot {
  return {
    schemaVersion: DRAFT_GRAPH_SCHEMA_VERSION,
    snapshotVersion: 0,
    selectedNodeId: null,
    nodesById: {
      'folder-root': {
        internalId: 'folder-root',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '工作资料',
        url: null,
        parentId: null,
        childIds: ['bookmark-docs', 'folder-archive'],
        pathTokens: ['工作资料'],
      },
      'bookmark-docs': {
        internalId: 'bookmark-docs',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '产品文档',
        url: 'https://docs.example.com',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', '产品文档'],
      },
      'folder-archive': {
        internalId: 'folder-archive',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '归档',
        url: null,
        parentId: 'folder-root',
        childIds: ['bookmark-legacy'],
        pathTokens: ['工作资料', '归档'],
      },
      'bookmark-legacy': {
        internalId: 'bookmark-legacy',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '旧系统',
        url: 'https://legacy.example.com',
        parentId: 'folder-archive',
        childIds: [],
        pathTokens: ['工作资料', '归档', '旧系统'],
      },
    },
    rootIds: ['folder-root'],
  };
}

export function createLargeDraftGraphFixture(totalNodeCount = 1000): DraftGraphSnapshot {
  const rootId = 'folder-root-large';
  const childCount = Math.max(0, totalNodeCount - 1);
  const childIds = Array.from({ length: childCount }, (_, index) => `bookmark-large-${index + 1}`);
  const nodesById: DraftGraphSnapshot['nodesById'] = {
    [rootId]: {
      internalId: rootId,
      sourceType: 'draft',
      nodeType: 'folder',
      title: '大草稿根目录',
      url: null,
      parentId: null,
      childIds,
      pathTokens: ['大草稿根目录'],
    },
  };

  childIds.forEach((childId, index) => {
    const title = `节点 ${index + 1}`;
    nodesById[childId] = {
      internalId: childId,
      sourceType: 'draft',
      nodeType: 'bookmark',
      title,
      url: `https://example.com/${index + 1}`,
      parentId: rootId,
      childIds: [],
      pathTokens: ['大草稿根目录', title],
    };
  });

  return {
    schemaVersion: DRAFT_GRAPH_SCHEMA_VERSION,
    snapshotVersion: 0,
    selectedNodeId: null,
    nodesById,
    rootIds: [rootId],
  };
}
