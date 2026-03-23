export function TrendBadge({ value }) {
  const numeric = Number(value)

  if (Number.isNaN(numeric)) {
    return <span className="trend-badge neutral">-</span>
  }

  const tone = numeric > 0 ? 'up' : numeric < 0 ? 'down' : 'neutral'
  const label = `${numeric > 0 ? '+' : ''}${numeric.toFixed(1)}%`

  return <span className={`trend-badge ${tone}`}>{label}</span>
}
