import { readBrowserBookmarkTree, type ReadBrowserBookmarkTreeResult } from './readBookmarkTree';
import type { BrowserBookmarkTreeNode } from './contracts';

type ChromeBookmarkCreateInput = {
  parentId?: string;
  title: string;
  url?: string;
};

type ChromeBookmarkChangeInput = {
  title?: string;
  url?: string;
};

type ChromeBookmarkCreateResult = {
  id?: string;
};

type ChromeBookmarksApi = {
  getTree: () => Promise<unknown>;
  create: (bookmark: ChromeBookmarkCreateInput) => Promise<ChromeBookmarkCreateResult>;
  update: (id: string, changes: ChromeBookmarkChangeInput) => Promise<unknown>;
  removeTree?: (id: string) => Promise<unknown>;
  remove?: (id: string) => Promise<unknown>;
};

type ChromeRuntime = {
  bookmarks?: ChromeBookmarksApi;
};

export type WriteManagedBrowserTreeResult =
  | {
      kind: 'written';
    }
  | {
      kind: 'unavailable';
    }
  | {
      kind: 'error';
      error: string;
    }
  | {
      kind: 'rolled-back-after-error';
      error: string;
    }
  | {
      kind: 'rollback-failed';
      error: string;
      rollbackError: string;
    };

type WriteManagedBrowserTreeInput = {
  desiredTree: BrowserBookmarkTreeNode[];
  currentTree?: BrowserBookmarkTreeNode[];
};

type WriteManagedBrowserTreeOptions = {
  allowRollback?: boolean;
};

function extractManagedRoots(tree: BrowserBookmarkTreeNode[]): BrowserBookmarkTreeNode[] {
  const rootNode = tree.find((node) => node.id === '0');
  const browserTreeRoots = rootNode?.children ?? tree;

  return browserTreeRoots.flatMap((node) => {
    if (node.parentId === '0' && Array.isArray(node.children)) {
      return node.children;
    }

    return [node];
  });
}

function resolveManagedContainerId(tree: BrowserBookmarkTreeNode[]): string | null {
  const rootNode = tree.find((node) => node.id === '0');
  const structuralRoots = rootNode?.children ?? tree.filter((node) => node.parentId === '0');

  return structuralRoots[0]?.id ?? null;
}

function buildCreateInput(
  node: BrowserBookmarkTreeNode,
  parentId: string,
): ChromeBookmarkCreateInput {
  if (Array.isArray(node.children)) {
    return {
      parentId,
      title: node.title,
    };
  }

  return {
    parentId,
    title: node.title,
    url: node.url,
  };
}

function buildUpdateInput(
  node: BrowserBookmarkTreeNode,
): ChromeBookmarkChangeInput {
  if (Array.isArray(node.children)) {
    return {
      title: node.title,
    };
  }

  return {
    title: node.title,
    url: node.url,
  };
}

async function createSubtree(
  node: BrowserBookmarkTreeNode,
  parentId: string,
  bookmarksApi: ChromeBookmarksApi,
): Promise<void> {
  const created = await bookmarksApi.create(buildCreateInput(node, parentId));

  if (!Array.isArray(node.children) || node.children.length === 0) {
    return;
  }

  if (!created.id) {
    throw new Error('Browser bookmark create did not return a bookmark id.');
  }

  for (const child of node.children) {
    await createSubtree(child, created.id, bookmarksApi);
  }
}

async function removeNode(
  node: BrowserBookmarkTreeNode,
  bookmarksApi: ChromeBookmarksApi,
): Promise<void> {
  if (Array.isArray(node.children)) {
    if (!bookmarksApi.removeTree) {
      throw new Error('Browser bookmark folder removal is unavailable.');
    }

    await bookmarksApi.removeTree(node.id);
    return;
  }

  if (bookmarksApi.remove) {
    await bookmarksApi.remove(node.id);
  }
}

async function syncNode(
  currentNode: BrowserBookmarkTreeNode | undefined,
  desiredNode: BrowserBookmarkTreeNode,
  parentId: string,
  bookmarksApi: ChromeBookmarksApi,
): Promise<void> {
  if (!currentNode) {
    await createSubtree(desiredNode, parentId, bookmarksApi);
    return;
  }

  const currentIsFolder = Array.isArray(currentNode.children);
  const desiredIsFolder = Array.isArray(desiredNode.children);

  if (currentIsFolder !== desiredIsFolder) {
    await removeNode(currentNode, bookmarksApi);
    await createSubtree(desiredNode, parentId, bookmarksApi);
    return;
  }

  await bookmarksApi.update(currentNode.id, buildUpdateInput(desiredNode));

  if (!desiredIsFolder) {
    return;
  }

  const currentChildren = currentNode.children ?? [];
  const desiredChildren = desiredNode.children ?? [];
  const nextParentId = currentNode.id;
  const maxLength = Math.max(currentChildren.length, desiredChildren.length);

  for (let index = 0; index < maxLength; index += 1) {
    const nextDesiredChild = desiredChildren[index];
    const nextCurrentChild = currentChildren[index];

    if (nextDesiredChild && nextCurrentChild) {
      await syncNode(nextCurrentChild, nextDesiredChild, nextParentId, bookmarksApi);
      continue;
    }

    if (nextDesiredChild) {
      await createSubtree(nextDesiredChild, nextParentId, bookmarksApi);
      continue;
    }

    if (nextCurrentChild) {
      await removeNode(nextCurrentChild, bookmarksApi);
    }
  }
}

