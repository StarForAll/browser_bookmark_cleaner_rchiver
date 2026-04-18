export const WORKSPACE_ACTION_TARGET_STORAGE_KEY = 'workspace-action-target';

type WorkspaceActionMessageResponse =
  | {
      ok: true;
      handled: boolean;
    }
  | {
      ok: false;
      error: string;
    };

type RuntimeSendResponse = (response: WorkspaceActionMessageResponse) => void;

type RuntimeApi = {
  getURL: (path: string) => string;
  onMessage?: {
    addListener: (
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: RuntimeSendResponse,
      ) => void | boolean | Promise<unknown>,
    ) => void;
  };
};

type ActionApi = {
  onClicked?: {
    addListener: (callback: () => void | Promise<void>) => void;
  };
};

type SessionStorageArea = {
  get: (keys: string[]) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
};

type TabsApi = {
  create: (properties: { url: string; active: boolean }) => Promise<unknown>;
  update: (tabId: number, properties: { active: boolean }) => Promise<unknown>;
};

type WindowsApi = {
  update: (windowId: number, updateInfo: { focused: boolean }) => Promise<unknown>;
};

type WorkspaceActionTarget = {
  tabId: number;
  windowId: number;
};

type ActionWorkerDependencies = {
  runtimeApi?: RuntimeApi;
  actionApi?: ActionApi;
  storageSession?: SessionStorageArea;
  tabsApi?: TabsApi;
  windowsApi?: WindowsApi;
};

function toWorkspaceActionMessageError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Workspace action target registration failed.';
}

function isWorkspaceActionTarget(value: unknown): value is WorkspaceActionTarget {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.tabId === 'number' && typeof candidate.windowId === 'number';
}

function isWorkspaceActionRegisterMessage(
  value: unknown,
): value is {
  type: 'workspace-action-target/register';
  tabId: number;
  windowId: number;
} {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    candidate.type === 'workspace-action-target/register' &&
    typeof candidate.tabId === 'number' &&
    typeof candidate.windowId === 'number'
  );
}

async function openNewWorkspaceTab(input: {
  runtimeApi: RuntimeApi;
  tabsApi: TabsApi;
}): Promise<void> {
  await input.tabsApi.create({
    active: true,
    url: input.runtimeApi.getURL('index.html'),
  });
}

export async function handleWorkspaceActionMessage(
  message: unknown,
  dependencies: ActionWorkerDependencies = {},
): Promise<boolean> {
  if (!isWorkspaceActionRegisterMessage(message)) {
    return false;
  }

  const storageSession =
    dependencies.storageSession ??
    (globalThis as typeof globalThis & {
      chrome?: { storage?: { session?: SessionStorageArea } };
    }).chrome?.storage?.session;

  if (!storageSession?.set) {
    return false;
  }

  await storageSession.set({
    [WORKSPACE_ACTION_TARGET_STORAGE_KEY]: {
      tabId: message.tabId,
      windowId: message.windowId,
    },
  });
  return true;
}

export async function handleWorkspaceActionClick(
  dependencies: ActionWorkerDependencies = {},
): Promise<void> {
  const runtimeApi =
    dependencies.runtimeApi ??
    (globalThis as typeof globalThis & {
      chrome?: { runtime?: RuntimeApi };
    }).chrome?.runtime;
  const storageSession =
    dependencies.storageSession ??
    (globalThis as typeof globalThis & {
      chrome?: { storage?: { session?: SessionStorageArea } };
    }).chrome?.storage?.session;
  const tabsApi =
    dependencies.tabsApi ??
    (globalThis as typeof globalThis & {
      chrome?: { tabs?: TabsApi };
    }).chrome?.tabs;
  const windowsApi =
    dependencies.windowsApi ??
    (globalThis as typeof globalThis & {
      chrome?: { windows?: WindowsApi };
    }).chrome?.windows;

  if (!runtimeApi?.getURL || !storageSession?.get || !tabsApi?.create || !tabsApi?.update || !windowsApi?.update) {
    return;
  }

  const stored = await storageSession.get([WORKSPACE_ACTION_TARGET_STORAGE_KEY]);
  const rememberedTarget = stored[WORKSPACE_ACTION_TARGET_STORAGE_KEY];

  if (isWorkspaceActionTarget(rememberedTarget)) {
    try {
      await windowsApi.update(rememberedTarget.windowId, { focused: true });
      await tabsApi.update(rememberedTarget.tabId, { active: true });
      return;
    } catch {
      await storageSession.remove(WORKSPACE_ACTION_TARGET_STORAGE_KEY);
    }
  }

  await openNewWorkspaceTab({
    runtimeApi,
    tabsApi,
  });
}

export function installWorkspaceActionServiceWorker(
  dependencies: ActionWorkerDependencies = {},
): void {
  const runtimeApi =
    dependencies.runtimeApi ??
    (globalThis as typeof globalThis & {
      chrome?: { runtime?: RuntimeApi };
    }).chrome?.runtime;
  const actionApi =
    dependencies.actionApi ??
    (globalThis as typeof globalThis & {
      chrome?: { action?: ActionApi };
    }).chrome?.action;

  runtimeApi?.onMessage?.addListener((message, _sender, sendResponse) => {
    if (!isWorkspaceActionRegisterMessage(message)) {
      return false;
    }

    void handleWorkspaceActionMessage(message, dependencies).then(
      (handled) => {
        sendResponse({
          ok: true,
          handled,
        });
      },
      (error) => {
        sendResponse({
          ok: false,
          error: toWorkspaceActionMessageError(error),
        });
      },
    );
    return true;
  });
  actionApi?.onClicked?.addListener(() => {
    void handleWorkspaceActionClick(dependencies);
  });
}
