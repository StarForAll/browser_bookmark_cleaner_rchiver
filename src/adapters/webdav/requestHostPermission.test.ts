import { describe, expect, test, vi } from 'vitest';
import {
  ensureWebdavHostPermission,
  inspectWebdavHostPermission,
} from './requestHostPermission';

describe('T10 WebDAV host permission adapter', () => {
  test('inspects the current host permission without requesting again', async () => {
    const contains = vi.fn(async () => false);
    const request = vi.fn(async () => true);

    const result = await inspectWebdavHostPermission(
      'https://dav.example.com/collection/',
      { contains, request },
    );

    expect(result).toEqual({
      kind: 'denied',
      origin: 'https://dav.example.com/',
    });
    expect(request).not.toHaveBeenCalled();
  });

  test('short-circuits when the origin is already granted', async () => {
    const contains = vi.fn(async () => true);
    const request = vi.fn(async () => true);

    const result = await ensureWebdavHostPermission(
      'https://dav.example.com/collection/',
      { contains, request },
    );

    expect(result).toEqual({
      kind: 'granted',
      origin: 'https://dav.example.com/',
    });
    expect(request).not.toHaveBeenCalled();
  });

  test('requests the host permission when the origin is not granted yet', async () => {
    const result = await ensureWebdavHostPermission(
      'https://dav.example.com/collection/',
      {
        contains: vi.fn(async () => false),
        request: vi.fn(async () => false),
      },
    );

    expect(result).toEqual({
      kind: 'denied',
      origin: 'https://dav.example.com/',
    });
  });

  test('rejects invalid endpoint URLs before touching the permissions API', async () => {
    const contains = vi.fn(async () => false);
    const request = vi.fn(async () => false);

    const result = await ensureWebdavHostPermission(
      'ftp://dav.example.com/collection/',
      { contains, request },
    );

    expect(result).toEqual({
      kind: 'invalid-origin',
      error: 'WebDAV URL 无效，无法申请 host 权限。',
    });
    expect(contains).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  test('returns unavailable when the Chrome permissions API is missing', async () => {
    const result = await ensureWebdavHostPermission('https://dav.example.com/collection/');

    expect(result).toEqual({
      kind: 'unavailable',
    });
  });
});
