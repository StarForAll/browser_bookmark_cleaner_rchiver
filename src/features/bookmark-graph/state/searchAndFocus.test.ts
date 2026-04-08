import { describe, expect, test } from 'vitest';
import {
  DRAFT_GRAPH_SCHEMA_VERSION,
  type DraftGraphSnapshot,
} from '@/domain/draft-graph/contracts';

function createSearchRankingSnapshot(): DraftGraphSnapshot {
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
        childIds: [
          'bookmark-title-match',
          'bookmark-url-match',
          'folder-docs-zone',
          'bookmark-docs-hidden',
        ],
        pathTokens: ['工作资料'],
      },
      'bookmark-title-match': {
        internalId: 'bookmark-title-match',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: 'Docs Hub',
        url: 'https://portal.example.com',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', 'Docs Hub'],
      },
      'bookmark-url-match': {
        internalId: 'bookmark-url-match',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '镜像入口',
        url: 'https://docs.example.com/entry',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', '镜像入口'],
      },
      'folder-docs-zone': {
        internalId: 'folder-docs-zone',
        sourceType: 'draft',
        nodeType: 'folder',
        title: 'Docs 区',
        url: null,
        parentId: 'folder-root',
        childIds: ['bookmark-path-only'],
        pathTokens: ['工作资料', 'Docs 区'],
      },
      'bookmark-path-only': {
        internalId: 'bookmark-path-only',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '帮助中心',
        url: 'https://portal.example.com/help',
        parentId: 'folder-docs-zone',
        childIds: [],
        pathTokens: ['工作资料', 'Docs 区', '帮助中心'],
      },
      'bookmark-docs-hidden': {
        internalId: 'bookmark-docs-hidden',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '内部帮助',
        url: 'https://portal.example.com/internal',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', '内部帮助'],
      },
    },
    rootIds: ['folder-root'],
  };
}

function createDuplicateSnapshot(): DraftGraphSnapshot {
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
        childIds: ['bookmark-dup-a', 'folder-dup-group', 'bookmark-unique', 'folder-title-root'],
        pathTokens: ['工作资料'],
      },
      'bookmark-dup-a': {
        internalId: 'bookmark-dup-a',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '重复入口 A',
        url: 'https://shared.example.com',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', '重复入口 A'],
      },
      'folder-dup-group': {
        internalId: 'folder-dup-group',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '重复目录',
        url: null,
        parentId: 'folder-root',
        childIds: ['bookmark-dup-b'],
        pathTokens: ['工作资料', '重复目录'],
      },
      'bookmark-dup-b': {
        internalId: 'bookmark-dup-b',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '重复入口 B',
        url: 'https://shared.example.com',
        parentId: 'folder-dup-group',
        childIds: [],
        pathTokens: ['工作资料', '重复目录', '重复入口 B'],
      },
      'bookmark-unique': {
        internalId: 'bookmark-unique',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '唯一入口',
        url: 'https://shared.example.com/unique',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', '唯一入口'],
      },
      'folder-title-root': {
        internalId: 'folder-title-root',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '同名目录',
        url: null,
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', '同名目录'],
      },
      'folder-personal': {
        internalId: 'folder-personal',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '个人收藏',
        url: null,
        parentId: null,
        childIds: ['bookmark-dup-c', 'folder-title-personal'],
        pathTokens: ['个人收藏'],
      },
      'bookmark-dup-c': {
        internalId: 'bookmark-dup-c',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '重复入口 C',
        url: 'https://shared.example.com',
        parentId: 'folder-personal',
        childIds: [],
        pathTokens: ['个人收藏', '重复入口 C'],
      },
      'folder-title-personal': {
        internalId: 'folder-title-personal',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '同名目录',
        url: null,
        parentId: 'folder-personal',
        childIds: [],
        pathTokens: ['个人收藏', '同名目录'],
      },
    },
    rootIds: ['folder-root', 'folder-personal'],
  };
}

describe('T08A search and duplicate derivation gate', () => {
  test('ranks title matches ahead of URL-only matches and ignores path text or internal ids', async () => {
    const { deriveSearchResults } = await import('./searchAndFocus');

    const results = deriveSearchResults(createSearchRankingSnapshot(), {
      searchQuery: 'docs',
      duplicateOnly: false,
    });

    expect(results.map((result) => result.nodeId)).toEqual([
      'bookmark-title-match',
      'bookmark-url-match',
    ]);
  });

  test('scopes duplicate-only mode to exact duplicate URLs instead of folder-title repetition', async () => {
    const { deriveSearchResults } = await import('./searchAndFocus');

    const results = deriveSearchResults(createDuplicateSnapshot(), {
      searchQuery: '',
      duplicateOnly: true,
    });

    expect(results.map((result) => result.nodeId)).toEqual([
      'bookmark-dup-a',
      'bookmark-dup-b',
      'bookmark-dup-c',
    ]);
  });

  test('builds duplicate hover details with human-readable default paths and overflow metadata', async () => {
    const { deriveDuplicateHoverDetails } = await import('./searchAndFocus');

    const details = deriveDuplicateHoverDetails(createDuplicateSnapshot(), 'bookmark-dup-b');

    expect(details?.duplicateCount).toBe(3);
    expect(details?.initialVisiblePaths).toHaveLength(2);
    expect(details?.initialVisiblePaths).toContain('工作资料 / 重复目录 / 重复入口 B');
    expect(details?.initialVisiblePaths.some((path) => path.includes('bookmark-dup'))).toBe(false);
    expect(details?.hasMore).toBe(true);
    expect(details?.allPaths).toContain('个人收藏 / 重复入口 C');
  });

  test('groups duplicate-only results by exact URL so repeated items stay together for focused review', async () => {
    const { deriveDuplicateFocusGroups } = await import('./searchAndFocus');

    const groups = deriveDuplicateFocusGroups(createDuplicateSnapshot(), {
      searchQuery: '',
      duplicateOnly: true,
    });

    expect(groups).toHaveLength(1);
    expect(groups[0]?.url).toBe('https://shared.example.com');
    expect(groups[0]?.entries.map((entry) => entry.nodeId)).toEqual([
      'bookmark-dup-a',
      'bookmark-dup-b',
      'bookmark-dup-c',
    ]);
  });

  test('does not create duplicate hover details for folder-title repetition alone', async () => {
    const { deriveDuplicateHoverDetails } = await import('./searchAndFocus');

    expect(deriveDuplicateHoverDetails(createDuplicateSnapshot(), 'folder-title-root')).toBeNull();
  });
});
