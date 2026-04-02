const workflowSteps = [
  'PLAN-01 工程底座与验证基线',
  'PLAN-02 扩展运行壳与页面入口',
  'PLAN-03 书签图谱与本地草稿',
  'PLAN-04 图谱核心交互',
  'PLAN-05 搜索、重复聚焦与状态反馈',
  'PLAN-06 浏览器写回确认流',
  'PLAN-07 WebDAV 版本保存与恢复',
]

export default function App() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Chrome Extension Workspace</p>
        <h1>书签清理与归档器</h1>
        <p className="lead">
          当前已完成工作流的 design 与 plan，正在进入真实工程底座搭建。
        </p>
      </section>

      <section className="panel">
        <h2>当前工程基线</h2>
        <ul>
          <li>React + TypeScript + Vite</li>
          <li>Chrome MV3 扩展页面</li>
          <li>Vitest + Testing Library</li>
          <li>ESLint + TypeScript strict mode</li>
        </ul>
      </section>

      <section className="panel">
        <h2>后续主链</h2>
        <ol>
          {workflowSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </main>
  )
}
