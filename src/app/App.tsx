import { useState } from 'react';
import { appShellCopy } from '@/shared/copy/appShell';
import './app.css';

export function App() {
  const [isStatusOpen, setIsStatusOpen] = useState(true);
  const undoActionLabel = appShellCopy.actionLabels[appShellCopy.actionLabels.length - 1];

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
            <div className="canvas-placeholder">
              <div className="canvas-draft-card">
                <span className="canvas-badge">{appShellCopy.canvasDraftTitle}</span>
                <strong>{appShellCopy.title}</strong>
                <p>{appShellCopy.canvasDraftSummary}</p>
              </div>
            </div>

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
                    <strong>{appShellCopy.statusLatestEntry.action}</strong>
                    <dl className="status-meta">
                      <div>
                        <dt>操作时间</dt>
                        <dd>{appShellCopy.statusLatestEntry.time}</dd>
                      </div>
                      <div>
                        <dt>操作结果</dt>
                        <dd>{appShellCopy.statusLatestEntry.result}</dd>
                      </div>
                    </dl>
                    <p>{appShellCopy.statusLatestEntry.detail}</p>
                  </div>
                  <div className="status-retained">
                    <strong>{appShellCopy.statusRetainedTitle}</strong>
                    <ul className="status-history-list">
                      {appShellCopy.statusRetainedEntries.map((entry) => (
                        <li key={`${entry.action}-${entry.time}`}>
                          <span>{entry.action}</span>
                          <span>{entry.time}</span>
                          <span>{entry.result}</span>
                        </li>
                      ))}
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
                  <span>{appShellCopy.statusAnchorHint}</span>
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
