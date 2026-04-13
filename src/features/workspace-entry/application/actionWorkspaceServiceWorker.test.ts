import { describe, expect, test, vi } from 'vitest';
import {
  handleWorkspaceActionClick,
  handleWorkspaceActionMessage,
  WORKSPACE_ACTION_TARGET_STORAGE_KEY,
} from './actionWorkspaceServiceWorker';

describe('workspace action service worker', () => {
  test('stores the registered workspace target in session storage', async () => {
    const set = vi.fn(async () => undefined);

    await handleWorkspaceActionMessage(
      {
        type: 'workspace-action-target/register',
        tabId: 17,
        windowId: 9,
      },
      {
        storageSession: {
          get: vi.fn(async () => ({})),
          set,
          remove: vi.fn(async () => undefined),
        },
      },
    );

    expect(set).toHaveBeenCalledWith({
      [WORKSPACE_ACTION_TARGET_STORAGE_KEY]: {
        tabId: 17,
        windowId: 9,
      },
    });
  });

  test('focuses the registered workspace tab instead of opening a duplicate tab', async () => {
    const get = vi.fn(async () => ({
      [WORKSPACE_ACTION_TARGET_STORAGE_KEY]: {
        tabId: 17,
        windowId: 9,
      },
    }));
    const tabsUpdate = vi.fn(async () => undefined);
    const windowsUpdate = vi.fn(async () => undefined);
    const create = vi.fn(async () => undefined);
    const getURL = vi.fn((path: string) => `chrome-extension://extension-id/${path}`);

    await handleWorkspaceActionClick({
      runtimeApi: { getURL },
      storageSession: {
        get,
        set: vi.fn(async () => undefined),
        remove: vi.fn(async () => undefined),
      },
      tabsApi: { create, update: tabsUpdate },
      windowsApi: { update: windowsUpdate },
    });

    expect(windowsUpdate).toHaveBeenCalledWith(9, { focused: true });
    expect(tabsUpdate).toHaveBeenCalledWith(17, { active: true });
    expect(create).not.toHaveBeenCalled();
  });

  test('falls back to opening a new workspace tab when no registered target exists', async () => {
    const create = vi.fn(async () => undefined);
    const getURL = vi.fn((path: string) => `chrome-extension://extension-id/${path}`);

    await handleWorkspaceActionClick({
      runtimeApi: { getURL },
      storageSession: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => undefined),
        remove: vi.fn(async () => undefined),
      },
      tabsApi: { create, update: vi.fn(async () => undefined) },
      windowsApi: { update: vi.fn(async () => undefined) },
    });

    expect(create).toHaveBeenCalledWith({
      active: true,
      url: 'chrome-extension://extension-id/index.html',
    });
  });

  test('clears a stale registered target and opens a new workspace tab when focusing fails', async () => {
    const create = vi.fn(async () => undefined);
    const remove = vi.fn(async () => undefined);
    const getURL = vi.fn((path: string) => `chrome-extension://extension-id/${path}`);

    await handleWorkspaceActionClick({
      runtimeApi: { getURL },
      storageSession: {
        get: vi.fn(async () => ({
          [WORKSPACE_ACTION_TARGET_STORAGE_KEY]: {
            tabId: 17,
            windowId: 9,
          },
        })),
        set: vi.fn(async () => undefined),
        remove,
      },
      tabsApi: {
        create,
        update: vi.fn(async () => {
          throw new Error('No tab with id: 17.');
        }),
      },
      windowsApi: { update: vi.fn(async () => undefined) },
    });

    expect(remove).toHaveBeenCalledWith(WORKSPACE_ACTION_TARGET_STORAGE_KEY);
    expect(create).toHaveBeenCalledWith({
      active: true,
      url: 'chrome-extension://extension-id/index.html',
    });
  });
});
