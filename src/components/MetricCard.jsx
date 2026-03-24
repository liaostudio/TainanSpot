import { HintBadge } from './HintBadge.jsx'

export function MetricCard({ label, value, helper, accent = 'blue', showHint = true }) {
  return (
    <article className={`metric-card accent-${accent}`}>
      <p className="metric-card-label">
        <span>{label}</span>
        {showHint ? <HintBadge text={helper} /> : null}
      </p>
      <strong className="metric-card-value">{value}</strong>
    </article>
  )
}
