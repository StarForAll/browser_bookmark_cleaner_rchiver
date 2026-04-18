import { describe, expect, test, vi } from 'vitest';
import { registerWorkspaceActionTarget } from './registerWorkspaceActionTarget';

describe('workspace action target registration', () => {
  test('registers the current workspace tab through runtime messaging when a tab context exists', async () => {
    const getCurrent = vi.fn(async () => ({
      id: 17,
      windowId: 9,
    }));
    const sendMessage = vi.fn(async () => undefined);

    await registerWorkspaceActionTarget({
      runtimeApi: { sendMessage },
      tabsApi: { getCurrent },
    });

    expect(getCurrent).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'workspace-action-target/register',
      tabId: 17,
      windowId: 9,
    });
  });

  test('becomes a no-op when the workspace page is not running inside a tab context', async () => {
    const getCurrent = vi.fn(async () => undefined);
    const sendMessage = vi.fn(async () => undefined);

    await registerWorkspaceActionTarget({
      runtimeApi: { sendMessage },
      tabsApi: { getCurrent },
    });

    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('treats a missing service-worker receiver as a no-op during workspace bootstrap', async () => {
    const getCurrent = vi.fn(async () => ({
      id: 17,
      windowId: 9,
    }));
    const sendMessage = vi.fn(async () => {
      throw new Error('Could not establish connection. Receiving end does not exist.');
    });

    await expect(
      registerWorkspaceActionTarget({
        runtimeApi: { sendMessage },
        tabsApi: { getCurrent },
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'workspace-action-target/register',
      tabId: 17,
      windowId: 9,
    });
  });

  test('rethrows a service-worker registration failure returned through the response payload', async () => {
    const getCurrent = vi.fn(async () => ({
      id: 17,
      windowId: 9,
    }));
    const sendMessage = vi.fn(async () => ({
      ok: false,
      error: 'Session storage write failed.',
    }));

    await expect(
      registerWorkspaceActionTarget({
        runtimeApi: { sendMessage },
        tabsApi: { getCurrent },
      }),
    ).rejects.toThrow('Session storage write failed.');
  });
});
