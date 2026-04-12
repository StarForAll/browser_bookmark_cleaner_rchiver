import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { BrowserBookmarkTreeNode } from '@/adapters/browser-bookmarks/contracts';
import {
  LOCAL_PERSISTENCE_KEYS,
  LOCAL_PERSISTENCE_SCHEMA_VERSION,
} from '@/adapters/local-persistence/contracts';
import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { App } from './App';

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

function createBrowserBookmarkTree(): BrowserBookmarkTreeNode[] {
  return [
    {
      id: '0',
      parentId: null,
      title: '',
      children: [
        {
          id: '1',
          parentId: '0',
          title: 'Bookmarks bar',
          children: [
            {
              id: '11',
              parentId: '1',
              title: 'Docs Hub',
              url: 'https://docs.example.com',
            },
          ],
        },
      ],
    },
  ];
}

function createDraftBackupArtifact() {
  return {
    artifactId: 'draft-backup-1',
    artifactType: 'draft-restore-backup',
    schemaVersion: LOCAL_PERSISTENCE_SCHEMA_VERSION,
    createdAt: '2026-04-11T20:00:00.000Z',
    payloadFormat: 'draft-graph-snapshot',
    storageKey: LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup,
    sizeBytes: 2048,
    sourceObjectType: 'browser',
    targetObjectType: 'draft',
    triggerAction: 'overwrite-draft-from-browser',
    sourceOrigin: 'browser-current-tree',
    sourceVersionId: null,
    sourceVersionLabel: null,
    payload: createDraftSnapshot(),
  };
}

function createBrowserBackupArtifact() {
  return {
    artifactId: 'browser-backup-1',
    artifactType: 'browser-restore-backup',
    schemaVersion: LOCAL_PERSISTENCE_SCHEMA_VERSION,
    createdAt: '2026-04-11T20:00:00.000Z',
    payloadFormat: 'browser-bookmark-tree',
    storageKey: LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup,
    sizeBytes: 2048,
    sourceObjectType: 'draft',
    targetObjectType: 'browser',
    triggerAction: 'sync-draft-to-browser',
    sourceOrigin: 'draft-sync',
    sourceVersionId: null,
    sourceVersionLabel: null,
    payload: createBrowserBookmarkTree(),
  };
}

function createChangedBrowserBackupArtifact() {
  return {
    ...createBrowserBackupArtifact(),
    payload: [
      {
        id: '0',
        parentId: null,
        title: '',
        children: [
          {
            id: '1',
            parentId: '0',
            title: 'Bookmarks bar',
            children: [
              {
                id: '11',
                parentId: '1',
                title: 'Recovered Docs',
                url: 'https://recovered.example.com',
              },
              {
                id: '12',
                parentId: '1',
                title: 'Recovered Extra',
                url: 'https://extra.example.com',
              },
            ],
          },
        ],
      },
    ] satisfies BrowserBookmarkTreeNode[],
  };
}

function createDeferred<T>() {
  let resolve: ((value: T) => void) | null = null;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return {
    promise,
    resolve(value: T) {
      resolve?.(value);
    },
  };
}

function installChromeRuntime(input: {
  storageState?: Record<string, unknown>;
  bookmarksApiOverrides?: Partial<{
    getTree: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    removeTree: ReturnType<typeof vi.fn>;
  }>;
} = {}) {
  const storageState = { ...(input.storageState ?? {}) };
  const get = vi.fn(async (keys: string[]) =>
    Object.fromEntries(keys.map((key) => [key, storageState[key]])),
  );
  const set = vi.fn(async (items: Record<string, unknown>) => {
    Object.assign(storageState, items);
  });
  const bookmarksApi = {
    getTree: input.bookmarksApiOverrides?.getTree ?? vi.fn(async () => createBrowserBookmarkTree()),
    create: input.bookmarksApiOverrides?.create ?? vi.fn(async () => ({ id: 'created-bookmark' })),
    update: input.bookmarksApiOverrides?.update ?? vi.fn(async () => ({ id: 'updated-bookmark' })),
    removeTree: input.bookmarksApiOverrides?.removeTree ?? vi.fn(async () => undefined),
  };

  (globalThis as typeof globalThis & { chrome?: unknown }).chrome = {
    storage: {
      local: {
        get,
        set,
      },
    },
    bookmarks: bookmarksApi,
  };

  return {
    storageState,
    get,
    set,
    bookmarksApi,
  };
}

async function renderAppWithEditableDraft() {
  render(
    <App
      bootstrapWorkspace={async () => ({
        policy: {
          action: 'restore-local-draft',
          reason: 'persisted-draft-session-exists',
        },
        draftSnapshot: createDraftSnapshot(),
        statusKey: 'restored-local-draft',
        occurredAt: '2026-04-11T20:00:00.000Z',
      })}
      enableStartupBootstrap
    />,
  );

  await waitFor(() => {
    expect(screen.getByRole('button', { name: '书签节点：Docs Hub' })).toBeInTheDocument();
  });
}

