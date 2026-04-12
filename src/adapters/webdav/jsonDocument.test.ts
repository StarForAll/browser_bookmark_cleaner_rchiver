import { describe, expect, test, vi } from 'vitest';
import {
  writeWebdavJsonDocument,
} from './jsonDocument';

describe('WebDAV JSON document adapter', () => {
  test('creates missing parent collections before writing the JSON document', async () => {
    const existingCollections = new Set(['/collection/']);
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      const pathname = new URL(input).pathname;
      const method = (init?.method ?? 'GET').toUpperCase();

      if (method === 'PROPFIND') {
        return existingCollections.has(`${pathname}/`) || existingCollections.has(pathname)
          ? new Response('', { status: 207 })
          : new Response('', { status: 404 });
      }

      if (method === 'MKCOL') {
        const normalized = `${pathname}/`;
        existingCollections.add(normalized);
        return new Response('', { status: 201 });
      }

      if (method === 'PUT') {
        const parentPath = `${pathname.slice(0, pathname.lastIndexOf('/') + 1)}`;
        if (!existingCollections.has(parentPath)) {
          return new Response('', { status: 409 });
        }

        return new Response('', { status: 201 });
      }

      return new Response('', { status: 405 });
    });

    const result = await writeWebdavJsonDocument(
      '/bookmark-extension-data/drafts/index.json',
      {
        schemaVersion: 'webdav-index/v1',
        versions: [],
      },
      {
        endpointUrl: 'https://dav.example.com/collection/',
        username: 'alice',
        password: 'secret-pass',
        lastTestedAt: '2026-04-12T11:00:00.000Z',
        lastTestStatus: 'success',
      },
      fetchMock,
    );

    expect(result).toEqual({
      kind: 'saved',
    });
    expect(fetchMock.mock.calls.map(([url, init]) => [new URL(url).pathname, init?.method ?? 'GET'])).toEqual([
      ['/collection/bookmark-extension-data', 'PROPFIND'],
      ['/collection/bookmark-extension-data', 'MKCOL'],
      ['/collection/bookmark-extension-data/drafts', 'PROPFIND'],
      ['/collection/bookmark-extension-data/drafts', 'MKCOL'],
      ['/collection/bookmark-extension-data/drafts/index.json', 'PUT'],
    ]);
  });

  test('tolerates MKCOL HTTP 409 and still writes the JSON document when the collection already exists', async () => {
    const existingCollections = new Set([
      '/collection/bookmark-extension-data/',
    ]);
    let draftProbeCount = 0;
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      const pathname = new URL(input).pathname;
      const method = (init?.method ?? 'GET').toUpperCase();

      if (method === 'PROPFIND') {
        const pathWithTrailingSlash = `${pathname}/`;
        if (pathWithTrailingSlash === '/collection/bookmark-extension-data/drafts/') {
          draftProbeCount += 1;
          return draftProbeCount >= 2
            ? new Response('', { status: 207 })
            : new Response('', { status: 404 });
        }

        return existingCollections.has(pathWithTrailingSlash)
          ? new Response('', { status: 207 })
          : new Response('', { status: 404 });
      }

      if (method === 'MKCOL') {
        if (pathname === '/collection/bookmark-extension-data/drafts') {
          existingCollections.add('/collection/bookmark-extension-data/drafts/');
        }
        return new Response('', { status: 409 });
      }

      if (method === 'PUT') {
        const parentPath = `${pathname.slice(0, pathname.lastIndexOf('/') + 1)}`;
        if (!existingCollections.has(parentPath)) {
          return new Response('', { status: 409 });
        }

        return new Response('', { status: 201 });
      }

      return new Response('', { status: 405 });
    });

    const result = await writeWebdavJsonDocument(
      '/bookmark-extension-data/drafts/index.json',
      {
        schemaVersion: 'webdav-index/v1',
        versions: [],
      },
      {
        endpointUrl: 'https://dav.example.com/collection/',
        username: 'alice',
        password: 'secret-pass',
        lastTestedAt: '2026-04-12T11:00:00.000Z',
        lastTestStatus: 'success',
      },
      fetchMock,
    );

    expect(result).toEqual({
      kind: 'saved',
    });
    expect(fetchMock.mock.calls.map(([url, init]) => [new URL(url).pathname, init?.method ?? 'GET'])).toEqual([
      ['/collection/bookmark-extension-data', 'PROPFIND'],
      ['/collection/bookmark-extension-data/drafts', 'PROPFIND'],
      ['/collection/bookmark-extension-data/drafts', 'MKCOL'],
      ['/collection/bookmark-extension-data/drafts', 'PROPFIND'],
      ['/collection/bookmark-extension-data/drafts/index.json', 'PUT'],
    ]);
  });

  test('treats an endpoint without trailing slash as a directory base instead of resolving from the server root', async () => {
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      const method = (init?.method ?? 'GET').toUpperCase();

      if (method === 'PROPFIND') {
        return new Response('', { status: 207 });
      }

      if (method === 'PUT') {
        return new Response('', { status: 201 });
      }

      return new Response('', { status: 405 });
    });

    const result = await writeWebdavJsonDocument(
      '/bookmark-extension-data/drafts/index.json',
      {
        schemaVersion: 'webdav-index/v1',
        versions: [],
      },
      {
        endpointUrl: 'https://dav.example.com/collection',
        username: 'alice',
        password: 'secret-pass',
        lastTestedAt: '2026-04-12T11:00:00.000Z',
        lastTestStatus: 'success',
      },
      fetchMock,
    );

    expect(result).toEqual({
      kind: 'saved',
    });
    expect(fetchMock.mock.calls.map(([url, init]) => [new URL(url).pathname, init?.method ?? 'GET'])).toEqual([
      ['/collection/bookmark-extension-data', 'PROPFIND'],
      ['/collection/bookmark-extension-data/drafts', 'PROPFIND'],
      ['/collection/bookmark-extension-data/drafts/index.json', 'PUT'],
    ]);
  });
});
