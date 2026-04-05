import { appShellCopy } from '@/shared/copy/appShell';
import './app.css';

export function App() {
  return (
    <div className="workspace-shell">
      <header className="shell-card shell-header">
        <div>
          <p className="eyebrow">Chrome MV3 Extension Workspace</p>
          <h1>{appShellCopy.title}</h1>
          <p className="subtitle">{appShellCopy.subtitle}</p>
        </div>
      </header>

      <main className="workspace-grid">
        <section aria-label={appShellCopy.topShellLabel} className="shell-card top-shell" role="region">
          <div className="section-heading">
            <h2>{appShellCopy.topShellLabel}</h2>
            <p>显式动作入口先固定下来，执行逻辑在后续任务接入。</p>
          </div>
          <div className="action-grid">
            {appShellCopy.actionLabels.map((label) => (
              <button key={label} disabled type="button">
                {label}
              </button>
            ))}
          </div>
          <div className="secondary-actions">
            {appShellCopy.secondaryLabels.map((label) => (
              <button key={label} disabled type="button">
                {label}
              </button>
            ))}
          </div>
        </section>

        <section aria-label={appShellCopy.searchLabel} className="shell-card search-strip" role="search">
          <div className="section-heading">
            <h2>{appShellCopy.searchLabel}</h2>
            <p>{appShellCopy.searchPlaceholder}</p>
          </div>
          <div className="search-placeholder">
            <input disabled placeholder="搜索入口待后续任务接入" />
            <button disabled type="button">
              仅看重复项
            </button>
          </div>
        </section>

        <section aria-label={appShellCopy.canvasLabel} className="shell-card canvas-region" role="region">
          <div className="section-heading">
            <h2>{appShellCopy.canvasLabel}</h2>
            <p>{appShellCopy.canvasPlaceholder}</p>
          </div>
          <div className="canvas-placeholder">Workspace Canvas Placeholder</div>
        </section>

        <aside aria-label={appShellCopy.hintLabel} className="shell-card hint-region" role="complementary">
          <div className="section-heading">
            <h2>{appShellCopy.hintLabel}</h2>
            <p>低干扰操作提示区已经预留。</p>
          </div>
          <ul>
            {appShellCopy.hintItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>

        <aside aria-label={appShellCopy.statusLabel} className="shell-card status-region" role="complementary">
          <div className="section-heading">
            <h2>{appShellCopy.statusLabel}</h2>
            <p>{appShellCopy.statusPlaceholder}</p>
          </div>
          <div className="status-placeholder">
            <strong>最新结果</strong>
            <span>当前无可展示动作</span>
          </div>
        </aside>
      </main>
    </div>
  );
}
