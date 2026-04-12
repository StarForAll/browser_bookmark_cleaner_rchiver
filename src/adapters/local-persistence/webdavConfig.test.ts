import { describe, expect, test, vi } from 'vitest';
import { LOCAL_PERSISTENCE_KEYS } from './contracts';
import {
  readPersistedWebdavConfig,
  writePersistedWebdavConfig,
} from './webdavConfig';

describe('T10 local WebDAV config persistence', () => {
  test('restores the persisted WebDAV profile and permission state from chrome.storage.local', async () => {
    const result = await readPersistedWebdavConfig({
      get: vi.fn(async () => ({
        [LOCAL_PERSISTENCE_KEYS.sensitive.webdavProfile]: {
          endpointUrl: 'https://dav.example.com/collection/',
          username: 'alice',
          password: 'secret-pass',
          lastTestedAt: '2026-04-12T10:30:00.000Z',
          lastTestStatus: 'success',
        },
        [LOCAL_PERSISTENCE_KEYS.sensitive.webdavPermissionState]: {
          origin: 'https://dav.example.com/',
          granted: true,
        },
      })),
    });

    expect(result).toEqual({
      kind: 'restored',
      state: {
        profile: {
          endpointUrl: 'https://dav.example.com/collection/',
          username: 'alice',
          password: 'secret-pass',
          lastTestedAt: '2026-04-12T10:30:00.000Z',
          lastTestStatus: 'success',
        },
        permissionState: {
          origin: 'https://dav.example.com/',
          granted: true,
        },
      },
    });
  });

  test('returns empty when no persisted WebDAV config exists', async () => {
    const result = await readPersistedWebdavConfig({
      get: vi.fn(async () => ({})),
    });

    expect(result).toEqual({
      kind: 'empty',
    });
  });

  test('restores a profile without permission state when only the profile key exists', async () => {
    const result = await readPersistedWebdavConfig({
      get: vi.fn(async () => ({
        [LOCAL_PERSISTENCE_KEYS.sensitive.webdavProfile]: {
          endpointUrl: 'https://dav.example.com/collection/',
          username: 'alice',
          password: 'secret-pass',
          lastTestedAt: null,
          lastTestStatus: 'untested',
        },
      })),
    });

    expect(result).toEqual({
      kind: 'restored',
      state: {
        profile: {
          endpointUrl: 'https://dav.example.com/collection/',
          username: 'alice',
          password: 'secret-pass',
          lastTestedAt: null,
          lastTestStatus: 'untested',
        },
        permissionState: null,
      },
    });
  });

  test('restores a permission state without profile when only the permission key exists', async () => {
    const result = await readPersistedWebdavConfig({
      get: vi.fn(async () => ({
        [LOCAL_PERSISTENCE_KEYS.sensitive.webdavPermissionState]: {
          origin: 'https://dav.example.com/',
          granted: true,
        },
      })),
    });

    expect(result).toEqual({
      kind: 'restored',
      state: {
        profile: null,
        permissionState: {
          origin: 'https://dav.example.com/',
          granted: true,
        },
      },
    });
  });

  test('persists the WebDAV profile and permission state into the sensitive storage keys', async () => {
    const set = vi.fn(async () => undefined);

    const result = await writePersistedWebdavConfig(
      {
        profile: {
          endpointUrl: 'https://dav.example.com/collection/',
          username: 'alice',
          password: 'secret-pass',
          lastTestedAt: null,
          lastTestStatus: 'untested',
        },
        permissionState: {
          origin: 'https://dav.example.com/',
          granted: false,
        },
      },
      { set },
    );

    expect(result).toEqual({ kind: 'saved' });
    expect(set).toHaveBeenCalledWith({
      [LOCAL_PERSISTENCE_KEYS.sensitive.webdavProfile]: {
        endpointUrl: 'https://dav.example.com/collection/',
        username: 'alice',
        password: 'secret-pass',
        lastTestedAt: null,
        lastTestStatus: 'untested',
      },
      [LOCAL_PERSISTENCE_KEYS.sensitive.webdavPermissionState]: {
        origin: 'https://dav.example.com/',
        granted: false,
      },
    });
  });

  test('rejects writing a permission state without a persisted profile', async () => {
    const set = vi.fn(async () => undefined);

    const result = await writePersistedWebdavConfig(
      {
        profile: null,
        permissionState: {
          origin: 'https://dav.example.com/',
          granted: true,
        },
      },
      { set },
    );

    expect(result).toEqual({
      kind: 'error',
      error: 'WebDAV permission state cannot exist without a persisted profile.',
    });
    expect(set).not.toHaveBeenCalled();
  });
});
