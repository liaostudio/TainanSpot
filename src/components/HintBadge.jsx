export function HintBadge({ text }) {
  if (!text) return null

  return (
    <span className="hint-badge" tabIndex={0} aria-label={text}>
      !
      <span className="hint-bubble">{text}</span>
    </span>
  )
}
