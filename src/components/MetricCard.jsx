export function MetricCard({ label, value, helper, accent = 'blue' }) {
  return (
    <article className={`metric-card accent-${accent}`}>
      <p className="metric-card-label">{label}</p>
      <strong className="metric-card-value">{value}</strong>
      <p className="metric-card-helper">{helper}</p>
    </article>
  )
}
