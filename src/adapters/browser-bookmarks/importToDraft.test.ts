import { describe, expect, test } from 'vitest';
import { DRAFT_GRAPH_SCHEMA_VERSION, validateDraftGraphSnapshot } from '@/domain/draft-graph/contracts';

describe('T05 browser bookmark adapter import boundary', () => {
  test('maps a chrome bookmark tree into a normalized draft snapshot without leaking browser-only roots', async () => {
    const adapter = await import('./importToDraft');

    const result = adapter.importBrowserTreeToDraftGraph({
      source: 'browser',
      tree: [
        {
          id: '1',
          parentId: '0',
          title: 'Bookmarks Bar',
          children: [
            {
              id: '100',
              parentId: '1',
              title: 'Work',
              children: [
                {
                  id: '100-1',
                  parentId: '100',
                  title: 'Docs',
                  url: 'https://docs.example.com',
                },
              ],
            },
          ],
        },
      ],
    });

    expect(result.schemaVersion).toBe(DRAFT_GRAPH_SCHEMA_VERSION);
    expect(result.snapshotVersion).toBe(0);
    expect(result.selectedNodeId).toBeNull();
    expect(result.rootIds.length).toBeGreaterThan(0);

    const validation = validateDraftGraphSnapshot(result);
    expect(validation.ok).toBe(true);

    if (validation.ok) {
      const nodes = Object.values(validation.value.nodesById);
      expect(nodes.some((node) => node.nodeType === 'bookmark' && node.url === 'https://docs.example.com')).toBe(
        true,
      );
      expect(nodes.some((node) => node.title === 'Bookmarks Bar')).toBe(false);
    }
  });

  test('skips the getTree root node and the browser structural root containers during import', async () => {
    const adapter = await import('./importToDraft');

    const result = adapter.importBrowserTreeToDraftGraph({
      source: 'browser',
      tree: [
        {
          id: '0',
          parentId: null,
          title: '',
          children: [
            {
              id: '1',
              parentId: '0',
              title: 'Bookmarks Bar',
              children: [
                {
                  id: '10',
                  parentId: '1',
                  title: 'Docs',
                  url: 'https://docs.example.com',
                },
              ],
            },
          ],
        },
      ],
    });

    expect(result.rootIds).toEqual(['browser-10']);
    expect(result.nodesById['browser-10']?.title).toBe('Docs');
    expect(result.nodesById['browser-1']).toBeUndefined();
    expect(result.nodesById['browser-0']).toBeUndefined();
  });
});
