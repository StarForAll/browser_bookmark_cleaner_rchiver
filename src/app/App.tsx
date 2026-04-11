import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  appShellCopy,
  getStartupStatusCopy,
} from '@/shared/copy/appShell';
import {
  bootstrapWorkspace as defaultBootstrapWorkspace,
  type WorkspaceBootstrapResult,
} from '@/features/browser-sync/application/bootstrapWorkspace';
import { deriveSearchResults } from '@/features/bookmark-graph/state/searchAndFocus';
import { DraftGraphWorkspace } from '@/features/bookmark-graph/ui/DraftGraphWorkspace';
import { writePersistedDraftSession } from '@/adapters/local-persistence/writePersistedDraftSession';
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
  statusKey: WorkspaceBootstrapResult['statusKey'] | 'pending';
  action: string;
  time: string;
  result: string;
  detail: string;
};

type SystemActionItem =
  | (typeof appShellCopy.primaryActionItems)[number]
  | (typeof appShellCopy.secondaryActionItems)[number];

type DisabledActionSummary = {
  id: string;
  labels: string[];
  reason: string;
};

type SystemActionWithState = SystemActionItem & {
  disabledReason: string;
};

type CanvasOverlayPosition = {
  left: number;
  top: number;
};

const PAGE_BACK_TO_TOP_SCROLL_THRESHOLD = 200;

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

function resolvePrimaryActionDisabledReason(
  actionKey: (typeof appShellCopy.primaryActionItems)[number]['key'],
  input: { hasEditableDraft: boolean },
): string {
  switch (actionKey) {
    case 'overwrite-draft-from-browser':
      return appShellCopy.overwriteDraftUnavailableReason;
    case 'sync-draft-to-browser':
      return input.hasEditableDraft ? appShellCopy.syncUnavailableReason : appShellCopy.syncWithoutDraftReason;
    case 'upload-draft-to-webdav':
      return input.hasEditableDraft ? appShellCopy.webdavUnavailableReason : appShellCopy.syncWithoutDraftReason;
    case 'upload-browser-to-webdav':
    case 'restore-webdav-draft':
    case 'restore-webdav-browser':
      return appShellCopy.webdavUnavailableReason;
    case 'undo-overwrite':
      return appShellCopy.undoUnavailableReason;
    default:
      return appShellCopy.webdavUnavailableReason;
  }
}

function resolveSecondaryActionDisabledReason(
  actionKey: (typeof appShellCopy.secondaryActionItems)[number]['key'],
  input: { hasEditableDraft: boolean },
): string {
  switch (actionKey) {
    case 'relayout':
      return input.hasEditableDraft ? appShellCopy.relayoutUnavailableReason : appShellCopy.relayoutWithoutDraftReason;
    case 'webdav-settings':
      return appShellCopy.webdavSettingsUnavailableReason;
    default:
      return appShellCopy.webdavSettingsUnavailableReason;
  }
}

