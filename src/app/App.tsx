import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  appShellCopy,
  getStartupStatusCopy,
} from '@/shared/copy/appShell';
import {
  bootstrapWorkspace as defaultBootstrapWorkspace,
  type WorkspaceBootstrapResult,
} from '@/features/browser-sync/application/bootstrapWorkspace';
import { DraftGraphWorkspace } from '@/features/bookmark-graph/ui/DraftGraphWorkspace';
import { writePersistedDraftSession } from '@/adapters/local-persistence/writePersistedDraftSession';
import './app.css';

type AppProps = {
  enableStartupBootstrap?: boolean;
  bootstrapWorkspace?: () => Promise<WorkspaceBootstrapResult>;
};

const STATUS_POPOVER_OPEN_KEY = 'workspace-status-popover-open';
const STATUS_LATEST_ENTRY_KEY = 'workspace-latest-status-entry';

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

type CanvasOverlayPosition = {
  left: number;
  top: number;
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

async function readLatestStatusEntry(): Promise<PersistedStatusEntry | null> {
  const storageArea = resolveStorageArea();
  if (!storageArea?.get) {
    return null;
  }

  try {
    const persisted = await storageArea.get([STATUS_LATEST_ENTRY_KEY]);
    const value = persisted[STATUS_LATEST_ENTRY_KEY];
    return isPersistedStatusEntry(value) ? value : null;
  } catch {
    return null;
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

async function writeLatestStatusEntry(entry: PersistedStatusEntry): Promise<void> {
  const storageArea = resolveStorageArea();
  if (!storageArea?.set) {
    return;
  }

  try {
    await storageArea.set({ [STATUS_LATEST_ENTRY_KEY]: entry });
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

export function App({
  enableStartupBootstrap = false,
  bootstrapWorkspace = defaultBootstrapWorkspace,
}: AppProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(true);
  const [statusPopoverReady, setStatusPopoverReady] = useState(resolveStorageArea() === null);
  const [persistedStatusEntry, setPersistedStatusEntry] = useState<PersistedStatusEntry | null>(null);
  const [startupResult, setStartupResult] = useState<WorkspaceBootstrapResult | null>(null);
  const [hintOverlayPosition, setHintOverlayPosition] = useState<CanvasOverlayPosition | null>(null);
  const [statusOverlayPosition, setStatusOverlayPosition] = useState<CanvasOverlayPosition | null>(null);
  const canvasStageRef = useRef<HTMLElement | null>(null);
  const hintOverlayRef = useRef<HTMLElement | null>(null);
  const statusOverlayRef = useRef<HTMLElement | null>(null);
  const undoActionLabel = appShellCopy.actionLabels[appShellCopy.actionLabels.length - 1];
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
  const startupStatusEntry: PersistedStatusEntry | null = startupResult
    ? {
        statusKey: startupResult.statusKey,
        action: startupStatusCopy.action,
        time: startupStatusCopy.time,
        result: startupStatusCopy.result,
        detail: startupStatusCopy.detail,
      }
    : null;
  const displayStatusEntry: PersistedStatusEntry =
    startupStatusEntry && persistedStatusEntry && hasSameStatusMeaning(persistedStatusEntry, startupStatusEntry)
      ? persistedStatusEntry
      : startupStatusEntry ?? persistedStatusEntry ?? {
          statusKey: 'pending',
          action: startupStatusCopy.action,
          time: startupStatusCopy.time,
          result: startupStatusCopy.result,
          detail: startupStatusCopy.detail,
        };
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
          aria-label="关闭状态弹窗"
          className="status-close"
          onClick={() => {
            setIsStatusOpen(false);
            void writeStatusPopoverOpen(false);
          }}
          type="button"
        >
          关闭
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
          <li key={`${displayStatusEntry.action}-${displayStatusEntry.time}`}>
            <span>{displayStatusEntry.action}</span>
            <span>{displayStatusEntry.time}</span>
            <span>{displayStatusEntry.result}</span>
          </li>
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

  useEffect(() => {
    let isMounted = true;

    void Promise.all([readStatusPopoverOpen(), readLatestStatusEntry()]).then(([persistedOpenValue, latestEntry]) => {
      if (!isMounted) {
        return;
      }

      if (persistedOpenValue !== null) {
        setIsStatusOpen(persistedOpenValue);
      }
      if (latestEntry) {
        setPersistedStatusEntry(latestEntry);
      }
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

    if (persistedStatusEntry && hasSameStatusMeaning(persistedStatusEntry, startupStatusEntry)) {
      return;
    }

    setPersistedStatusEntry(startupStatusEntry);
    void writeLatestStatusEntry(startupStatusEntry);
  }, [persistedStatusEntry, startupStatusEntry]);

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
              {appShellCopy.actionLabels.map((label) => (
                label === undoActionLabel ? (
                  <div className="action-with-note" key={label}>
                    <button
                      aria-describedby="undo-unavailable-note"
                      disabled
                      title={appShellCopy.undoUnavailableReason}
                      type="button"
                    >
                      {label}
                    </button>
                    <span className="action-note" id="undo-unavailable-note" role="note">
                      {appShellCopy.undoUnavailableReason}
                    </span>
                  </div>
                ) : (
                  <button key={label} disabled type="button">
                    {label}
                  </button>
                )
              ))}
            </div>
            <div className="secondary-actions">
              {appShellCopy.secondaryLabels.map((label) => (
                <button key={label} disabled type="button">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section aria-label={appShellCopy.searchLabel} className="shell-card search-strip" role="search">
          <div className="section-heading">
            <h2>{appShellCopy.searchLabel}</h2>
            <p>{appShellCopy.searchSummary}</p>
          </div>
          <div className="search-placeholder">
            <input disabled placeholder={appShellCopy.searchInputPlaceholder} />
            <button disabled type="button">
              {appShellCopy.searchToggleLabel}
            </button>
          </div>
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
                  initialSnapshot={editableDraftSnapshot}
                  initialUndoHistory={startupResult?.draftSession?.undoHistory}
                  initialCheckpoints={startupResult?.draftSession?.checkpoints}
                  onPersistDraftSession={writePersistedDraftSession}
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
      {typeof document !== 'undefined' ? createPortal(hintOverlay, document.body) : hintOverlay}
      {typeof document !== 'undefined' ? createPortal(statusOverlay, document.body) : statusOverlay}
    </div>
  );
}
