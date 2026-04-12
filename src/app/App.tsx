import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  appShellCopy,
  formatLocalBackupOrigin,
  formatStatusTimestamp,
  getLocalRecoveryTargetCopy,
  getOverwriteConfirmationCopy,
  getStartupStatusCopy,
  type LocalRecoveryTarget,
  type OverwriteConfirmationAction,
} from '@/shared/copy/appShell';
import { readBrowserBookmarkTree } from '@/adapters/browser-bookmarks/readBookmarkTree';
import { importBrowserTreeToDraftGraph } from '@/adapters/browser-bookmarks/importToDraft';
import { exportDraftToBrowserTree } from '@/adapters/browser-bookmarks/exportDraftToBrowserTree';
import { writeManagedBrowserTree } from '@/adapters/browser-bookmarks/writeManagedBrowserTree';
import {
  LOCAL_PERSISTENCE_SCHEMA_VERSION,
  type PersistedDraftSession,
} from '@/adapters/local-persistence/contracts';
import {
  createBrowserLocalBackupArtifact,
  createDraftLocalBackupArtifact,
  readLocalBackupArtifacts,
  writeLocalBackupArtifact,
  type BrowserLocalBackupArtifact,
  type DraftLocalBackupArtifact,
  type LocalBackupArtifact,
  type LocalBackupAvailability,
} from '@/adapters/local-persistence/localBackupArtifacts';
import {
  bootstrapWorkspace as defaultBootstrapWorkspace,
  type WorkspaceBootstrapResult,
} from '@/features/browser-sync/application/bootstrapWorkspace';
import { deriveSearchResults } from '@/features/bookmark-graph/state/searchAndFocus';
import { DraftGraphWorkspace } from '@/features/bookmark-graph/ui/DraftGraphWorkspace';
import { writePersistedDraftSession } from '@/adapters/local-persistence/writePersistedDraftSession';
import { DRAFT_GRAPH_SCHEMA_VERSION, type DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import './app.css';

type AppProps = {
  enableStartupBootstrap?: boolean;
  bootstrapWorkspace?: () => Promise<WorkspaceBootstrapResult>;
};

const STATUS_POPOVER_OPEN_KEY = 'workspace-status-popover-open';
const STATUS_LATEST_ENTRY_KEY = 'workspace-latest-status-entry';
const STATUS_HISTORY_KEY = 'workspace-status-history';

type ChromeStorageArea = {
  get: (keys: string[]) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
};

type ChromeRuntime = {
  storage?: {
    local?: ChromeStorageArea;
  };
};

type PersistedStatusEntry = {
  statusKey: string;
  action: string;
  time: string;
  result: string;
  detail: string;
};

type LocalBackupState = {
  draft: LocalBackupAvailability;
  browser: LocalBackupAvailability;
};

type PrimarySystemActionItem = (typeof appShellCopy.primaryActionItems)[number];

type SecondarySystemActionItem = (typeof appShellCopy.secondaryActionItems)[number];

type DisabledActionSummary = {
  id: string;
  labels: string[];
  reason: string;
};

type PrimarySystemActionWithState = PrimarySystemActionItem & {
  disabledReason: string | null;
  isDisabled: boolean;
};

type SecondarySystemActionWithState = SecondarySystemActionItem & {
  disabledReason: string | null;
  isDisabled: boolean;
};

type CanvasOverlayPosition = {
  left: number;
  top: number;
};

const PAGE_BACK_TO_TOP_SCROLL_THRESHOLD = 200;
const EMPTY_LOCAL_BACKUP_AVAILABILITY: LocalBackupAvailability = {
  availability: 'missing',
  artifact: null,
  reason: null,
};

function resolveCanvasOverlayMargin(viewportWidth: number): number {
  if (viewportWidth <= 720) {
    return 16;
  }

  if (viewportWidth <= 1024) {
    return 18;
  }

  return 24;
}

function resolveCanvasOverlayLeft(input: {
  stageRight: number;
  overlayWidth: number;
  viewportWidth: number;
}): number {
  const margin = resolveCanvasOverlayMargin(input.viewportWidth);

  return Math.max(
    margin,
    Math.min(
      input.stageRight - input.overlayWidth - margin,
      input.viewportWidth - input.overlayWidth - margin,
    ),
  );
}

export function resolveHintOverlayPosition(input: {
  stageRect: Pick<DOMRect, 'top' | 'right' | 'bottom'>;
  overlayWidth: number;
  overlayHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}): CanvasOverlayPosition | null {
  const margin = resolveCanvasOverlayMargin(input.viewportWidth);

  if (input.stageRect.bottom <= margin || input.stageRect.top >= input.viewportHeight - margin) {
    return null;
  }

  const left = resolveCanvasOverlayLeft({
    stageRight: input.stageRect.right,
    overlayWidth: input.overlayWidth,
    viewportWidth: input.viewportWidth,
  });
  const preferredTop = Math.max(margin, input.stageRect.top + margin);
  const maxTop = Math.max(
    margin,
    Math.min(
      input.viewportHeight - input.overlayHeight - margin,
      input.stageRect.bottom - input.overlayHeight - margin,
    ),
  );

  return {
    left,
    top: Math.min(preferredTop, maxTop),
  };
}

export function resolveStatusOverlayPosition(input: {
  stageRect: Pick<DOMRect, 'top' | 'right' | 'bottom'>;
  overlayWidth: number;
  overlayHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}): CanvasOverlayPosition | null {
  const margin = resolveCanvasOverlayMargin(input.viewportWidth);

  if (input.stageRect.bottom <= margin || input.stageRect.top >= input.viewportHeight - margin) {
    return null;
  }

  const left = resolveCanvasOverlayLeft({
    stageRight: input.stageRect.right,
    overlayWidth: input.overlayWidth,
    viewportWidth: input.viewportWidth,
  });
  const minTop = Math.max(margin, input.stageRect.top + margin);
  const preferredTop = Math.min(
    input.stageRect.bottom - input.overlayHeight - margin,
    input.viewportHeight - input.overlayHeight - margin,
  );

  return {
    left,
    top: Math.max(minTop, preferredTop),
  };
}

function resolveStorageArea(): ChromeStorageArea | null {
  return (globalThis as typeof globalThis & { chrome?: ChromeRuntime }).chrome?.storage?.local ?? null;
}

function createEmptyDraftSnapshot(): DraftGraphSnapshot {
  return {
    schemaVersion: DRAFT_GRAPH_SCHEMA_VERSION,
    snapshotVersion: 0,
    selectedNodeId: null,
    nodesById: {},
    rootIds: [],
  };
}

function buildDraftSession(
  draftSnapshot: DraftGraphSnapshot,
  baseSession?: Partial<PersistedDraftSession> | null,
): PersistedDraftSession {
  return {
    schemaVersion: LOCAL_PERSISTENCE_SCHEMA_VERSION,
    draftSnapshot,
    expandedStateById: baseSession?.expandedStateById ?? {},
    nodePositionsById: baseSession?.nodePositionsById ?? {},
    undoHistory: baseSession?.undoHistory ?? [],
    checkpoints: baseSession?.checkpoints ?? [],
  };
}

function createEmptyLocalBackupState(): LocalBackupState {
  return {
    draft: EMPTY_LOCAL_BACKUP_AVAILABILITY,
    browser: EMPTY_LOCAL_BACKUP_AVAILABILITY,
  };
}

async function readStatusPopoverOpen(): Promise<boolean | null> {
  const storageArea = resolveStorageArea();
  if (!storageArea?.get) {
    return null;
  }

  try {
    const persisted = await storageArea.get([STATUS_POPOVER_OPEN_KEY]);
    const value = persisted[STATUS_POPOVER_OPEN_KEY];
    return typeof value === 'boolean' ? value : null;
  } catch {
    return null;
  }
}

function isPersistedStatusEntry(value: unknown): value is PersistedStatusEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.statusKey === 'string' &&
    typeof candidate.action === 'string' &&
    typeof candidate.time === 'string' &&
    typeof candidate.result === 'string' &&
    typeof candidate.detail === 'string'
  );
}

