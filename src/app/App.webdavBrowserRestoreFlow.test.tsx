import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { BrowserBookmarkTreeNode } from '@/adapters/browser-bookmarks/contracts';
import { LOCAL_PERSISTENCE_KEYS } from '@/adapters/local-persistence/contracts';
import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { formatStatusTimestamp } from '@/shared/copy/appShell';
import { App } from './App';

type ChromeStorageArea = {
  get: (keys: string[]) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
};

type StoredVersionDescriptor = {
  artifactType: 'bookmark-snapshot';
  createdAt: string;
  snapshotLabel: string | null;
  source: 'browser';
  versionId: string;
};

function createCurrentDraftSnapshot(): DraftGraphSnapshot {
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

function createCurrentBrowserTree(): BrowserBookmarkTreeNode[] {
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
              id: '11',
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

function createRestoredBrowserTree(): BrowserBookmarkTreeNode[] {
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
              id: '11',
              parentId: '1',
              title: 'Recovered Docs',
              url: 'https://recovered.example.com',
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

function createReadyWebdavStorageState(): Record<string, unknown> {
  return {
    [LOCAL_PERSISTENCE_KEYS.sensitive.webdavPermissionState]: {
      granted: true,
      origin: 'https://dav.example.com/',
    },
    [LOCAL_PERSISTENCE_KEYS.sensitive.webdavProfile]: {
      endpointUrl: 'https://dav.example.com/collection/',
      username: 'alice',
      password: 'secret-pass',
      lastTestedAt: '2026-04-12T11:00:00.000Z',
      lastTestStatus: 'success',
    },
  };
}

function createBrowserVersionDescriptor(): StoredVersionDescriptor {
  return {
    artifactType: 'bookmark-snapshot',
    createdAt: '2026-04-12T12:00:00.000Z',
    snapshotLabel: '午间书签备份',
    source: 'browser',
    versionId: '2026-04-12T12-00-00.000Z',
  };
}

function createOlderBrowserVersionDescriptor(): StoredVersionDescriptor {
  return {
    artifactType: 'bookmark-snapshot',
    createdAt: '2026-04-11T09:30:00.000Z',
    snapshotLabel: '昨日书签备份',
    source: 'browser',
    versionId: '2026-04-11T09-30-00.000Z',
  };
}

function createVersionIndex(versions: StoredVersionDescriptor[]) {
  return {
    schemaVersion: 'webdav-index/v1',
    versions,
  };
}

function createBrowserEnvelope(
  version: StoredVersionDescriptor,
  payload: BrowserBookmarkTreeNode[],
) {
  return {
    schemaVersion: 'webdav-snapshot/v1',
    artifactType: 'bookmark-snapshot' as const,
    createdAt: version.createdAt,
    versionId: version.versionId,
    source: 'browser' as const,
    originAction: 'upload-browser-to-webdav' as const,
    snapshotLabel: version.snapshotLabel,
    payloadFormat: 'browser-bookmark-tree' as const,
    payload,
  };
}

function installChromeRuntime(input: {
  storageState?: Record<string, unknown>;
} = {}) {
  const storageState = {
    ...(input.storageState ?? {}),
  };

  const storage: ChromeStorageArea = {
    get: vi.fn(async (keys: string[]) => {
      return Object.fromEntries(keys.map((key) => [key, storageState[key]]));
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(storageState, items);
    }),
  };

  const currentBrowserTree = createCurrentBrowserTree();
  const bookmarksApi = {
    getTree: vi.fn(async () => cloneTree(currentBrowserTree)),
    create: vi.fn(async () => ({ id: 'created-bookmark' })),
    update: vi.fn(async (id: string) => ({ id })),
    remove: vi.fn(async () => undefined),
    removeTree: vi.fn(async () => undefined),
  };

  (globalThis as typeof globalThis & {
    chrome?: {
      bookmarks: typeof bookmarksApi;
      permissions: {
        contains: (permissions: { origins?: string[]; permissions?: string[] }) => Promise<boolean>;
        request: (permissions: { origins?: string[]; permissions?: string[] }) => Promise<boolean>;
      };
      storage: {
        local: ChromeStorageArea;
      };
    };
  }).chrome = {
    bookmarks: bookmarksApi,
    permissions: {
      contains: vi.fn(async () => true),
      request: vi.fn(async () => true),
    },
    storage: {
      local: storage,
    },
  };

  return {
    bookmarksApi,
    storage,
    storageState,
  };
}

function installWebdavBrowserRestoreFetch(input: {
  index: unknown;
  versionDocument: unknown;
}) {
  const version = createBrowserVersionDescriptor();
  const fetchMock = vi.fn(async (resource: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl =
      typeof resource === 'string'
        ? resource
        : resource instanceof URL
          ? resource.toString()
          : resource.url;
    const pathname = new URL(requestUrl).pathname;
    const method = (init?.method ?? 'GET').toUpperCase();

    if (method === 'GET') {
      if (pathname === '/collection/bookmark-extension-data/bookmarks/index.json') {
        return new Response(JSON.stringify(input.index), {
          headers: {
            'content-type': 'application/json',
          },
          status: 200,
        });
      }

      if (pathname === `/collection/bookmark-extension-data/bookmarks/versions/${version.versionId}.json`) {
        return new Response(JSON.stringify(input.versionDocument), {
          headers: {
            'content-type': 'application/json',
          },
          status: 200,
        });
      }

      return new Response('', { status: 404 });
    }

    if (method === 'PROPFIND' || method === 'OPTIONS') {
      return new Response('', { status: 200 });
    }

    return new Response('', { status: 405 });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function renderAppWithEditableDraft() {
  render(
    <App
      bootstrapWorkspace={async () => ({
        policy: {
          action: 'restore-local-draft',
          reason: 'persisted-draft-session-exists',
        },
        draftSnapshot: createCurrentDraftSnapshot(),
        statusKey: 'restored-local-draft',
        occurredAt: '2026-04-12T10:00:00.000Z',
      })}
      enableStartupBootstrap
    />,
  );

  await waitFor(() => {
    expect(screen.getByRole('button', { name: '书签节点：Docs Hub' })).toBeInTheDocument();
  });
}

function findStorageCallOrder(
  setMock: {
    mock: {
      calls: Array<[Record<string, unknown>]>;
      invocationCallOrder: number[];
    };
  },
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

function readTopStatusAction(): string {
  return document.querySelector('.status-history-list li strong')?.textContent ?? '';
}

function readTopStatusResult(): string {
  const resultItems = document.querySelectorAll('.status-history-list li dd');
  return resultItems[1]?.textContent ?? '';
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T12B WebDAV browser restore flow', () => {
  test('loads browser-only remote versions, creates a browser backup before browser mutation, and keeps the current draft unchanged after confirmation', async () => {
    const runtime = installChromeRuntime({
      storageState: createReadyWebdavStorageState(),
    });
    const version = createBrowserVersionDescriptor();
    const olderVersion = createOlderBrowserVersionDescriptor();
    installWebdavBrowserRestoreFetch({
      index: createVersionIndex([olderVersion, version]),
      versionDocument: createBrowserEnvelope(version, createRestoredBrowserTree()),
    });

    await renderAppWithEditableDraft();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '恢复 WebDAV 书签到浏览器书签' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: '恢复 WebDAV 书签到浏览器书签' }));

    const picker = await screen.findByRole('dialog');
    expect(picker.textContent ?? '').toMatch(/浏览器书签/);
    expect(within(picker).getByText('版本1')).toBeInTheDocument();
    expect(within(picker).getByText('版本2')).toBeInTheDocument();
    expect(within(picker).getByText(formatStatusTimestamp(version.createdAt))).toBeInTheDocument();
    expect(within(picker).getByText(formatStatusTimestamp(olderVersion.createdAt))).toBeInTheDocument();

    fireEvent.click(within(picker).getByText('版本1'));
    fireEvent.click(within(picker).getByRole('button', { name: /继续/ }));

    await waitFor(() => {
      expect(screen.getByRole('dialog').textContent ?? '').toMatch(/WebDAV 书签.*浏览器书签/);
    });
    const confirmation = screen.getByRole('dialog');
    expect(confirmation.textContent ?? '').toMatch(/本地备份/);

    fireEvent.click(within(confirmation).getByRole('button', { name: /确认恢复/ }));

    await waitFor(() => {
      expect(runtime.storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          [LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup]: expect.objectContaining({
            sourceOrigin: 'webdav-bookmark-version',
            sourceVersionId: version.versionId,
            sourceVersionLabel: version.snapshotLabel,
          }),
        }),
      );
    });

    const backupWriteCallOrder = findStorageCallOrder(
      runtime.storage.set as unknown as {
        mock: {
          calls: Array<[Record<string, unknown>]>;
          invocationCallOrder: number[];
        };
      },
      LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup,
    );
    const browserMutationCallOrder = firstBrowserMutationCallOrder(runtime.bookmarksApi);

    expect(backupWriteCallOrder).not.toBeNull();
    expect(browserMutationCallOrder).not.toBeNull();
    if (backupWriteCallOrder === null || browserMutationCallOrder === null) {
      throw new Error('Expected backup write and browser mutation call order to be recorded.');
    }
    expect(backupWriteCallOrder).toBeLessThan(browserMutationCallOrder);

    await waitFor(() => {
      expect(readTopStatusAction()).toBe('恢复 WebDAV 书签到浏览器书签');
    });

    expect(readTopStatusResult()).toBe('已将所选 WebDAV 书签版本恢复到浏览器书签');
    expect(screen.getByRole('button', { name: '书签节点：Docs Hub' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '书签节点：Recovered Docs' })).not.toBeInTheDocument();
  });

  test('records a restore failure without mutating browser bookmarks when the selected remote payload is invalid for browser restore', async () => {
    const runtime = installChromeRuntime({
      storageState: createReadyWebdavStorageState(),
    });
    const version = createBrowserVersionDescriptor();
    const olderVersion = createOlderBrowserVersionDescriptor();
    installWebdavBrowserRestoreFetch({
      index: createVersionIndex([olderVersion, version]),
      versionDocument: {
        ...createBrowserEnvelope(version, createRestoredBrowserTree()),
        artifactType: 'draft-snapshot',
        payloadFormat: 'draft-graph-snapshot',
        source: 'draft',
        payload: createCurrentDraftSnapshot(),
      },
    });

    await renderAppWithEditableDraft();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '恢复 WebDAV 书签到浏览器书签' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: '恢复 WebDAV 书签到浏览器书签' }));

    const picker = await screen.findByRole('dialog');
    fireEvent.click(within(picker).getByText('版本1'));
    fireEvent.click(within(picker).getByRole('button', { name: /继续/ }));

    await waitFor(() => {
      expect(screen.getByRole('dialog').textContent ?? '').toMatch(/WebDAV 书签.*浏览器书签/);
    });
    const confirmation = screen.getByRole('dialog');
    fireEvent.click(within(confirmation).getByRole('button', { name: /确认恢复/ }));

    await waitFor(() => {
      expect(runtime.storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          [LOCAL_PERSISTENCE_KEYS.assets.latestBrowserBackup]: expect.objectContaining({
            sourceOrigin: 'webdav-bookmark-version',
            sourceVersionId: version.versionId,
          }),
        }),
      );
    });

    expect(firstBrowserMutationCallOrder(runtime.bookmarksApi)).toBeNull();
    expect(screen.getByRole('button', { name: '书签节点：Docs Hub' })).toBeInTheDocument();
    expect(readTopStatusAction()).toBe('恢复 WebDAV 书签到浏览器书签');
    expect(readTopStatusResult()).toMatch(/失败/);
    expect(document.querySelector('.status-history-list li')?.textContent ?? '').toMatch(
      /bookmark|browser|artifactType|source|payload/i,
    );
  });
});
