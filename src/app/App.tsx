import { useEffect, useState } from 'react';
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

export function App({
  enableStartupBootstrap = false,
  bootstrapWorkspace = defaultBootstrapWorkspace,
}: AppProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(true);
  const [startupResult, setStartupResult] = useState<WorkspaceBootstrapResult | null>(null);
  const undoActionLabel = appShellCopy.actionLabels[appShellCopy.actionLabels.length - 1];
  const startupStatusCopy = getStartupStatusCopy(
    startupResult
      ? {
          statusKey: startupResult.statusKey,
          nodeCount: Object.keys(startupResult.draftSnapshot?.nodesById ?? {}).length,
          errorDetail: startupResult.errorDetail,
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

        <section aria-label={appShellCopy.canvasLabel} className="shell-card canvas-stage" role="region">
          <div className="canvas-stage-header">
            <div className="section-heading">
              <h2>{appShellCopy.canvasLabel}</h2>
              <p>{appShellCopy.canvasPlaceholder}</p>
            </div>
          </div>

          <div className="canvas-surface">
            {editableDraftSnapshot ? (
              <DraftGraphWorkspace
                initialSnapshot={editableDraftSnapshot}
                onPersistDraftSession={writePersistedDraftSession}
                onRecordStatusEntry={() => undefined}
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

            <aside aria-label={appShellCopy.hintLabel} className="hint-overlay" role="complementary">
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

            <div className="status-layer">
              {isStatusOpen ? (
                <aside aria-label={appShellCopy.statusLabel} className="status-popover" role="complementary">
                  <div className="status-popover-header">
                    <div className="section-heading">
                      <h3>{appShellCopy.statusPopupTitle}</h3>
                      <p>{appShellCopy.statusSummary}</p>
                    </div>
                    <button
                      aria-label="关闭状态弹窗"
                      className="status-close"
                      onClick={() => setIsStatusOpen(false)}
                      type="button"
                    >
                      关闭
                    </button>
                  </div>
                  <div className="status-entry">
                    <strong>{startupStatusCopy.action}</strong>
                    <dl className="status-meta">
                      <div>
                        <dt>操作时间</dt>
                        <dd>{startupStatusCopy.time}</dd>
                      </div>
                      <div>
                        <dt>操作结果</dt>
                        <dd>{startupStatusCopy.result}</dd>
                      </div>
                    </dl>
                    <p>{startupStatusCopy.detail}</p>
                  </div>
                  <div className="status-retained">
                    <strong>{appShellCopy.statusRetainedTitle}</strong>
                    <ul className="status-history-list">
                      <li key={`${startupStatusCopy.action}-${startupStatusCopy.time}`}>
                        <span>{startupStatusCopy.action}</span>
                        <span>{startupStatusCopy.time}</span>
                        <span>{startupStatusCopy.result}</span>
                      </li>
                    </ul>
                  </div>
                </aside>
              ) : null}

              {!isStatusOpen ? (
                <button
                  aria-label={appShellCopy.statusAnchorAriaLabel}
                  className="status-anchor"
                  onClick={() => setIsStatusOpen(true)}
                  type="button"
                >
                  <strong>{appShellCopy.statusAnchorLabel}</strong>
                  <span>{`${startupStatusCopy.action} · ${startupStatusCopy.result}`}</span>
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