function isPersistedStatusHistory(value: unknown): value is PersistedStatusEntry[] {
  return Array.isArray(value) && value.every((entry) => isPersistedStatusEntry(entry));
}

async function readStatusHistory(): Promise<PersistedStatusEntry[]> {
  const storageArea = resolveStorageArea();
  if (!storageArea?.get) {
    return [];
  }

  try {
    const persisted = await storageArea.get([STATUS_HISTORY_KEY, STATUS_LATEST_ENTRY_KEY]);
    const historyValue = persisted[STATUS_HISTORY_KEY];
    if (isPersistedStatusHistory(historyValue)) {
      return historyValue.slice(0, 3);
    }

    const latestEntry = persisted[STATUS_LATEST_ENTRY_KEY];
    return isPersistedStatusEntry(latestEntry) ? [latestEntry] : [];
  } catch {
    return [];
  }
}

async function writeStatusPopoverOpen(nextValue: boolean): Promise<void> {
  const storageArea = resolveStorageArea();
  if (!storageArea?.set) {
    return;
  }

  try {
    await storageArea.set({ [STATUS_POPOVER_OPEN_KEY]: nextValue });
  } catch {
    // Keep UI responsive even when local persistence is unavailable.
  }
}

async function writeStatusHistory(entries: PersistedStatusEntry[]): Promise<void> {
  const storageArea = resolveStorageArea();
  if (!storageArea?.set) {
    return;
  }

  try {
    await storageArea.set({
      [STATUS_HISTORY_KEY]: entries,
      [STATUS_LATEST_ENTRY_KEY]: entries[0] ?? null,
    });
  } catch {
    // Keep UI responsive even when local persistence is unavailable.
  }
}

function hasSameStatusMeaning(left: PersistedStatusEntry, right: PersistedStatusEntry): boolean {
  return (
    left.statusKey === right.statusKey &&
    left.action === right.action &&
    left.result === right.result &&
    left.detail === right.detail
  );
}

function areStatusHistoriesEqual(left: PersistedStatusEntry[], right: PersistedStatusEntry[]): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => {
      const rightEntry = right[index];
      return rightEntry !== undefined && hasSameStatusMeaning(entry, rightEntry) && entry.time === rightEntry.time;
    })
  );
}

function appendStatusHistory(current: PersistedStatusEntry[], nextEntry: PersistedStatusEntry): PersistedStatusEntry[] {
  if (current[0] && hasSameStatusMeaning(current[0], nextEntry)) {
    return current.slice(0, 3);
  }

  return [nextEntry, ...current.filter((entry) => !hasSameStatusMeaning(entry, nextEntry))].slice(0, 3);
}

function isOverwriteConfirmationAction(
  actionKey: PrimarySystemActionItem['key'],
): actionKey is OverwriteConfirmationAction {
  return actionKey === 'overwrite-draft-from-browser' || actionKey === 'sync-draft-to-browser';
}

function resolvePrimaryActionDisabledReason(
  actionKey: PrimarySystemActionItem['key'],
  input: { hasEditableDraft: boolean; hasUndoOverwriteTarget: boolean; hasRunningExternalAction: boolean },
): string | null {
  if (input.hasRunningExternalAction) {
    return appShellCopy.externalActionRunningReason;
  }

  switch (actionKey) {
    case 'overwrite-draft-from-browser':
      return null;
    case 'sync-draft-to-browser':
      return input.hasEditableDraft ? null : appShellCopy.syncWithoutDraftReason;
    case 'upload-draft-to-webdav':
      return input.hasEditableDraft ? appShellCopy.webdavUnavailableReason : appShellCopy.syncWithoutDraftReason;
    case 'upload-browser-to-webdav':
    case 'restore-webdav-draft':
    case 'restore-webdav-browser':
      return appShellCopy.webdavUnavailableReason;
    case 'undo-overwrite':
      return input.hasUndoOverwriteTarget ? null : appShellCopy.undoUnavailableReason;
    default:
      return appShellCopy.webdavUnavailableReason;
  }
}

function resolveSecondaryActionDisabledReason(
  actionKey: SecondarySystemActionItem['key'],
  input: { hasEditableDraft: boolean },
): string | null {
  switch (actionKey) {
    case 'relayout':
      return input.hasEditableDraft ? appShellCopy.relayoutUnavailableReason : appShellCopy.relayoutWithoutDraftReason;
    case 'webdav-settings':
      return appShellCopy.webdavSettingsUnavailableReason;
    default:
      return appShellCopy.webdavSettingsUnavailableReason;
  }
}

function buildDisabledActionSummaries(
  actions: Array<PrimarySystemActionWithState | SecondarySystemActionWithState>,
): DisabledActionSummary[] {
  const summaryByReason = new Map<string, DisabledActionSummary>();

  actions.forEach((action) => {
    if (!action.disabledReason) {
      return;
    }

    const existing = summaryByReason.get(action.disabledReason);
    if (existing) {
      existing.labels.push(action.label);
      return;
    }

    summaryByReason.set(action.disabledReason, {
      id: 'disabled-action-summary-' + (summaryByReason.size + 1),
      labels: [action.label],
      reason: action.disabledReason,
    });
  });

  return Array.from(summaryByReason.values());
}

