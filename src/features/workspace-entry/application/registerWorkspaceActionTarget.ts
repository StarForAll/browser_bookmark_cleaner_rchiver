type RuntimeApi = {
  sendMessage: (message: unknown) => Promise<unknown>;
};

type TabsApi = {
  getCurrent: () => Promise<
    | {
        id?: number;
        windowId?: number;
      }
    | undefined
  >;
};

type RegisterWorkspaceActionTargetDependencies = {
  runtimeApi?: RuntimeApi;
  tabsApi?: TabsApi;
};

function isIgnorableRuntimeRegistrationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('Receiving end does not exist') ||
      error.message.includes('message port closed before a response was received'))
  );
}

export async function registerWorkspaceActionTarget(
  dependencies: RegisterWorkspaceActionTargetDependencies = {},
): Promise<void> {
  const runtimeApi =
    dependencies.runtimeApi ??
    (globalThis as typeof globalThis & {
      chrome?: { runtime?: RuntimeApi };
    }).chrome?.runtime;
  const tabsApi =
    dependencies.tabsApi ??
    (globalThis as typeof globalThis & {
      chrome?: { tabs?: TabsApi };
    }).chrome?.tabs;

  if (!runtimeApi?.sendMessage || !tabsApi?.getCurrent) {
    return;
  }

  const currentTab = await tabsApi.getCurrent();
  if (typeof currentTab?.id !== 'number' || typeof currentTab.windowId !== 'number') {
    return;
  }

  try {
    await runtimeApi.sendMessage({
      type: 'workspace-action-target/register',
      tabId: currentTab.id,
      windowId: currentTab.windowId,
    });
  } catch (error) {
    if (isIgnorableRuntimeRegistrationError(error)) {
      return;
    }
    throw error;
  }
}