function findStorageCallOrder(
  setMock: ReturnType<typeof vi.fn>,
  storageKey: string,
): number | null {
  const targetCall = setMock.mock.calls.find(([items]) =>
    typeof items === 'object' &&
    items !== null &&
    Object.prototype.hasOwnProperty.call(items, storageKey),
  );

  if (!targetCall) {
    return null;
  }

  return setMock.mock.invocationCallOrder[setMock.mock.calls.indexOf(targetCall)] ?? null;
}

function firstBrowserMutationCallOrder(bookmarksApi: {
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  removeTree: ReturnType<typeof vi.fn>;
}): number | null {
  const candidates = [
    bookmarksApi.create.mock.invocationCallOrder[0],
    bookmarksApi.update.mock.invocationCallOrder[0],
    bookmarksApi.removeTree.mock.invocationCallOrder[0],
  ].filter((value): value is number => typeof value === 'number');

  return candidates.length > 0 ? Math.min(...candidates) : null;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T09B local backup and undo-overwrite gate', () => {
  test('writes the draft backup slot before browser-to-draft overwrite reads browser bookmarks after confirmation', async () => {
    const runtime = installChromeRuntime();

    await renderAppWithEditableDraft();

    fireEvent.click(screen.getByRole('button', { name: '从浏览器覆盖当前草稿' }));
    fireEvent.click(await screen.findByRole('button', { name: '确认继续' }));

    await waitFor(() => {
      expect(runtime.set).toHaveBeenCalledWith(
        expect.objectContaining({
          [LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup]: expect.anything(),
        }),
      );
    });

    expect(runtime.bookmarksApi.getTree).toHaveBeenCalledTimes(1);

    const backupWriteCallOrder = findStorageCallOrder(
      runtime.set,
      LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup,
    );

    expect(backupWriteCallOrder).not.toBeNull();
    expect(backupWriteCallOrder as number).toBeLessThan(
      runtime.bookmarksApi.getTree.mock.invocationCallOrder[0],
    );
  });

  test('writes the browser backup slot before draft-to-browser sync mutates browser bookmarks after confirmation', async () => {
    const runtime = installChromeRuntime();

    await renderAppWithEditableDraft();

    fireEvent.click(screen.getByRole('button', { name: '同步当前草稿到浏览器书签' }));
    fireEvent.click(await screen.findByRole('button', { name: '确认同步' }));

    await waitFor(() => {
      expect(runtime.set).toHaveBeenCalledWith(
        expect.objectContaining({
          [LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup]: expect.anything(),
        }),
      );
    });

    const mutationCallOrder = firstBrowserMutationCallOrder(runtime.bookmarksApi);

    expect(mutationCallOrder).not.toBeNull();

    const backupWriteCallOrder = findStorageCallOrder(
      runtime.set,
      LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup,
    );

    expect(backupWriteCallOrder).not.toBeNull();
    expect(backupWriteCallOrder as number).toBeLessThan(mutationCallOrder as number);
  });

  test('locks other external actions while an overwrite chain is still running and releases them after completion', async () => {
    const browserRead = createDeferred<BrowserBookmarkTreeNode[]>();
    const runtime = installChromeRuntime({
      bookmarksApiOverrides: {
        getTree: vi.fn(async () => browserRead.promise),
      },
    });

    await renderAppWithEditableDraft();

    fireEvent.click(screen.getByRole('button', { name: '从浏览器覆盖当前草稿' }));
    fireEvent.click(await screen.findByRole('button', { name: '确认继续' }));

    await waitFor(() => {
      expect(runtime.bookmarksApi.getTree).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '从浏览器覆盖当前草稿' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '同步当前草稿到浏览器书签' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '撤销覆盖操作' })).toBeDisabled();
    });

    expect(screen.getByRole('button', { name: '同步当前草稿到浏览器书签' })).toHaveAttribute(
      'title',
      '当前有覆盖、同步、上传或恢复操作正在执行，请等待完成后再继续。',
    );

    browserRead.resolve(createBrowserBookmarkTree());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '从浏览器覆盖当前草稿' })).toBeEnabled();
      expect(screen.getByRole('button', { name: '同步当前草稿到浏览器书签' })).toBeEnabled();
      expect(screen.getByRole('button', { name: '撤销覆盖操作' })).toBeEnabled();
    });
  });

  test('enables the undo-overwrite entry and opens a chooser when valid local backup slots exist', async () => {
    installChromeRuntime({
      storageState: {
        [LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup]: createDraftBackupArtifact(),
        [LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup]: createBrowserBackupArtifact(),
      },
    });

    await renderAppWithEditableDraft();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '撤销覆盖操作' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: '撤销覆盖操作' }));

    const chooser = await screen.findByRole('dialog');
    expect(within(chooser).getByRole('button', { name: '撤销对浏览器书签的覆盖' })).toBeInTheDocument();
    expect(within(chooser).getByRole('button', { name: '撤销对当前草稿的覆盖' })).toBeInTheDocument();
    expect(within(chooser).getByRole('button', { name: '继续' })).toBeDisabled();
  });

  test('keeps the missing browser target disabled and exposes the object-specific reason only on hover when only a draft backup exists', async () => {
    installChromeRuntime({
      storageState: {
        [LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup]: createDraftBackupArtifact(),
      },
    });

    await renderAppWithEditableDraft();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '撤销覆盖操作' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: '撤销覆盖操作' }));

    const chooser = await screen.findByRole('dialog');
    const browserTargetButton = within(chooser).getByRole('button', { name: '撤销对浏览器书签的覆盖' });
    const draftTargetButton = within(chooser).getByRole('button', { name: '撤销对当前草稿的覆盖' });

    expect(browserTargetButton).toBeDisabled();
    expect(browserTargetButton).toHaveAttribute(
      'title',
      '当前没有对浏览器书签进行覆盖操作，不能撤销对浏览器书签的覆盖',
    );
    expect(within(chooser).queryByText('当前没有对浏览器书签进行覆盖操作，不能撤销对浏览器书签的覆盖')).toBeNull();
    expect(draftTargetButton).toBeEnabled();
  });

  test('shows an explicit selection effect when both recovery targets are available before continuing', async () => {
    installChromeRuntime({
      storageState: {
        [LOCAL_PERSISTENCE_KEYS.assets.latestDraftBackup]: createDraftBackupArtifact(),
        [LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup]: createBrowserBackupArtifact(),
      },
    });

    await renderAppWithEditableDraft();

    fireEvent.click(await screen.findByRole('button', { name: '撤销覆盖操作' }));

    const chooser = await screen.findByRole('dialog');
    const continueButton = within(chooser).getByRole('button', { name: '继续' });
    const browserTargetButton = within(chooser).getByRole('button', { name: '撤销对浏览器书签的覆盖' });
    const draftTargetButton = within(chooser).getByRole('button', { name: '撤销对当前草稿的覆盖' });

    expect(continueButton).toBeDisabled();
    expect(browserTargetButton).toHaveAttribute('aria-pressed', 'false');
    expect(draftTargetButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(draftTargetButton);

    expect(continueButton).toBeEnabled();
    expect(draftTargetButton).toHaveAttribute('aria-pressed', 'true');
    expect(browserTargetButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('uses a dedicated browser recovery confirmation with explicit Ctrl+Z warning instead of the shared overwrite dialog', async () => {
    installChromeRuntime({
      storageState: {
        [LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup]: createBrowserBackupArtifact(),
      },
    });

    await renderAppWithEditableDraft();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '撤销覆盖操作' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: '撤销覆盖操作' }));

    const chooser = await screen.findByRole('dialog');
    fireEvent.click(within(chooser).getByRole('button', { name: '撤销对浏览器书签的覆盖' }));
    fireEvent.click(within(chooser).getByRole('button', { name: /继续/ }));

    const confirmation = await screen.findByRole('dialog');
    expect(confirmation.textContent ?? '').toMatch(/当前浏览器书签.*本地浏览器备份/);
    expect(confirmation.textContent ?? '').toMatch(/Ctrl\+Z.*不会.*撤销.*浏览器/);
    expect(confirmation.textContent ?? '').not.toMatch(/确认同步当前草稿到浏览器书签/);
  });

  test('records the rollback status when browser recovery fails after partial writes but auto-rollback succeeds', async () => {
    const browserTreeState = createBrowserBookmarkTree();
    const originalSnapshot = JSON.parse(JSON.stringify(browserTreeState)) as BrowserBookmarkTreeNode[];
    let createAttempts = 0;

    installChromeRuntime({
      storageState: {
        [LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup]: createChangedBrowserBackupArtifact(),
      },
      bookmarksApiOverrides: {
        getTree: vi.fn(async () => JSON.parse(JSON.stringify(browserTreeState))),
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
      },
    });

    await renderAppWithEditableDraft();

    fireEvent.click(await screen.findByRole('button', { name: '撤销覆盖操作' }));
    const chooser = await screen.findByRole('dialog');
    fireEvent.click(within(chooser).getByRole('button', { name: '撤销对浏览器书签的覆盖' }));
    fireEvent.click(within(chooser).getByRole('button', { name: '继续' }));

    const confirmation = await screen.findByRole('dialog');
    fireEvent.click(within(confirmation).getByRole('button', { name: '确认恢复' }));

    await waitFor(() => {
      expect(
        screen.getByText('撤销对浏览器书签的覆盖失败，但已自动回退浏览器书签到恢复前状态', {
          selector: '.status-history-list li dd',
        }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/浏览器恢复过程中发生错误，但已自动回退到恢复前状态/, {
        selector: '.status-history-list li p',
      }),
    ).toBeInTheDocument();
    expect(browserTreeState).toEqual(originalSnapshot);
  });
});