async function applyManagedBrowserTree(
  desiredTree: BrowserBookmarkTreeNode[],
  currentTree: BrowserBookmarkTreeNode[],
  bookmarksApi: ChromeBookmarksApi,
): Promise<void> {
  const currentManagedRoots = extractManagedRoots(currentTree);
  const desiredManagedRoots = extractManagedRoots(desiredTree);
  const managedContainerId = resolveManagedContainerId(currentTree);

  if (!managedContainerId) {
    throw new Error('Managed browser bookmark container is unavailable.');
  }

  const maxLength = Math.max(currentManagedRoots.length, desiredManagedRoots.length);
  for (let index = 0; index < maxLength; index += 1) {
    const nextDesiredRoot = desiredManagedRoots[index];
    const nextCurrentRoot = currentManagedRoots[index];

    if (nextDesiredRoot && nextCurrentRoot) {
      await syncNode(nextCurrentRoot, nextDesiredRoot, managedContainerId, bookmarksApi);
      continue;
    }

    if (nextDesiredRoot) {
      await createSubtree(nextDesiredRoot, managedContainerId, bookmarksApi);
      continue;
    }

    if (nextCurrentRoot) {
      await removeNode(nextCurrentRoot, bookmarksApi);
    }
  }
}

export async function writeManagedBrowserTree(
  input: WriteManagedBrowserTreeInput,
  bookmarksApi?: ChromeBookmarksApi,
  options: WriteManagedBrowserTreeOptions = {},
): Promise<WriteManagedBrowserTreeResult> {
  const runtimeBookmarksApi =
    bookmarksApi ?? (globalThis as typeof globalThis & { chrome?: ChromeRuntime }).chrome?.bookmarks;
  const allowRollback = options.allowRollback ?? true;

  if (!runtimeBookmarksApi?.getTree || !runtimeBookmarksApi.create || !runtimeBookmarksApi.update) {
    return {
      kind: 'unavailable',
    };
  }

  const currentTreeResult: ReadBrowserBookmarkTreeResult =
    input.currentTree !== undefined
      ? {
          kind: 'loaded',
          tree: input.currentTree,
        }
      : await readBrowserBookmarkTree(runtimeBookmarksApi);

  if (currentTreeResult.kind === 'unavailable') {
    return {
      kind: 'unavailable',
    };
  }

  if (currentTreeResult.kind === 'error') {
    return {
      kind: 'error',
      error: currentTreeResult.error,
    };
  }

  try {
    await applyManagedBrowserTree(input.desiredTree, currentTreeResult.tree, runtimeBookmarksApi);

    return {
      kind: 'written',
    };
  } catch (error) {
    const writeError =
      error instanceof Error ? error.message : 'Failed to write managed browser bookmarks.';

    if (!allowRollback) {
      return {
        kind: 'error',
        error: writeError,
      };
    }

    const rollbackCurrentTreeResult = await readBrowserBookmarkTree(runtimeBookmarksApi);
    if (rollbackCurrentTreeResult.kind !== 'loaded') {
      return {
        kind: 'rollback-failed',
        error: writeError,
        rollbackError:
          rollbackCurrentTreeResult.kind === 'error'
            ? rollbackCurrentTreeResult.error
            : 'Browser bookmark API is unavailable during rollback.',
      };
    }

    const rollbackResult = await writeManagedBrowserTree(
      {
        desiredTree: currentTreeResult.tree,
        currentTree: rollbackCurrentTreeResult.tree,
      },
      runtimeBookmarksApi,
      {
        allowRollback: false,
      },
    );

    if (rollbackResult.kind === 'written') {
      return {
        kind: 'rolled-back-after-error',
        error: writeError,
      };
    }

    const rollbackError =
      rollbackResult.kind === 'error' ||
      rollbackResult.kind === 'rolled-back-after-error' ||
      rollbackResult.kind === 'rollback-failed'
        ? rollbackResult.error
        : rollbackResult.kind === 'unavailable'
          ? 'Browser bookmark API is unavailable during rollback.'
          : 'Rollback failed.';

    return {
      kind: 'rollback-failed',
      error: writeError,
      rollbackError,
    };
  }
}