function buildDisabledActionSummaries(actions: SystemActionWithState[]): DisabledActionSummary[] {
  const summaryByReason = new Map<string, DisabledActionSummary>();

  actions.forEach((action) => {
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
  const [startupResult, setStartupResult] = useState<WorkspaceBootstrapResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateOnly, setDuplicateOnly] = useState(false);
  const [isSearchNavigationActive, setIsSearchNavigationActive] = useState(false);
  const [searchNavigationIndex, setSearchNavigationIndex] = useState(0);
  const [hintOverlayPosition, setHintOverlayPosition] = useState<CanvasOverlayPosition | null>(null);
  const [statusOverlayPosition, setStatusOverlayPosition] = useState<CanvasOverlayPosition | null>(null);
  const [showPageBackToTopButton, setShowPageBackToTopButton] = useState(false);
  const canvasStageRef = useRef<HTMLElement | null>(null);
  const searchNavigationActiveRef = useRef(false);
  const hintOverlayRef = useRef<HTMLElement | null>(null);
  const statusOverlayRef = useRef<HTMLElement | null>(null);
  const pageBackToTopFrameRef = useRef(0);
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
  const editableDraftSnapshot = startupResult?.draftSnapshot ?? null;
  const hasEditableDraft = editableDraftSnapshot !== null;
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
  const primarySystemActions = useMemo<SystemActionWithState[]>(() => {
    return appShellCopy.primaryActionItems.map((action) => ({
      ...action,
      disabledReason: resolvePrimaryActionDisabledReason(action.key, { hasEditableDraft }),
    }));
  }, [hasEditableDraft]);
  const secondarySystemActions = useMemo<SystemActionWithState[]>(() => {
    return appShellCopy.secondaryActionItems.map((action) => ({
      ...action,
      disabledReason: resolveSecondaryActionDisabledReason(action.key, { hasEditableDraft }),
    }));
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
  const displayStatusHistory = useMemo(() => {
    return startupStatusEntry ? appendStatusHistory(persistedStatusHistory, startupStatusEntry) : persistedStatusHistory;
  }, [persistedStatusHistory, startupStatusEntry]);
  const displayStatusEntry: PersistedStatusEntry = displayStatusHistory[0] ?? {
    statusKey: 'pending',
    action: startupStatusCopy.action,
    time: startupStatusCopy.time,
    result: startupStatusCopy.result,
    detail: startupStatusCopy.detail,
  };
  const retainedStatusHistory = displayStatusHistory.length > 0 ? displayStatusHistory : [displayStatusEntry];
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
      <div className="status-entry">
        <strong>{displayStatusEntry.action}</strong>
        <dl className="status-meta">
          <div>
            <dt>操作时间</dt>
            <dd>{displayStatusEntry.time}</dd>
          </div>
          <div>
            <dt>操作结果</dt>
            <dd>{displayStatusEntry.result}</dd>
          </div>
        </dl>
        <p>{displayStatusEntry.detail}</p>
      </div>
      <div className="status-retained">
        <strong>{appShellCopy.statusRetainedTitle}</strong>
        <ul className="status-history-list">
          {retainedStatusHistory.map((entry) => (
            <li key={`${entry.action}-${entry.time}-${entry.result}`}>
              <span className="status-history-action">{entry.action}</span>
              <span className="status-history-time">{entry.time}</span>
              <span className="status-history-result">{entry.result}</span>
              <p className="status-history-detail">{entry.detail}</p>
            </li>
          ))}
        </ul>
      </div>
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
      <span>{`${displayStatusEntry.action} · ${displayStatusEntry.result}`}</span>
    </button>
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

    void Promise.all([readStatusPopoverOpen(), readStatusHistory()]).then(([persistedOpenValue, history]) => {
      if (!isMounted) {
        return;
      }

      if (persistedOpenValue !== null) {
        setIsStatusOpen(persistedOpenValue);
      }
      setPersistedStatusHistory(history);
      setStatusPopoverReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!startupStatusEntry) {
      return;
    }

    const nextStatusHistory = appendStatusHistory(persistedStatusHistory, startupStatusEntry);
    if (areStatusHistoriesEqual(persistedStatusHistory, nextStatusHistory)) {
      return;
    }

    setPersistedStatusHistory(nextStatusHistory);
    void writeStatusHistory(nextStatusHistory);
  }, [persistedStatusHistory, startupStatusEntry]);

  useEffect(() => {
    if (!enableStartupBootstrap) {
      return;
    }

    let isMounted = true;

    void bootstrapWorkspace().then((result) => {
      if (isMounted) {
        setStartupResult(result);
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
                  aria-describedby={disabledSummaryIdByReason.get(action.disabledReason)}
                  disabled
                  key={action.key}
                  title={action.disabledReason}
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div className="secondary-actions">
              {secondarySystemActions.map((action) => (
                <button
                  aria-describedby={disabledSummaryIdByReason.get(action.disabledReason)}
                  disabled
                  key={action.key}
                  title={action.disabledReason}
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
                  initialSnapshot={editableDraftSnapshot}
                  initialUndoHistory={startupResult?.draftSession?.undoHistory}
                  initialCheckpoints={startupResult?.draftSession?.checkpoints}
                  onPersistDraftSession={writePersistedDraftSession}
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
      {typeof document !== 'undefined' ? createPortal(hintOverlay, document.body) : hintOverlay}
      {typeof document !== 'undefined' ? createPortal(statusOverlay, document.body) : statusOverlay}
    </div>
  );
}
