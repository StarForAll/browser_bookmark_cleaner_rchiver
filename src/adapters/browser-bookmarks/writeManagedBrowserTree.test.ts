import { describe, expect, test, vi } from 'vitest';
import type { BrowserBookmarkTreeNode } from './contracts';
import { writeManagedBrowserTree } from './writeManagedBrowserTree';

function createInitialBrowserTree(): BrowserBookmarkTreeNode[] {
  return [
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
              title: 'Old Docs',
              url: 'https://old.example.com',
            },
          ],
        },
      ],
    },
  ];
}

function cloneTree<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createTreeWithFolderAndBookmarkTargets(): BrowserBookmarkTreeNode[] {
  return [
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
              title: 'Existing Folder',
              children: [],
            },
            {
              id: '11',
              parentId: '1',
              title: 'Existing Bookmark',
              url: 'https://old.example.com',
            },
          ],
        },
      ],
    },
  ];
}

function createTreeWithTopLevelOrder(
  orderedIds: string[],
): BrowserBookmarkTreeNode[] {
  const nodeById: Record<string, BrowserBookmarkTreeNode> = {
    '10': {
      id: '10',
      parentId: '1',
      title: 'Alpha',
      url: 'https://alpha.example.com',
    },
    '11': {
      id: '11',
      parentId: '1',
      title: 'Bravo',
      url: 'https://bravo.example.com',
    },
    '12': {
      id: '12',
      parentId: '1',
      title: 'Charlie',
      url: 'https://charlie.example.com',
    },
    '13': {
      id: '13',
      parentId: '1',
      title: 'Delta',
      url: 'https://delta.example.com',
    },
  };

  return [
    {
      id: '0',
      parentId: null,
      title: '',
      children: [
        {
          id: '1',
          parentId: '0',
          title: 'Bookmarks Bar',
          children: orderedIds.map((id) => {
            const node = nodeById[id];
            if (!node) {
              throw new Error(`Missing test node for id ${id}`);
            }
            return cloneTree(node);
          }),
        },
      ],
    },
  ];
}

