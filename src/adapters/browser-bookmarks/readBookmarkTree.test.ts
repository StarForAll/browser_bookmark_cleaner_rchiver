import { describe, expect, test, vi } from 'vitest';
import { readBrowserBookmarkTree } from './readBookmarkTree';

describe('T05 browser bookmark reader adapter', () => {
  test('accepts the real getTree root node shape before browser structural folders', async () => {
    const result = await readBrowserBookmarkTree({
      getTree: vi.fn(async () => [
        {
          id: '0',
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
      ]),
    });

    expect(result).toEqual({
      kind: 'loaded',
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
                  children: undefined,
                },
              ],
              url: undefined,
            },
          ],
          url: undefined,
        },
      ],
    });
  });

  test('normalizes a Chrome bookmark tree into the browser bookmark contract', async () => {
    const result = await readBrowserBookmarkTree({
      getTree: vi.fn(async () => [
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
      ]),
    });

    expect(result).toEqual({
      kind: 'loaded',
      tree: [
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
              children: undefined,
            },
          ],
          url: undefined,
        },
      ],
    });
  });

  test('returns unavailable when the bookmarks API is missing', async () => {
    await expect(readBrowserBookmarkTree()).resolves.toEqual({
      kind: 'unavailable',
    });
  });

  test('returns an error when a leaf bookmark node is missing a non-empty url', async () => {
    const result = await readBrowserBookmarkTree({
      getTree: vi.fn(async () => [
        {
          id: '1',
          parentId: '0',
          title: 'Bookmarks Bar',
          children: [
            {
              id: '10',
              parentId: '1',
              title: 'Broken Bookmark',
            },
          ],
        },
      ]),
    });

    expect(result).toEqual({
      kind: 'error',
      error: 'tree[0].children[0].url must be a non-empty string for bookmark leaves.',
    });
  });
});
