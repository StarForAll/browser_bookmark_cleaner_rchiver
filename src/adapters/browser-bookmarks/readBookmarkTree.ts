import { validateBrowserBookmarkTree, type BrowserBookmarkTreeNode } from './contracts';

type ChromeBookmarksApi = {
  getTree: () => Promise<unknown>;
};

type ChromeRuntime = {
  bookmarks?: ChromeBookmarksApi;
};

export type ReadBrowserBookmarkTreeResult =
  | {
      kind: 'loaded';
      tree: BrowserBookmarkTreeNode[];
    }
  | {
      kind: 'unavailable';
    }
  | {
      kind: 'error';
      error: string;
    };

export async function readBrowserBookmarkTree(
  bookmarksApi?: ChromeBookmarksApi,
): Promise<ReadBrowserBookmarkTreeResult> {
  const runtimeBookmarksApi =
    bookmarksApi ?? (globalThis as typeof globalThis & { chrome?: ChromeRuntime }).chrome?.bookmarks;

  if (!runtimeBookmarksApi?.getTree) {
    return {
      kind: 'unavailable',
    };
  }

  try {
    const rawTree = await runtimeBookmarksApi.getTree();
    const validation = validateBrowserBookmarkTree(rawTree);

    if (!validation.ok) {
      return {
        kind: 'error',
        error: validation.error,
      };
    }

    return {
      kind: 'loaded',
      tree: validation.value,
    };
  } catch (error) {
    return {
      kind: 'error',
      error: error instanceof Error ? error.message : 'Failed to read browser bookmarks.',
    };
  }
}
