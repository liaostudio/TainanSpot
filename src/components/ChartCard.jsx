import { HintBadge } from './HintBadge.jsx'

export function ChartCard({ title, subtitle, children, actions }) {
  return (
    <section className="panel chart-card">
      <div className="panel-head">
        <div>
          <h3 className="panel-title-with-hint">
            <span>{title}</span>
            <HintBadge text={subtitle} />
          </h3>
        </div>
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  )
}
