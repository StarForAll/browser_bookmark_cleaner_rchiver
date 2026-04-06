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
