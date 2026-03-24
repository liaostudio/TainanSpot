import { LockKeyhole } from 'lucide-react'
import { HintBadge } from './HintBadge.jsx'

export function DataBreakdownCard({ title, subtitle, items, emptyText = '目前沒有資料' }) {
  return (
    <section className="panel data-breakdown-card">
      <div className="panel-head">
        <div>
          <h3 className="panel-title-with-hint">
            <span>{title}</span>
            <HintBadge text={subtitle} />
          </h3>
        </div>
      </div>
      {items.length > 0 ? (
        <div className="data-breakdown-list">
          {items.map((item) => (
            <div key={item.name} className="data-breakdown-row">
              <span>{item.name}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">{emptyText}</div>
      )}
    </section>
  )
}

export function SampleStatusTag({ includeSpecialSamples }) {
  return (
    <span className={`sample-status-tag ${includeSpecialSamples ? 'is-special' : 'is-clean'}`}>
      {includeSpecialSamples ? '含特殊樣本' : '已排除特殊樣本'}
    </span>
  )
}

export function AdminLoginCard({ password, onPasswordChange, onSubmit, authError }) {
  return (
    <section className="panel admin-login-panel">
      <div className="panel-head">
        <div>
          <h3>管理登入</h3>
          <p>只有輸入管理密碼後，才會顯示 GitHub 共用資料管理說明。</p>
        </div>
        <LockKeyhole className="panel-badge" />
      </div>
      <form className="admin-login-form" onSubmit={onSubmit}>
        <label className="admin-login-field">
          <span>管理密碼</span>
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="請輸入管理密碼"
          />
        </label>
        <button type="submit" className="cta-primary">
          進入匯入管理
        </button>
      </form>
      {authError ? <p className="import-feedback error">{authError}</p> : null}
    </section>
  )
}
