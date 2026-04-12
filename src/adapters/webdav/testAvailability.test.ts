import { describe, expect, test, vi } from 'vitest';
import { testWebdavAvailability } from './testAvailability';

describe('T10 WebDAV availability adapter', () => {
  test('treats a successful OPTIONS response as availability success', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 200 }));
    const result = await testWebdavAvailability(
      {
        endpointUrl: 'https://dav.example.com/collection/',
        username: 'alice',
        password: 'secret-pass',
        lastTestedAt: null,
        lastTestStatus: 'untested',
      },
      fetchMock,
    );

    expect(result).toEqual({
      kind: 'success',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://dav.example.com/collection/',
      expect.objectContaining({
        method: 'OPTIONS',
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'manual',
      }),
    );
  });

  test('returns a readable error when the transport call fails', async () => {
    const result = await testWebdavAvailability(
      {
        endpointUrl: 'https://dav.example.com/collection/',
        username: 'alice',
        password: 'secret-pass',
        lastTestedAt: null,
        lastTestStatus: 'untested',
      },
      vi.fn(async () => {
        throw new Error('Network unreachable');
      }),
    );

    expect(result).toEqual({
      kind: 'error',
      error: 'Network unreachable',
    });
  });

  test('rejects invalid WebDAV profiles before issuing a network request', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 204 }));

    const result = await testWebdavAvailability(
      {
        endpointUrl: 'ftp://dav.example.com/collection/',
        username: 'alice',
        password: 'secret-pass',
        lastTestedAt: null,
        lastTestStatus: 'untested',
      },
      fetchMock,
    );

    expect(result.kind).toBe('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
