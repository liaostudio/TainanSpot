import { ArrowRight } from 'lucide-react'
import { formatPrice } from '../../utils/dashboard.js'
import { MetricCard } from '../MetricCard.jsx'
import { DataBreakdownCard } from '../siteShared.jsx'

export function TransactionDetailPage({ record, onBack, onOpenCommunity, onPrev, onNext, hasPrev, hasNext }) {
  const productLabel = record.type === 'presale' ? '預售屋' : '中古屋'
  const parkingLabel = record.hasPark ? '有車位' : '無車位'
  const canOpenCommunity = Boolean(record.locationName || record.projectName)
  const sampleStatus = record.isSpecialSample ? '特殊樣本' : '一般樣本'
  const sampleStatusDesc = record.isSpecialSample
    ? '這筆成交備註含有特殊樣本關鍵字，判讀時不建議直接視為一般市場行情。'
    : '這筆成交未被標記為特殊樣本，較適合作為一般市場比較參考。'

  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">成交明細</p>
          <h1>成交明細頁</h1>
          <p className="site-hero-lead">
            這一頁只呈現單筆成交資料本身，不做推測。讓你直接看清楚交易日期、位置、產品、坪數、樓層、總價、單價、車位與備註。
          </p>
        </div>
      </section>

      <div className="cta-row">
        <button type="button" className="cta-secondary" onClick={onBack}>返回條件篩選</button>
        <button type="button" className="cta-secondary" onClick={onPrev} disabled={!hasPrev}>前一筆</button>
        <button type="button" className="cta-secondary" onClick={onNext} disabled={!hasNext}>下一筆</button>
        {canOpenCommunity ? (
          <button type="button" className="cta-primary" onClick={onOpenCommunity}>
            進一步看社區分析
            <ArrowRight size={16} />
          </button>
        ) : null}
      </div>

      <div className="metric-grid">
        <MetricCard label="交易日期" value={`${record.year} / ${String(record.month).padStart(2, '0')}`} helper="這筆成交的交易年月" accent="blue" showHint={false} />
        <MetricCard label="產品類型" value={productLabel} helper="依目前資料判定為中古屋或預售屋" accent="amber" showHint={false} />
        <MetricCard label="總價" value={record.totalPrice ? `${Math.round(record.totalPrice / 10000)} 萬` : '-'} helper="這筆成交總價" accent="slate" showHint={false} />
        <MetricCard label="單價" value={record.unitPricePing ? `${formatPrice(record.unitPricePing)} 萬/坪` : '-'} helper="這筆成交單價" accent="green" showHint={false} />
      </div>

      <section className={`panel compact-panel ${record.isSpecialSample ? 'special-sample-panel' : ''}`}>
        <div className="panel-head compact">
          <div>
            <h3>樣本狀態</h3>
            <p>{sampleStatusDesc}</p>
          </div>
        </div>
        <div className="detail-status-row">
          <span className={`sample-flag ${record.isSpecialSample ? '' : 'is-neutral'}`}>{sampleStatus}</span>
          <span className="detail-status-text">
            {record.isSpecialSample ? `標記原因：${record.specialReason || '備註含特殊交易文字'}` : '目前沒有特殊樣本標記。'}
          </span>
        </div>
      </section>

      <div className="dashboard-grid">
        <DataBreakdownCard title="主資料" subtitle="先看這筆成交最核心的主資料。" items={[
          { name: '交易日期', value: `${record.year} / ${String(record.month).padStart(2, '0')}` },
          { name: '總價', value: record.totalPrice ? `${Math.round(record.totalPrice / 10000)} 萬` : '-' },
          { name: '單價', value: record.unitPricePing ? `${formatPrice(record.unitPricePing)} 萬/坪` : '-' },
          { name: '行政區', value: record.district || '-' },
          { name: '交易標的', value: record.tradeTarget || '-' },
          { name: '產品類型', value: productLabel },
        ]} />
        <DataBreakdownCard title="位置與產品資訊" subtitle="再看這筆成交的地點與產品條件。" items={[
          { name: '位置 / 社區', value: record.locationName || record.projectName || '-' },
          { name: '門牌 / 位置資訊', value: record.address || '-' },
          { name: '建物型態', value: record.buildType || '-' },
        ]} />
        <DataBreakdownCard title="空間條件" subtitle="看坪數、格局、樓層與土地資訊。" items={[
          { name: '房數', value: record.roomCount > 0 ? `${record.roomCount} 房` : '-' },
          { name: '建坪', value: record.totalPing ? `${record.totalPing.toFixed(1)} 坪` : '-' },
          { name: '樓層', value: record.level || '-' },
          { name: '土地坪數', value: record.landPing ? `${record.landPing.toFixed(1)} 坪` : '-' },
        ]} />
        <DataBreakdownCard title="車位資訊" subtitle="車位金額應和建物成交分開看。" items={[
          { name: '車位狀態', value: parkingLabel },
          { name: '車位坪數', value: record.parkAreaPing ? `${record.parkAreaPing.toFixed(1)} 坪` : '-' },
          { name: '車位總價', value: record.parkPrice ? `${Math.round(record.parkPrice / 10000)} 萬` : '-' },
        ]} />
      </div>

      <section className="panel">
        <div className="panel-head compact">
          <div>
            <h3>備註與判讀提醒</h3>
            <p>備註是判斷樣本是否能直接拿來比較的重要依據。</p>
          </div>
        </div>
        <div className="info-list detail-note-list">
          <p><strong>備註：</strong>{record.note || '無'}</p>
          <p><strong>樣本提醒：</strong>{sampleStatusDesc}</p>
          {record.isSpecialSample ? <p><strong>標記原因：</strong>{record.specialReason || '備註含特殊交易文字'}</p> : null}
          <p><strong>判讀建議：</strong>車位金額與特殊備註都應獨立看，不建議直接和一般成交混在一起比較。</p>
        </div>
      </section>
    </div>
  )
}
