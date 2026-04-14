import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import type { BrowserBookmarkTreeNode } from '@/adapters/browser-bookmarks/contracts';
import { LOCAL_PERSISTENCE_KEYS } from '@/adapters/local-persistence/contracts';
import { createDraftGraphFixture } from '../../test/fixtures/draftGraph';
import { App } from './App';

type ChromeStorageArea = {
  get: (keys: string[]) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
};

type ChromeBookmarksApi = {
  create: ReturnType<typeof vi.fn>;
  getTree: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  removeTree: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

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

function createBrowserTreeFixture(): BrowserBookmarkTreeNode[] {
  return [
    {
      children: [
        {
          children: [
            {
              id: 'bookmark-docs',
              parentId: 'bookmarks-bar',
              title: 'Docs Hub',
              url: 'https://docs.example.com',
            },
          ],
          id: 'bookmarks-bar',
          parentId: '0',
          title: 'Bookmarks Bar',
        },
      ],
      id: '0',
      parentId: null,
      title: '',
    },
  ];
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function installChromeRuntime(input: {
  bookmarksTree?: BrowserBookmarkTreeNode[];
  initialPermissionGranted?: boolean;
  storageState?: Record<string, unknown>;
} = {}) {
  const storageState = {
    ...(input.storageState ?? {}),
  };
  let permissionGranted = input.initialPermissionGranted ?? true;

  const storage: ChromeStorageArea = {
    get: vi.fn(async (keys: string[]) => {
      return Object.fromEntries(keys.map((key) => [key, storageState[key]]));
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(storageState, items);
    }),
  };

  const bookmarksApi: ChromeBookmarksApi | undefined = input.bookmarksTree
    ? {
        create: vi.fn(async () => ({ id: 'created-node' })),
        getTree: vi.fn(async () => cloneValue(input.bookmarksTree)),
        remove: vi.fn(async () => undefined),
        removeTree: vi.fn(async () => undefined),
        update: vi.fn(async () => undefined),
      }
    : undefined;

  (globalThis as typeof globalThis & {
    chrome?: {
      bookmarks?: ChromeBookmarksApi;
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
      contains: vi.fn(async () => permissionGranted),
      request: vi.fn(async () => permissionGranted),
    },
    storage: {
      local: storage,
    },
  };

  return {
    bookmarksApi,
    setPermissionGranted(nextValue: boolean) {
      permissionGranted = nextValue;
    },
    storage,
    storageState,
  };
}

function installSuccessfulWebdavFetch() {
  const documents = new Map<string, string>();
  const collections = new Set<string>(['/collection/']);

  function normalizeCollectionPath(pathname: string): string {
    return pathname.endsWith('/') ? pathname : `${pathname}/`;
  }

  function hasParentCollection(pathname: string): boolean {
    const normalized = normalizeCollectionPath(pathname);
    const segments = normalized.split('/').filter((segment) => segment.length > 0);
    if (segments.length <= 1) {
      return collections.has('/collection/');
    }

    const parentPath = `/${segments.slice(0, -1).join('/')}/`;
    return collections.has(parentPath);
  }

  function hasOwningCollection(pathname: string): boolean {
    const normalized = pathname.endsWith('/')
      ? normalizeCollectionPath(pathname)
      : normalizeCollectionPath(pathname.slice(0, pathname.lastIndexOf('/') + 1));
    return collections.has(normalized);
  }

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const pathname = new URL(requestUrl).pathname;
    const method = (init?.method ?? 'GET').toUpperCase();

    if (method === 'PROPFIND') {
      return collections.has(normalizeCollectionPath(pathname))
        ? new Response('', { status: 207 })
        : new Response('', { status: 404 });
    }

    if (method === 'GET') {
      if (!hasOwningCollection(pathname)) {
        return new Response('', { status: 409 });
      }

      const existing = documents.get(pathname);
      if (existing === undefined) {
        return new Response('', { status: 404 });
      }

      return new Response(existing, {
        headers: {
          'content-type': 'application/json',
        },
        status: 200,
      });
    }

    if (method === 'MKCOL') {
      if (pathname !== '/collection/' && pathname.endsWith('/')) {
        return new Response('', { status: 400 });
      }

      if (!hasParentCollection(pathname)) {
        return new Response('', { status: 409 });
      }

      collections.add(normalizeCollectionPath(pathname));
      return new Response('', { status: 201 });
    }

    if (method === 'PUT') {
      if (!hasOwningCollection(pathname)) {
        return new Response('', { status: 409 });
      }

      if (pathname.includes(':')) {
        return new Response('', { status: 400 });
      }

      documents.set(pathname, String(init?.body ?? ''));
      return new Response('', { status: 201 });
    }

    if (method === 'DELETE') {
      if (!hasOwningCollection(pathname)) {
        return new Response('', { status: 409 });
      }

      documents.delete(pathname);
      return new Response('', { status: 204 });
    }

    if (method === 'OPTIONS') {
      return new Response('', { status: 200 });
    }

    return new Response('', { status: 200 });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function readTopStatusAction(): string {
  return document.querySelector('.status-history-list li strong')?.textContent ?? '';
}

function readTopStatusResult(): string {
  const resultItems = document.querySelectorAll('.status-history-list li dd');
  return resultItems[1]?.textContent ?? '';
}

beforeEach(() => {
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T11 WebDAV upload flow', () => {
  test('records a completed draft-upload status entry when the ready draft is uploaded to WebDAV', async () => {
    installChromeRuntime({
      storageState: createReadyWebdavStorageState(),
    });
    const fetchMock = installSuccessfulWebdavFetch();

    render(
      <App
        bootstrapWorkspace={async () => ({
          draftSnapshot: createDraftGraphFixture(),
          occurredAt: '2026-04-12T12:10:00.000Z',
          policy: {
            action: 'restore-local-draft',
            reason: 'persisted-draft-session-exists',
          },
          statusKey: 'restored-local-draft',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '上传当前草稿到 WebDAV' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: '上传当前草稿到 WebDAV' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(readTopStatusAction()).toBe('上传当前草稿到 WebDAV');
      expect(readTopStatusResult()).toBe('当前草稿已上传到 WebDAV');
    });
  });

  test('records a completed browser-upload status entry without requiring an editable draft', async () => {
    const runtime = installChromeRuntime({
      bookmarksTree: createBrowserTreeFixture(),
      storageState: createReadyWebdavStorageState(),
    });
    installSuccessfulWebdavFetch();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '上传当前浏览器书签到 WebDAV' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: '上传当前浏览器书签到 WebDAV' }));

    await waitFor(() => {
      expect(runtime.bookmarksApi?.getTree).toHaveBeenCalled();
      expect(readTopStatusAction()).toBe('上传当前浏览器书签到 WebDAV');
      expect(readTopStatusResult()).toBe('当前浏览器书签已上传到 WebDAV');
    });
  });

  test('rechecks runtime permission before uploading and blocks the request when host access was revoked without a focus refresh', async () => {
    const runtime = installChromeRuntime({
      initialPermissionGranted: true,
      storageState: createReadyWebdavStorageState(),
    });
    const fetchMock = installSuccessfulWebdavFetch();

    render(
      <App
        bootstrapWorkspace={async () => ({
          draftSnapshot: createDraftGraphFixture(),
          occurredAt: '2026-04-12T12:20:00.000Z',
          policy: {
            action: 'restore-local-draft',
            reason: 'persisted-draft-session-exists',
          },
          statusKey: 'restored-local-draft',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '上传当前草稿到 WebDAV' })).toBeEnabled();
    });

    runtime.setPermissionGranted(false);
    fireEvent.click(screen.getByRole('button', { name: '上传当前草稿到 WebDAV' }));

    await waitFor(() => {
      expect(readTopStatusAction()).toBe('上传当前草稿到 WebDAV');
      expect(readTopStatusResult()).toBe('请先完成 WebDAV 设置与可用性检测。');
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