describe('T09B managed browser bookmark writer', () => {
  test('restores the original top-level order when an existing browser bookmark was manually moved elsewhere', async () => {
    const browserTreeState = createTreeWithTopLevelOrder(['10', '11', '13', '12']);
    const desiredTree = createTreeWithTopLevelOrder(['10', '11', '12', '13']);

    const bookmarksApi = {
      getTree: vi.fn(async () => cloneTree(browserTreeState)),
      update: vi.fn(async (id: string, changes: { title?: string; url?: string }) => {
        const children = browserTreeState[0]?.children?.[0]?.children ?? [];
        const bookmark = children.find((node) => node.id === id);
        if (bookmark && !Array.isArray(bookmark.children)) {
          bookmark.title = changes.title ?? bookmark.title;
          bookmark.url = changes.url ?? bookmark.url;
        }
        return { id };
      }),
      create: vi.fn(async () => ({ id: 'created-bookmark' })),
      move: vi.fn(async (id: string, destination: { parentId?: string; index?: number }) => {
        const children = browserTreeState[0]?.children?.[0]?.children ?? [];
        const currentIndex = children.findIndex((node) => node.id === id);
        if (currentIndex < 0) {
          throw new Error(`bookmark ${id} not found`);
        }
        const [moved] = children.splice(currentIndex, 1);
        children.splice(destination.index ?? children.length, 0, {
          ...moved,
          parentId: destination.parentId ?? moved.parentId,
        });
        return { id };
      }),
      remove: vi.fn(async () => undefined),
      removeTree: vi.fn(async () => undefined),
    };

    const result = await writeManagedBrowserTree(
      {
        desiredTree,
        currentTree: browserTreeState,
      },
      bookmarksApi,
    );

    expect(result).toEqual({ kind: 'written' });
    expect(bookmarksApi.move).toHaveBeenCalledWith('12', {
      index: 2,
      parentId: '1',
    });
    expect(
      browserTreeState[0]?.children?.[0]?.children?.map((node) => node.id),
    ).toEqual(['10', '11', '12', '13']);
  });

  test('does not try to move a removed stale id after recreating an earlier node with a different type', async () => {
    const browserTreeState: BrowserBookmarkTreeNode[] = [
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
                title: 'Legacy Folder',
                children: [],
              },
              {
                id: '11',
                parentId: '1',
                title: 'Bravo',
                url: 'https://bravo.example.com',
              },
            ],
          },
        ],
      },
    ];
    let nextCreatedId = 20;

    const bookmarksApi = {
      getTree: vi.fn(async () => cloneTree(browserTreeState)),
      update: vi.fn(async (id: string, changes: { title?: string; url?: string }) => {
        const children = browserTreeState[0]?.children?.[0]?.children ?? [];
        const bookmark = children.find((node) => node.id === id);
        if (bookmark && !Array.isArray(bookmark.children)) {
          bookmark.title = changes.title ?? bookmark.title;
          bookmark.url = changes.url ?? bookmark.url;
        }
        return { id };
      }),
      create: vi.fn(async (bookmark: { parentId?: string; title: string; url?: string; index?: number }) => {
        const children = browserTreeState[0]?.children?.[0]?.children ?? [];
        const createdId = String(nextCreatedId);
        nextCreatedId += 1;
        const createdNode: BrowserBookmarkTreeNode =
          bookmark.url === undefined
            ? {
                id: createdId,
                parentId: bookmark.parentId ?? '1',
                title: bookmark.title,
                children: [],
              }
            : {
                id: createdId,
                parentId: bookmark.parentId ?? '1',
                title: bookmark.title,
                url: bookmark.url,
              };
        children.splice(bookmark.index ?? children.length, 0, createdNode);
        return { id: createdId };
      }),
      move: vi.fn(async (id: string, destination: { parentId?: string; index?: number }) => {
        const children = browserTreeState[0]?.children?.[0]?.children ?? [];
        const currentIndex = children.findIndex((node) => node.id === id);
        if (currentIndex < 0) {
          throw new Error("Can't find bookmark for id.");
        }
        const [moved] = children.splice(currentIndex, 1);
        children.splice(destination.index ?? children.length, 0, {
          ...moved,
          parentId: destination.parentId ?? moved.parentId,
        });
        return { id };
      }),
      remove: vi.fn(async () => undefined),
      removeTree: vi.fn(async (id: string) => {
        const children = browserTreeState[0]?.children?.[0]?.children ?? [];
        const index = children.findIndex((node) => node.id === id);
        if (index < 0) {
          throw new Error("Can't find bookmark for id.");
        }
        children.splice(index, 1);
        return undefined;
      }),
    };

    const result = await writeManagedBrowserTree(
      {
        desiredTree: [
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
                    id: '20',
                    parentId: '1',
                    title: 'Alpha Replacement',
                    url: 'https://alpha.example.com',
                  },
                  {
                    id: '11',
                    parentId: '1',
                    title: 'Bravo',
                    url: 'https://bravo.example.com',
                  },
                  {
                    id: '10',
                    parentId: '1',
                    title: 'Legacy Folder',
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
        currentTree: browserTreeState,
      },
      bookmarksApi,
    );

    expect(result).toEqual({ kind: 'written' });
    expect(bookmarksApi.move).toHaveBeenCalledWith('11', {
      index: 1,
      parentId: '1',
    });
    expect(
      browserTreeState[0]?.children?.[0]?.children?.map((node) => node.title),
    ).toEqual(['Alpha Replacement', 'Bravo', 'Legacy Folder']);
  });

  test('omits the url field when updating or creating folder nodes so browser APIs do not reject folder writes', async () => {
    const currentTree = createTreeWithFolderAndBookmarkTargets();
    const update = vi.fn(async () => ({ id: '10' }));
    const create = vi.fn(async () => ({ id: '12' }));

    const result = await writeManagedBrowserTree(
      {
        desiredTree: [
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
                    title: 'Existing Folder',
                    children: [],
                  },
                  {
                    id: '11',
                    parentId: '1',
                    title: 'Existing Bookmark',
                    url: 'https://old.example.com',
                  },
                  {
                    id: '12',
                    parentId: '1',
                    title: 'New Empty Folder',
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
        currentTree,
      },
      {
        getTree: vi.fn(async () => cloneTree(currentTree)),
        update,
        create,
        remove: vi.fn(async () => undefined),
        removeTree: vi.fn(async () => undefined),
      },
    );

    expect(result).toEqual({ kind: 'written' });
    expect(update).toHaveBeenCalledWith('10', {
      title: 'Existing Folder',
    });
    expect(create).toHaveBeenCalledWith({
      index: 2,
      parentId: '1',
      title: 'New Empty Folder',
    });
  });

  test('attempts best-effort rollback when sync fails after partial browser mutation', async () => {
    const browserTreeState = createInitialBrowserTree();
    const originalSnapshot = cloneTree(browserTreeState);
    let createAttempts = 0;

    const bookmarksApi = {
      getTree: vi.fn(async () => cloneTree(browserTreeState)),
      update: vi.fn(async (id: string, changes: { title?: string; url?: string }) => {
        const bookmark = browserTreeState[0]?.children?.[0]?.children?.find((node) => node.id === id);
        if (bookmark) {
          bookmark.title = changes.title ?? bookmark.title;
          bookmark.url = changes.url ?? bookmark.url;
        }
        return { id };
      }),
      create: vi.fn(async () => {
        createAttempts += 1;
        throw new Error(`create failed on attempt ${createAttempts}`);
      }),
      remove: vi.fn(async () => undefined),
      removeTree: vi.fn(async () => undefined),
    };

    const result = await writeManagedBrowserTree(
      {
        desiredTree: [
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
                    title: 'New Docs',
                    url: 'https://new.example.com',
                  },
                  {
                    id: '11',
                    parentId: '1',
                    title: 'New Extra',
                    url: 'https://extra.example.com',
                  },
                ],
              },
            ],
          },
        ],
      },
      bookmarksApi,
    );

    expect(result).toEqual({
      kind: 'rolled-back-after-error',
      error: 'create failed on attempt 1',
    });
    expect(bookmarksApi.getTree).toHaveBeenCalledTimes(2);
    expect(bookmarksApi.update).toHaveBeenCalledTimes(2);
    expect(browserTreeState).toEqual(originalSnapshot);
  });

  test('re-reads the live browser tree during rollback so partially created folders are removed', async () => {
    const browserTreeState = createInitialBrowserTree();
    const originalSnapshot = cloneTree(browserTreeState);
    let createAttempts = 0;

    const bookmarksApi = {
      getTree: vi.fn(async () => cloneTree(browserTreeState)),
      update: vi.fn(async (id: string, changes: { title?: string; url?: string }) => {
        const bookmark = browserTreeState[0]?.children?.[0]?.children?.find((node) => node.id === id);
        if (bookmark && !Array.isArray(bookmark.children)) {
          bookmark.title = changes.title ?? bookmark.title;
          bookmark.url = changes.url ?? bookmark.url;
        }
        return { id };
      }),
      create: vi.fn(async (bookmark: { parentId?: string; title: string; url?: string }) => {
        createAttempts += 1;

        if (createAttempts === 1) {
          const children = browserTreeState[0]?.children?.[0]?.children;
          children?.push({
            id: '12',
            parentId: bookmark.parentId ?? '1',
            title: bookmark.title,
            children: [],
          });
          return { id: '12' };
        }

        throw new Error(`create failed on attempt ${createAttempts}`);
      }),
      remove: vi.fn(async (id: string) => {
        const children = browserTreeState[0]?.children?.[0]?.children ?? [];
        const index = children.findIndex((node) => node.id === id);
        if (index >= 0) {
          children.splice(index, 1);
        }
        return undefined;
      }),
      removeTree: vi.fn(async (id: string) => {
        const children = browserTreeState[0]?.children?.[0]?.children ?? [];
        const index = children.findIndex((node) => node.id === id);
        if (index >= 0) {
          children.splice(index, 1);
        }
        return undefined;
      }),
    };

    const result = await writeManagedBrowserTree(
      {
        desiredTree: [
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
                    title: 'Old Docs',
                    url: 'https://old.example.com',
                  },
                  {
                    id: '12',
                    parentId: '1',
                    title: 'New Empty Folder',
                    children: [],
                  },
                  {
                    id: '13',
                    parentId: '1',
                    title: 'New Bookmark',
                    url: 'https://new.example.com',
                  },
                ],
              },
            ],
          },
        ],
      },
      bookmarksApi,
    );

    expect(result).toEqual({
      kind: 'rolled-back-after-error',
      error: 'create failed on attempt 2',
    });
    expect(bookmarksApi.getTree).toHaveBeenCalledTimes(2);
    expect(browserTreeState).toEqual(originalSnapshot);
  });

  test('skips reading browser bookmarks when currentTree is provided explicitly', async () => {
    const currentTree = createInitialBrowserTree();
    const bookmarksApi = {
      getTree: vi.fn(async () => {
        throw new Error('getTree should not be called');
      }),
      update: vi.fn(async () => ({ id: '10' })),
      create: vi.fn(async () => ({ id: 'created-bookmark' })),
      remove: vi.fn(async () => undefined),
      removeTree: vi.fn(async () => undefined),
    };

    const result = await writeManagedBrowserTree(
      {
        desiredTree: currentTree,
        currentTree,
      },
      bookmarksApi,
    );

    expect(result).toEqual({ kind: 'written' });
    expect(bookmarksApi.getTree).not.toHaveBeenCalled();
  });

  test('returns rollback-failed when rollback also fails after a partial browser mutation', async () => {
    const browserTreeState = createInitialBrowserTree();
    let createAttempts = 0;
    let updateAttempts = 0;

    const bookmarksApi = {
      getTree: vi.fn(async () => cloneTree(browserTreeState)),
      update: vi.fn(async (id: string, changes: { title?: string; url?: string }) => {
        updateAttempts += 1;
        if (updateAttempts >= 2) {
          throw new Error('rollback update failed');
        }

        const bookmark = browserTreeState[0]?.children?.[0]?.children?.find((node) => node.id === id);
        if (bookmark) {
          bookmark.title = changes.title ?? bookmark.title;
          bookmark.url = changes.url ?? bookmark.url;
        }
        return { id };
      }),
      create: vi.fn(async () => {
        createAttempts += 1;
        throw new Error(`create failed on attempt ${createAttempts}`);
      }),
      remove: vi.fn(async () => undefined),
      removeTree: vi.fn(async () => undefined),
    };

    const result = await writeManagedBrowserTree(
      {
        desiredTree: [
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
                    title: 'New Docs',
                    url: 'https://new.example.com',
                  },
                  {
                    id: '11',
                    parentId: '1',
                    title: 'New Extra',
                    url: 'https://extra.example.com',
                  },
                ],
              },
            ],
          },
        ],
      },
      bookmarksApi,
    );

    expect(result).toEqual({
      kind: 'rollback-failed',
      error: 'create failed on attempt 1',
      rollbackError: 'rollback update failed',
    });
    expect(bookmarksApi.getTree).toHaveBeenCalledTimes(2);
  });
});