export function App({
  enableStartupBootstrap = false,
  bootstrapWorkspace = defaultBootstrapWorkspace,
}: AppProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(true);
  const [statusPopoverReady, setStatusPopoverReady] = useState(resolveStorageArea() === null);
  const [persistedStatusHistory, setPersistedStatusHistory] = useState<PersistedStatusEntry[]>([]);
  const [latestActionStatusEntry, setLatestActionStatusEntry] = useState<PersistedStatusEntry | null>(null);
  const [startupResult, setStartupResult] = useState<WorkspaceBootstrapResult | null>(null);
  const [currentDraftSession, setCurrentDraftSession] = useState<PersistedDraftSession | null>(null);
  const [localBackupState, setLocalBackupState] = useState<LocalBackupState>(() => createEmptyLocalBackupState());
  const [overwriteConfirmationAction, setOverwriteConfirmationAction] = useState<OverwriteConfirmationAction | null>(null);
  const [isLocalRecoveryChooserOpen, setIsLocalRecoveryChooserOpen] = useState(false);
  const [selectedLocalRecoveryTarget, setSelectedLocalRecoveryTarget] = useState<LocalRecoveryTarget | null>(null);
  const [recoveryConfirmationTarget, setRecoveryConfirmationTarget] = useState<LocalRecoveryTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateOnly, setDuplicateOnly] = useState(false);
  const [isSearchNavigationActive, setIsSearchNavigationActive] = useState(false);
  const [searchNavigationIndex, setSearchNavigationIndex] = useState(0);
  const [hintOverlayPosition, setHintOverlayPosition] = useState<CanvasOverlayPosition | null>(null);
  const [statusOverlayPosition, setStatusOverlayPosition] = useState<CanvasOverlayPosition | null>(null);
  const [showPageBackToTopButton, setShowPageBackToTopButton] = useState(false);
  const [runningExternalAction, setRunningExternalAction] = useState<string | null>(null);
  const [workspaceRenderKey, setWorkspaceRenderKey] = useState(0);
  const canvasStageRef = useRef<HTMLElement | null>(null);
  const searchNavigationActiveRef = useRef(false);
  const hintOverlayRef = useRef<HTMLElement | null>(null);
  const statusOverlayRef = useRef<HTMLElement | null>(null);
  const pageBackToTopFrameRef = useRef(0);
  const runningExternalActionRef = useRef<string | null>(null);
  const startupStatusCopy = getStartupStatusCopy(
    startupResult
      ? {
          statusKey: startupResult.statusKey,
          nodeCount: Object.keys(startupResult.draftSnapshot?.nodesById ?? {}).length,
          errorDetail: startupResult.errorDetail,
          occurredAt: startupResult.occurredAt,
        }
      : undefined,
  );
  const startupRootNodes =
    startupResult?.draftSnapshot
      ? startupResult.draftSnapshot.rootIds
          .map((rootId) => startupResult.draftSnapshot?.nodesById[rootId])
          .filter((node) => node !== undefined)
      : [];
  const startupNodeStats = startupResult?.draftSnapshot
    ? Object.values(startupResult.draftSnapshot.nodesById).reduce(
        (stats, node) => {
          if (node.nodeType === 'folder') {
            stats.folderCount += 1;
          } else {
            stats.bookmarkCount += 1;
          }
          return stats;
        },
        { folderCount: 0, bookmarkCount: 0 },
      )
    : null;
  const editableDraftSnapshot = currentDraftSession?.draftSnapshot ?? null;
  const hasEditableDraft = editableDraftSnapshot !== null;
  const hasUndoOverwriteTarget =
    localBackupState.draft.availability === 'available' ||
    localBackupState.browser.availability === 'available';
  const normalizedSearchQuery = useMemo(() => searchQuery.trim(), [searchQuery]);
  const normalSearchResults = useMemo(() => {
    if (!editableDraftSnapshot) {
      return [];
    }

    return deriveSearchResults(editableDraftSnapshot, {
      searchQuery,
      duplicateOnly,
    });
  }, [duplicateOnly, editableDraftSnapshot, searchQuery]);
  const primarySystemActions = useMemo<PrimarySystemActionWithState[]>(() => {
    return appShellCopy.primaryActionItems.map((action) => {
      const disabledReason = resolvePrimaryActionDisabledReason(action.key, {
        hasEditableDraft,
        hasUndoOverwriteTarget,
        hasRunningExternalAction: runningExternalAction !== null,
      });
      return {
        ...action,
        disabledReason,
        isDisabled: disabledReason !== null,
      };
    });
  }, [hasEditableDraft, hasUndoOverwriteTarget, runningExternalAction]);
  const secondarySystemActions = useMemo<SecondarySystemActionWithState[]>(() => {
    return appShellCopy.secondaryActionItems.map((action) => {
      const disabledReason = resolveSecondaryActionDisabledReason(action.key, { hasEditableDraft });
      return {
        ...action,
        disabledReason,
        isDisabled: disabledReason !== null,
      };
    });
  }, [hasEditableDraft]);
  const disabledActionSummaries = useMemo(() => {
    return buildDisabledActionSummaries([...primarySystemActions, ...secondarySystemActions]);
  }, [primarySystemActions, secondarySystemActions]);
  const disabledSummaryIdByReason = useMemo(() => {
    return new Map(disabledActionSummaries.map((summary) => [summary.reason, summary.id]));
  }, [disabledActionSummaries]);
  const startupStatusEntry: PersistedStatusEntry | null = startupResult
    ? {
        statusKey: startupResult.statusKey,
        action: startupStatusCopy.action,
        time: startupStatusCopy.time,
        result: startupStatusCopy.result,
        detail: startupStatusCopy.detail,
      }
    : null;
  const latestStatusEntry = latestActionStatusEntry ?? startupStatusEntry;
  const displayStatusHistory = useMemo(() => {
    return latestStatusEntry ? appendStatusHistory(persistedStatusHistory, latestStatusEntry) : persistedStatusHistory;
  }, [latestStatusEntry, persistedStatusHistory]);
  const fallbackStatusEntry: PersistedStatusEntry = {
    statusKey: 'pending',
    action: startupStatusCopy.action,
    time: startupStatusCopy.time,
    result: startupStatusCopy.result,
    detail: startupStatusCopy.detail,
  };
  const displayStatusEntries = displayStatusHistory.length > 0 ? displayStatusHistory : [fallbackStatusEntry];
  const latestDisplayedStatusEntry = displayStatusEntries[0] ?? fallbackStatusEntry;
  const hintOverlayStyle = useMemo(() => {
    if (!hintOverlayPosition) {
      return {
        visibility: 'hidden',
      } as const;
    }

    return {
      left: `${hintOverlayPosition.left}px`,
      top: `${hintOverlayPosition.top}px`,
    } as const;
  }, [hintOverlayPosition]);
  const statusOverlayStyle = useMemo(() => {
    if (!statusOverlayPosition) {
      return {
        visibility: 'hidden',
      } as const;
    }

    return {
      left: `${statusOverlayPosition.left}px`,
      top: `${statusOverlayPosition.top}px`,
    } as const;
  }, [statusOverlayPosition]);
  const persistCurrentDraftSession = useCallback(async (
    nextSession: PersistedDraftSession,
  ) => {
    setCurrentDraftSession(nextSession);
    return writePersistedDraftSession(nextSession);
  }, []);
  const beginExternalAction = useCallback((actionKey: string): boolean => {
    if (runningExternalActionRef.current !== null) {
      return false;
    }

    runningExternalActionRef.current = actionKey;
    setRunningExternalAction(actionKey);
    return true;
  }, []);
  const finishExternalAction = useCallback(() => {
    runningExternalActionRef.current = null;
    setRunningExternalAction(null);
  }, []);
  const openStatusPopover = useCallback(() => {
    setIsStatusOpen(true);
    void writeStatusPopoverOpen(true);
  }, []);
  const recordStatusEntry = useCallback((entry: PersistedStatusEntry) => {
    setLatestActionStatusEntry(entry);
    openStatusPopover();
  }, [openStatusPopover]);
  const resetDraftReplacementUi = useCallback(() => {
    setSearchQuery('');
    setDuplicateOnly(false);
    setSearchNavigationIndex(0);
    setIsSearchNavigationActive(false);
    searchNavigationActiveRef.current = false;
  }, []);
  const updateLocalBackupState = useCallback((artifact: LocalBackupArtifact) => {
    setLocalBackupState((current) => {
      if (artifact.artifactType === 'draft-restore-backup') {
        return {
          ...current,
          draft: {
            availability: 'available',
            artifact,
          },
        };
      }

      return {
        ...current,
        browser: {
          availability: 'available',
          artifact,
        },
      };
    });
  }, []);
  const selectedLocalRecoveryArtifact = useMemo<
    DraftLocalBackupArtifact | BrowserLocalBackupArtifact | null
  >(() => {
    if (!selectedLocalRecoveryTarget) {
      return null;
    }

    if (selectedLocalRecoveryTarget === 'draft' && localBackupState.draft.availability === 'available') {
      return localBackupState.draft.artifact as DraftLocalBackupArtifact;
    }

    if (selectedLocalRecoveryTarget === 'browser' && localBackupState.browser.availability === 'available') {
      return localBackupState.browser.artifact as BrowserLocalBackupArtifact;
    }

    return null;
  }, [localBackupState.browser, localBackupState.draft, selectedLocalRecoveryTarget]);
  const recoveryConfirmationArtifact = useMemo<
    DraftLocalBackupArtifact | BrowserLocalBackupArtifact | null
  >(() => {
    if (!recoveryConfirmationTarget) {
      return null;
    }

    if (recoveryConfirmationTarget === 'draft' && localBackupState.draft.availability === 'available') {
      return localBackupState.draft.artifact as DraftLocalBackupArtifact;
    }

    if (recoveryConfirmationTarget === 'browser' && localBackupState.browser.availability === 'available') {
      return localBackupState.browser.artifact as BrowserLocalBackupArtifact;
    }

    return null;
  }, [localBackupState.browser, localBackupState.draft, recoveryConfirmationTarget]);
  const overwriteConfirmationCopy = overwriteConfirmationAction
    ? getOverwriteConfirmationCopy(overwriteConfirmationAction)
    : null;
  const recoveryConfirmationCopy = recoveryConfirmationTarget
    ? getLocalRecoveryTargetCopy(recoveryConfirmationTarget)
    : null;
  const executeOverwriteAction = useCallback(async (action: OverwriteConfirmationAction) => {
    const confirmationCopy = getOverwriteConfirmationCopy(action);
    const statusTime = () => formatStatusTimestamp(new Date().toISOString());
    if (!beginExternalAction(action)) {
      return;
    }

    try {
      if (action === 'overwrite-draft-from-browser') {
        const draftBackupArtifact = createDraftLocalBackupArtifact({
          payload: currentDraftSession?.draftSnapshot ?? createEmptyDraftSnapshot(),
          sourceOrigin: 'browser-current-tree',
          triggerAction: action,
        });
        const backupWriteResult = await writeLocalBackupArtifact(draftBackupArtifact);

        if (backupWriteResult.kind !== 'saved') {
          recordStatusEntry({
            statusKey: 'overwrite-draft-backup-blocked',
            action: confirmationCopy.blockedStatusAction,
            time: statusTime(),
            result: confirmationCopy.backupBlockedStatusResult,
            detail:
              backupWriteResult.kind === 'error'
                ? `${confirmationCopy.backupBlockedStatusDetail} ${backupWriteResult.error}`
                : confirmationCopy.backupBlockedStatusDetail,
          });
          return;
        }

        updateLocalBackupState(backupWriteResult.artifact);

        const browserTreeResult = await readBrowserBookmarkTree();
        if (browserTreeResult.kind !== 'loaded') {
          recordStatusEntry({
            statusKey: 'overwrite-draft-read-failed',
            action: confirmationCopy.blockedStatusAction,
            time: statusTime(),
            result: '读取当前浏览器书签失败，未执行覆盖',
            detail:
              browserTreeResult.kind === 'error'
                ? browserTreeResult.error
                : '当前浏览器书签不可读，已阻止覆盖。',
          });
          return;
        }

        const nextSnapshot = importBrowserTreeToDraftGraph({
          source: 'browser',
          tree: browserTreeResult.tree,
        });
        const nextSession = buildDraftSession(nextSnapshot);
        const persistResult = await persistCurrentDraftSession(nextSession);

        resetDraftReplacementUi();
        setWorkspaceRenderKey((current) => current + 1);

        recordStatusEntry({
          statusKey:
            persistResult.kind === 'saved'
              ? 'overwrite-draft-succeeded'
              : 'overwrite-draft-succeeded-unsaved',
          action: confirmationCopy.blockedStatusAction,
          time: statusTime(),
          result:
            persistResult.kind === 'saved'
              ? confirmationCopy.successStatusResult
              : '已根据当前浏览器书签重建当前草稿，但本地保存失败',
          detail:
            persistResult.kind === 'saved'
              ? confirmationCopy.successStatusDetail
              : persistResult.kind === 'error'
                ? `${confirmationCopy.successStatusDetail} ${persistResult.error}`
                : `${confirmationCopy.successStatusDetail} 当前本地存储不可用，刷新后可能丢失。`,
        });
        return;
      }

      if (!currentDraftSession) {
        return;
      }

      const currentBrowserTreeResult = await readBrowserBookmarkTree();
      if (currentBrowserTreeResult.kind !== 'loaded') {
        recordStatusEntry({
          statusKey: 'sync-draft-read-failed',
          action: confirmationCopy.blockedStatusAction,
          time: statusTime(),
          result: '读取当前浏览器书签失败，未执行同步',
          detail:
            currentBrowserTreeResult.kind === 'error'
              ? currentBrowserTreeResult.error
              : '当前浏览器书签不可读，已阻止同步。',
        });
        return;
      }

      const browserBackupArtifact = createBrowserLocalBackupArtifact({
        payload: currentBrowserTreeResult.tree,
        sourceOrigin: 'draft-sync',
        triggerAction: action,
      });
      const backupWriteResult = await writeLocalBackupArtifact(browserBackupArtifact);

      if (backupWriteResult.kind !== 'saved') {
        recordStatusEntry({
          statusKey: 'sync-draft-backup-blocked',
          action: confirmationCopy.blockedStatusAction,
          time: statusTime(),
          result: confirmationCopy.backupBlockedStatusResult,
          detail:
            backupWriteResult.kind === 'error'
              ? `${confirmationCopy.backupBlockedStatusDetail} ${backupWriteResult.error}`
              : confirmationCopy.backupBlockedStatusDetail,
        });
        return;
      }

      updateLocalBackupState(backupWriteResult.artifact);

      const writeResult = await writeManagedBrowserTree({
        desiredTree: exportDraftToBrowserTree(currentDraftSession.draftSnapshot),
        currentTree: currentBrowserTreeResult.tree,
      });

      if (writeResult.kind !== 'written') {
        const failureDetail =
          writeResult.kind === 'rolled-back-after-error'
            ? `浏览器写入过程中发生错误，但已自动回退到执行前状态。${writeResult.error}`
            : writeResult.kind === 'rollback-failed'
              ? `浏览器写入过程中发生错误，且自动回退也失败。原始错误：${writeResult.error}；回退错误：${writeResult.rollbackError}`
              : writeResult.kind === 'error'
                ? writeResult.error
                : '当前浏览器书签不可写，已阻止同步。';
        recordStatusEntry({
          statusKey: 'sync-draft-failed',
          action: confirmationCopy.blockedStatusAction,
          time: statusTime(),
          result:
            writeResult.kind === 'rolled-back-after-error'
              ? '同步当前草稿到浏览器书签失败，但已自动回退浏览器书签'
              : writeResult.kind === 'rollback-failed'
                ? '同步当前草稿到浏览器书签失败，且自动回退也失败'
                : '同步当前草稿到浏览器书签失败',
          detail: failureDetail,
        });
        return;
      }

      recordStatusEntry({
        statusKey: 'sync-draft-succeeded',
        action: confirmationCopy.blockedStatusAction,
        time: statusTime(),
        result: confirmationCopy.successStatusResult,
        detail: confirmationCopy.successStatusDetail,
      });
    } finally {
      finishExternalAction();
    }
  }, [beginExternalAction, currentDraftSession, finishExternalAction, persistCurrentDraftSession, recordStatusEntry, resetDraftReplacementUi, updateLocalBackupState]);
  const executeLocalRecovery = useCallback(async (target: LocalRecoveryTarget) => {
    const targetCopy = getLocalRecoveryTargetCopy(target);
    const statusTime = () => formatStatusTimestamp(new Date().toISOString());
    if (!beginExternalAction(`recover-${target}`)) {
      return;
    }

    try {
      if (target === 'draft') {
        if (localBackupState.draft.availability !== 'available') {
          return;
        }

        const draftBackupArtifact = localBackupState.draft.artifact as DraftLocalBackupArtifact;
        const nextSession = buildDraftSession(draftBackupArtifact.payload);
        const persistResult = await persistCurrentDraftSession(nextSession);
        resetDraftReplacementUi();
        setWorkspaceRenderKey((current) => current + 1);

        recordStatusEntry({
          statusKey:
            persistResult.kind === 'saved'
              ? 'recover-draft-succeeded'
              : 'recover-draft-succeeded-unsaved',
          action: targetCopy.successStatusAction,
          time: statusTime(),
          result:
            persistResult.kind === 'saved'
              ? targetCopy.successStatusResult
              : '已恢复当前草稿，但本地保存失败',
          detail:
            persistResult.kind === 'saved'
              ? targetCopy.successStatusDetail
              : persistResult.kind === 'error'
                ? `${targetCopy.successStatusDetail} ${persistResult.error}`
                : `${targetCopy.successStatusDetail} 当前本地存储不可用，刷新后可能丢失。`,
        });
        return;
      }

      if (localBackupState.browser.availability !== 'available') {
        return;
      }

      const browserBackupArtifact = localBackupState.browser.artifact as BrowserLocalBackupArtifact;
      const currentBrowserTreeResult = await readBrowserBookmarkTree();
      if (currentBrowserTreeResult.kind !== 'loaded') {
        recordStatusEntry({
          statusKey: 'recover-browser-read-failed',
          action: targetCopy.successStatusAction,
          time: statusTime(),
          result: '读取当前浏览器书签失败，未执行浏览器恢复',
          detail:
            currentBrowserTreeResult.kind === 'error'
              ? currentBrowserTreeResult.error
              : '当前浏览器书签不可读，无法开始浏览器恢复。',
        });
        return;
      }

      const writeResult = await writeManagedBrowserTree({
        desiredTree: browserBackupArtifact.payload,
        currentTree: currentBrowserTreeResult.tree,
      });

      if (writeResult.kind !== 'written') {
        const failureDetail =
          writeResult.kind === 'rolled-back-after-error'
            ? `浏览器恢复过程中发生错误，但已自动回退到恢复前状态。${writeResult.error}`
            : writeResult.kind === 'rollback-failed'
              ? `浏览器恢复过程中发生错误，且自动回退也失败。原始错误：${writeResult.error}；回退错误：${writeResult.rollbackError}`
              : writeResult.kind === 'error'
                ? writeResult.error
                : '当前浏览器书签不可写，无法恢复本地浏览器备份。';
        recordStatusEntry({
          statusKey: 'recover-browser-failed',
          action: targetCopy.successStatusAction,
          time: statusTime(),
          result:
            writeResult.kind === 'rolled-back-after-error'
              ? '撤销对浏览器书签的覆盖失败，但已自动回退浏览器书签到恢复前状态'
              : writeResult.kind === 'rollback-failed'
                ? '撤销对浏览器书签的覆盖失败，且自动回退也失败'
                : '撤销对浏览器书签的覆盖失败',
          detail: failureDetail,
        });
        return;
      }

      recordStatusEntry({
        statusKey: 'recover-browser-succeeded',
        action: targetCopy.successStatusAction,
        time: statusTime(),
        result: targetCopy.successStatusResult,
        detail: targetCopy.successStatusDetail,
      });
    } finally {
      finishExternalAction();
    }
  }, [beginExternalAction, finishExternalAction, localBackupState.browser, localBackupState.draft, persistCurrentDraftSession, recordStatusEntry, resetDraftReplacementUi]);
  const hintOverlay = (
    <aside
      aria-label={appShellCopy.hintLabel}
      className="hint-overlay"
      ref={hintOverlayRef}
      role="complementary"
      style={hintOverlayStyle}
    >
      <div className="section-heading">
        <h3>{appShellCopy.hintLabel}</h3>
        <p>{appShellCopy.hintSummary}</p>
      </div>
      <ul>
        {appShellCopy.hintItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
  const statusOverlay = isStatusOpen ? (
    <aside
      aria-label={appShellCopy.statusLabel}
      className="status-popover"
      ref={(node) => {
        statusOverlayRef.current = node;
      }}
      role="complementary"
      style={statusOverlayStyle}
    >
      <div className="status-popover-header">
        <div className="section-heading">
          <h3>{appShellCopy.statusPopupTitle}</h3>
          <p>{appShellCopy.statusSummary}</p>
        </div>
        <button
          aria-label={appShellCopy.statusCloseAriaLabel}
          className="status-close"
          onClick={() => {
            setIsStatusOpen(false);
            void writeStatusPopoverOpen(false);
          }}
          type="button"
        >
          {appShellCopy.statusCloseLabel}
        </button>
      </div>
      <ul className="status-history-list">
        {displayStatusEntries.map((entry) => (
          <li key={`${entry.action}-${entry.time}-${entry.result}`}>
            <strong>{entry.action}</strong>
            <dl className="status-meta">
              <div>
                <dt>操作时间</dt>
                <dd>{entry.time}</dd>
              </div>
              <div>
                <dt>操作结果</dt>
                <dd>{entry.result}</dd>
              </div>
            </dl>
            <p className="status-history-detail">{entry.detail}</p>
          </li>
        ))}
      </ul>
    </aside>
  ) : !isStatusOpen && statusPopoverReady ? (
    <button
      aria-label={appShellCopy.statusAnchorAriaLabel}
      className="status-anchor"
      onClick={() => {
        setIsStatusOpen(true);
        void writeStatusPopoverOpen(true);
      }}
      ref={(node) => {
        statusOverlayRef.current = node;
      }}
      style={statusOverlayStyle}
      type="button"
    >
      <strong>{appShellCopy.statusAnchorLabel}</strong>
      <span>{`${latestDisplayedStatusEntry.action} · ${latestDisplayedStatusEntry.result}`}</span>
    </button>
  ) : null;
  const overwriteConfirmationDialog = overwriteConfirmationCopy ? (
    <div
      aria-modal="true"
      className="draft-dialog-backdrop"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOverwriteConfirmationAction(null);
        }
      }}
      role="dialog"
    >
      <div className="draft-dialog-card overwrite-confirmation-card">
        <h3>{overwriteConfirmationCopy.title}</h3>
        <p>{overwriteConfirmationCopy.sourceSummary}</p>
        <p>{overwriteConfirmationCopy.targetSummary}</p>
        <p className="draft-dialog-warning">{overwriteConfirmationCopy.overwriteStatement}</p>
        <p>{overwriteConfirmationCopy.replaceSummary}</p>
        <p>{overwriteConfirmationCopy.preserveSummary}</p>
        <p className="draft-dialog-note">{overwriteConfirmationCopy.backupReminder}</p>
        {overwriteConfirmationCopy.caution ? (
          <p className="draft-dialog-note overwrite-confirmation-caution">
            {overwriteConfirmationCopy.caution}
          </p>
        ) : null}
        <div className="draft-dialog-actions">
          <button
            className="draft-dialog-button"
            onClick={() => {
              setOverwriteConfirmationAction(null);
            }}
            type="button"
          >
            {appShellCopy.overwriteConfirmationCancelLabel}
          </button>
          <button
            autoFocus
            className="draft-dialog-button is-primary"
            onClick={() => {
              const action = overwriteConfirmationAction;
              setOverwriteConfirmationAction(null);
              if (!action) {
                return;
              }

              void executeOverwriteAction(action);
            }}
            type="button"
          >
            {overwriteConfirmationCopy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;
  const localRecoveryChooserDialog = isLocalRecoveryChooserOpen ? (
    <div
      aria-modal="true"
      className="draft-dialog-backdrop"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsLocalRecoveryChooserOpen(false);
          setSelectedLocalRecoveryTarget(null);
        }
      }}
      role="dialog"
    >
      <div className="draft-dialog-card overwrite-confirmation-card">
        <h3>{appShellCopy.localRecoveryChooserTitle}</h3>
        <p>{appShellCopy.localRecoveryChooserSummary}</p>
        <div className="local-recovery-choice-list" role="group" aria-label={appShellCopy.localRecoveryChooserTitle}>
        {(['browser', 'draft'] as const).map((target) => {
          const targetCopy = getLocalRecoveryTargetCopy(target);
          const targetState = target === 'browser' ? localBackupState.browser : localBackupState.draft;
          const isAvailable = targetState.availability === 'available';
          const isSelected = selectedLocalRecoveryTarget === target;
          const disabledReason =
            targetState.availability === 'invalid'
              ? targetCopy.invalidReason
              : targetState.availability === 'missing'
                ? targetCopy.missingReason
                : undefined;

          return (
            <button
              aria-label={targetCopy.label}
              aria-pressed={isAvailable ? isSelected : undefined}
              className={`local-recovery-choice${isSelected ? ' is-selected' : ''}`}
              disabled={!isAvailable}
              key={target}
              onClick={() => {
                if (isAvailable) {
                  setSelectedLocalRecoveryTarget(target);
                }
              }}
              title={!isAvailable ? disabledReason : undefined}
              type="button"
            >
              <strong>{targetCopy.label}</strong>
            </button>
          );
        })}
        </div>
        <div className="draft-dialog-actions">
          <button
            className="draft-dialog-button"
            onClick={() => {
              setIsLocalRecoveryChooserOpen(false);
              setSelectedLocalRecoveryTarget(null);
            }}
            type="button"
          >
            {appShellCopy.localRecoveryChooserCancelLabel}
          </button>
          <button
            autoFocus
            className="draft-dialog-button is-primary"
            disabled={!selectedLocalRecoveryArtifact}
            onClick={() => {
              if (!selectedLocalRecoveryTarget || !selectedLocalRecoveryArtifact) {
                return;
              }

              setRecoveryConfirmationTarget(selectedLocalRecoveryTarget);
              setIsLocalRecoveryChooserOpen(false);
            }}
            type="button"
          >
            {appShellCopy.localRecoveryChooserContinueLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;
  const localRecoveryConfirmationDialog =
    recoveryConfirmationTarget && recoveryConfirmationArtifact && recoveryConfirmationCopy ? (
      <div
        aria-modal="true"
        className="draft-dialog-backdrop"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setRecoveryConfirmationTarget(null);
          }
        }}
        role="dialog"
      >
        <div className="draft-dialog-card overwrite-confirmation-card">
          <h3>{recoveryConfirmationCopy.confirmationTitle}</h3>
          <p>{recoveryConfirmationCopy.confirmationSummary}</p>
          <p className="draft-dialog-warning">
            {`${appShellCopy.localRecoverySummaryCreatedAtLabel}：${formatStatusTimestamp(
              recoveryConfirmationArtifact.createdAt,
            )}`}
          </p>
          <p>
            {`${appShellCopy.localRecoverySummaryOriginLabel}：${formatLocalBackupOrigin(
              recoveryConfirmationArtifact.sourceOrigin,
            )}`}
          </p>
          {recoveryConfirmationArtifact.sourceVersionLabel ? (
            <p>
              {`${appShellCopy.localRecoverySummaryVersionLabel}：${recoveryConfirmationArtifact.sourceVersionLabel}`}
            </p>
          ) : null}
          {recoveryConfirmationCopy.confirmationWarning ? (
            <p className="draft-dialog-note overwrite-confirmation-caution">
              {recoveryConfirmationCopy.confirmationWarning}
            </p>
          ) : null}
          <div className="draft-dialog-actions">
            <button
              className="draft-dialog-button"
              onClick={() => {
                setRecoveryConfirmationTarget(null);
              }}
              type="button"
            >
              {appShellCopy.localRecoveryChooserCancelLabel}
            </button>
            <button
              autoFocus
              className="draft-dialog-button is-primary"
              onClick={() => {
                const target = recoveryConfirmationTarget;
                setRecoveryConfirmationTarget(null);
                if (!target) {
                  return;
                }

                void executeLocalRecovery(target);
              }}
              type="button"
            >
              {appShellCopy.localRecoveryConfirmLabel}
            </button>
          </div>
        </div>
      </div>
    ) : null;
  const pageBackToTopButton = showPageBackToTopButton ? (
    <button
      aria-label={appShellCopy.pageBackToTopLabel}
      className="page-back-to-top-button"
      onClick={() => {
        setShowPageBackToTopButton(false);
        window.scrollTo({
          left: 0,
          top: 0,
        });
      }}
      title={appShellCopy.pageBackToTopLabel}
      type="button"
    >
      <span aria-hidden="true" className="page-back-to-top-icon">🚀</span>
    </button>
  ) : null;

  useEffect(() => {
    searchNavigationActiveRef.current = isSearchNavigationActive;
  }, [isSearchNavigationActive]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updatePageBackToTopVisibility = (): void => {
      pageBackToTopFrameRef.current = 0;
      setShowPageBackToTopButton(window.scrollY >= PAGE_BACK_TO_TOP_SCROLL_THRESHOLD);
    };

    const schedulePageBackToTopVisibilityUpdate = (): void => {
      if (pageBackToTopFrameRef.current !== 0) {
        return;
      }

      pageBackToTopFrameRef.current = window.requestAnimationFrame(updatePageBackToTopVisibility);
    };

    updatePageBackToTopVisibility();
    window.addEventListener('scroll', schedulePageBackToTopVisibilityUpdate, { passive: true });
    window.addEventListener('resize', schedulePageBackToTopVisibilityUpdate);

    return () => {
      if (pageBackToTopFrameRef.current !== 0) {
        window.cancelAnimationFrame(pageBackToTopFrameRef.current);
        pageBackToTopFrameRef.current = 0;
      }

      window.removeEventListener('scroll', schedulePageBackToTopVisibilityUpdate);
      window.removeEventListener('resize', schedulePageBackToTopVisibilityUpdate);
    };
  }, []);

  useEffect(() => {
    if (!isSearchNavigationActive) {
      return;
    }

    if (duplicateOnly || normalizedSearchQuery === '' || normalSearchResults.length === 0) {
      searchNavigationActiveRef.current = false;
      setIsSearchNavigationActive(false);
      setSearchNavigationIndex(0);
      return;
    }

    setSearchNavigationIndex(0);
  }, [duplicateOnly, isSearchNavigationActive, normalizedSearchQuery, normalSearchResults.length]);

  const handleSearchInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (duplicateOnly) {
      return;
    }

    if (normalizedSearchQuery === '' || normalSearchResults.length === 0) {
      if (event.key === 'Escape' && searchNavigationActiveRef.current) {
        event.preventDefault();
        searchNavigationActiveRef.current = false;
        setIsSearchNavigationActive(false);
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      searchNavigationActiveRef.current = true;
      setIsSearchNavigationActive(true);
      setSearchNavigationIndex(0);
      return;
    }

    if (!searchNavigationActiveRef.current) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      searchNavigationActiveRef.current = false;
      setIsSearchNavigationActive(false);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setSearchNavigationIndex((current) => {
        return (current + delta + normalSearchResults.length) % normalSearchResults.length;
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      readStatusPopoverOpen(),
      readStatusHistory(),
      readLocalBackupArtifacts(),
    ]).then(([persistedOpenValue, history, localBackups]) => {
      if (!isMounted) {
        return;
      }

      if (persistedOpenValue !== null) {
        setIsStatusOpen(persistedOpenValue);
      }
      setPersistedStatusHistory(history);
      if (localBackups.kind === 'loaded') {
        setLocalBackupState({
          draft: localBackups.draft,
          browser: localBackups.browser,
        });
      }
      setStatusPopoverReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!latestStatusEntry) {
      return;
    }

    const nextStatusHistory = appendStatusHistory(persistedStatusHistory, latestStatusEntry);
    if (areStatusHistoriesEqual(persistedStatusHistory, nextStatusHistory)) {
      return;
    }

    setPersistedStatusHistory(nextStatusHistory);
    void writeStatusHistory(nextStatusHistory);
  }, [latestStatusEntry, persistedStatusHistory]);

  useEffect(() => {
    if (!enableStartupBootstrap) {
      return;
    }

    let isMounted = true;

    void bootstrapWorkspace().then((result) => {
      if (isMounted) {
        setStartupResult(result);
        setCurrentDraftSession(
          result.draftSnapshot
            ? buildDraftSession(result.draftSnapshot, result.draftSession)
            : null,
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, [bootstrapWorkspace, enableStartupBootstrap]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let frameId = 0;

    const updateOverlayPositions = (): void => {
      frameId = 0;

      const canvasStage = canvasStageRef.current;
      if (!canvasStage) {
        setHintOverlayPosition(null);
        setStatusOverlayPosition(null);
        return;
      }

      const stageRect = canvasStage.getBoundingClientRect();
      const margin = resolveCanvasOverlayMargin(window.innerWidth);
      const hintOverlayElement = hintOverlayRef.current;
      const statusOverlayElement = statusOverlayRef.current;

      if (hintOverlayElement) {
        const overlayWidth = hintOverlayElement.offsetWidth || Math.min(320, window.innerWidth - margin * 2);
        const overlayHeight = hintOverlayElement.offsetHeight;

        setHintOverlayPosition(
          resolveHintOverlayPosition({
            stageRect,
            overlayWidth,
            overlayHeight,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          }),
        );
      } else {
        setHintOverlayPosition(null);
      }

      if (statusOverlayElement) {
        const overlayWidth = statusOverlayElement.offsetWidth || Math.min(360, window.innerWidth - margin * 2);
        const overlayHeight = statusOverlayElement.offsetHeight;

        setStatusOverlayPosition(
          resolveStatusOverlayPosition({
            stageRect,
            overlayWidth,
            overlayHeight,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          }),
        );
      } else {
        setStatusOverlayPosition(null);
      }
    };

    const scheduleOverlayPositionUpdate = (): void => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(updateOverlayPositions);
    };

    scheduleOverlayPositionUpdate();
    window.addEventListener('scroll', scheduleOverlayPositionUpdate, { passive: true });
    window.addEventListener('resize', scheduleOverlayPositionUpdate);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            scheduleOverlayPositionUpdate();
          })
        : null;

    if (resizeObserver && canvasStageRef.current) {
      resizeObserver.observe(canvasStageRef.current);
    }
    if (resizeObserver && hintOverlayRef.current) {
      resizeObserver.observe(hintOverlayRef.current);
    }
    if (resizeObserver && statusOverlayRef.current) {
      resizeObserver.observe(statusOverlayRef.current);
    }

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener('scroll', scheduleOverlayPositionUpdate);
      window.removeEventListener('resize', scheduleOverlayPositionUpdate);
      resizeObserver?.disconnect();
    };
  }, [isStatusOpen, statusPopoverReady]);

  return (
    <div className="workspace-shell">
      <main className="workspace-frame">
        <section aria-label={appShellCopy.topShellLabel} className="shell-card top-shell" role="region">
          <div className="top-shell-intro">
            <div className="section-heading">
              <h1>{appShellCopy.title}</h1>
              <p className="subtitle">{appShellCopy.subtitle}</p>
            </div>
          </div>
          <div className="top-shell-actions">
            <div className="section-heading top-shell-summary">
              <h2>{appShellCopy.topShellLabel}</h2>
              <p>{appShellCopy.topShellSummary}</p>
            </div>
            <div className="action-grid">
              {primarySystemActions.map((action) => (
                <button
                  aria-describedby={action.disabledReason ? disabledSummaryIdByReason.get(action.disabledReason) : undefined}
                  disabled={action.isDisabled}
                  key={action.key}
                  onClick={() => {
                    if (action.isDisabled) {
                      return;
                    }

                    if (isOverwriteConfirmationAction(action.key)) {
                      setOverwriteConfirmationAction(action.key);
                      return;
                    }

                    if (action.key === 'undo-overwrite') {
                      const hasAvailableTarget =
                        localBackupState.browser.availability === 'available' ||
                        localBackupState.draft.availability === 'available';
                      const defaultTarget =
                        localBackupState.browser.availability === 'available' &&
                        localBackupState.draft.availability === 'available'
                          ? null
                          : localBackupState.browser.availability === 'available'
                          ? 'browser'
                          : localBackupState.draft.availability === 'available'
                            ? 'draft'
                            : null;

                      setSelectedLocalRecoveryTarget(defaultTarget);
                      setIsLocalRecoveryChooserOpen(hasAvailableTarget);
                    }
                  }}
                  title={action.disabledReason ?? undefined}
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div className="secondary-actions">
              {secondarySystemActions.map((action) => (
                <button
                  aria-describedby={action.disabledReason ? disabledSummaryIdByReason.get(action.disabledReason) : undefined}
                  disabled={action.isDisabled}
                  key={action.key}
                  title={action.disabledReason ?? undefined}
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div className="action-feedback" role="note">
              <strong>{appShellCopy.disabledSummaryTitle}</strong>
              <ul>
                {disabledActionSummaries.map((summary) => (
                  <li id={summary.id} key={summary.id}>
                    <span>{summary.labels.join(' / ')}</span>
                    <span>{summary.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-label={appShellCopy.searchLabel} className="shell-card search-strip" role="search">
          <div className="section-heading">
            <h2>{appShellCopy.searchLabel}</h2>
            <p>{appShellCopy.searchSummary}</p>
          </div>
          <div className="search-placeholder">
            <input
              disabled={!editableDraftSnapshot}
              onChange={(event) => {
                setSearchQuery(event.target.value);
              }}
              onKeyDown={handleSearchInputKeyDown}
              onBlur={() => {
                searchNavigationActiveRef.current = false;
                setIsSearchNavigationActive(false);
              }}
              placeholder={appShellCopy.searchInputPlaceholder}
              value={searchQuery}
            />
            <button
              aria-pressed={duplicateOnly}
              disabled={!editableDraftSnapshot}
              onClick={() => {
                setDuplicateOnly((current) => !current);
              }}
              type="button"
            >
              {appShellCopy.searchToggleLabel}
            </button>
          </div>
          <p className="search-status" role="status">
            {duplicateOnly ? appShellCopy.searchModeDuplicateOnly : appShellCopy.searchModeAll}
          </p>
        </section>

        <section aria-label={appShellCopy.canvasLabel} className="shell-card canvas-stage" ref={canvasStageRef} role="region">
          <div className="canvas-stage-header">
            <div className="section-heading">
              <h2>{appShellCopy.canvasLabel}</h2>
              <p>{appShellCopy.canvasPlaceholder}</p>
            </div>
          </div>

          <div className="canvas-surface">
            <div className="canvas-main">
              {editableDraftSnapshot ? (
                <DraftGraphWorkspace
                  duplicateOnly={duplicateOnly}
                  key={workspaceRenderKey}
                  initialSnapshot={editableDraftSnapshot}
                  initialUndoHistory={currentDraftSession?.undoHistory}
                  initialCheckpoints={currentDraftSession?.checkpoints}
                  onPersistDraftSession={persistCurrentDraftSession}
                  onExitSearchNavigation={() => {
                    setIsSearchNavigationActive(false);
                  }}
                  searchNavigationActive={isSearchNavigationActive}
                  searchNavigationIndex={searchNavigationIndex}
                  searchQuery={searchQuery}
                />
              ) : (
                <div className="canvas-placeholder">
                  <div className="canvas-draft-card">
                    <span className="canvas-badge">{appShellCopy.canvasDraftTitle}</span>
                    <strong>{appShellCopy.title}</strong>
                    <p>{startupStatusCopy.canvasSummary}</p>
                    {startupRootNodes.length > 0 && startupNodeStats ? (
                      <div className="startup-preview" role="status">
                        <h4>导入摘要</h4>
                        <p className="startup-preview-summary">
                          {`根节点 ${startupRootNodes.length} 个 · 目录 ${startupNodeStats.folderCount} 个 · 书签 ${startupNodeStats.bookmarkCount} 个`}
                        </p>
                        <ul>
                          {startupRootNodes.map((node) => (
                            <li key={node.internalId}>
                              <span>{node.nodeType === 'folder' ? '目录' : '书签'}</span>
                              <span>{node.title || '（无标题）'}</span>
                              <span>{node.nodeType === 'folder' ? `${node.childIds.length} 个直接子节点` : '根层书签'}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="startup-preview-note">
                          当前只展示导入摘要；完整思维导图渲染与节点交互会在后续图谱任务接入。
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      {pageBackToTopButton}
      {overwriteConfirmationDialog && typeof document !== 'undefined'
        ? createPortal(overwriteConfirmationDialog, document.body)
        : overwriteConfirmationDialog}
      {localRecoveryChooserDialog && typeof document !== 'undefined'
        ? createPortal(localRecoveryChooserDialog, document.body)
        : localRecoveryChooserDialog}
      {localRecoveryConfirmationDialog && typeof document !== 'undefined'
        ? createPortal(localRecoveryConfirmationDialog, document.body)
        : localRecoveryConfirmationDialog}
      {typeof document !== 'undefined' ? createPortal(hintOverlay, document.body) : hintOverlay}
      {typeof document !== 'undefined' ? createPortal(statusOverlay, document.body) : statusOverlay}
    </div>
  );
}
