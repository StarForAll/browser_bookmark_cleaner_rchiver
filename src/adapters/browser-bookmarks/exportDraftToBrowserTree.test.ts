import { describe, expect, test } from 'vitest';
import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { exportDraftToBrowserTree } from './exportDraftToBrowserTree';

function createDraftSnapshot(): DraftGraphSnapshot {
  return {
    schemaVersion: 'draft-graph/v1',
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
        childIds: ['bookmark-docs'],
        pathTokens: ['工作资料'],
      },
      'bookmark-docs': {
        internalId: 'bookmark-docs',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: 'Docs Hub',
        url: 'https://docs.example.com',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', 'Docs Hub'],
      },
    },
    rootIds: ['folder-root'],
  };
}

describe('T09B draft-to-browser export adapter', () => {
  test('exports a valid draft snapshot into browser bookmark tree nodes', () => {
    expect(exportDraftToBrowserTree(createDraftSnapshot())).toEqual([
      {
        id: 'folder-root',
        parentId: null,
        title: '工作资料',
        children: [
          {
            id: 'bookmark-docs',
            parentId: 'folder-root',
            title: 'Docs Hub',
            url: 'https://docs.example.com',
          },
        ],
      },
    ]);
  });

  test('throws a descriptive error when a bookmark node is missing a valid url during export', () => {
    const brokenSnapshot = {
      ...createDraftSnapshot(),
      nodesById: {
        ...createDraftSnapshot().nodesById,
        'bookmark-docs': {
          ...createDraftSnapshot().nodesById['bookmark-docs'],
          url: null,
        },
      },
    } as unknown as DraftGraphSnapshot;

    expect(() => exportDraftToBrowserTree(brokenSnapshot)).toThrow(
      'Draft bookmark node bookmark-docs is missing a valid url for browser export.',
    );
  });

  test('throws a descriptive error when a child node reference is missing during export', () => {
    const snapshot = createDraftSnapshot();
    const brokenSnapshot = {
      ...snapshot,
      nodesById: {
        'folder-root': {
          ...snapshot.nodesById['folder-root'],
          childIds: ['bookmark-missing'],
        },
        'bookmark-docs': snapshot.nodesById['bookmark-docs'],
      },
    } as unknown as DraftGraphSnapshot;

    expect(() => exportDraftToBrowserTree(brokenSnapshot)).toThrow(
      'Draft node bookmark-missing is missing during browser export.',
    );
  });
});
