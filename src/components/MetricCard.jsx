import { HintBadge } from './HintBadge.jsx'

export function MetricCard({ label, value, helper, accent = 'blue' }) {
  return (
    <article className={`metric-card accent-${accent}`}>
      <p className="metric-card-label">
        <span>{label}</span>
        <HintBadge text={helper} />
      </p>
      <strong className="metric-card-value">{value}</strong>
    </article>
  )
}
