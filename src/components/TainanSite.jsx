import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Building2,
  FileText,
  LockKeyhole,
  Layers3,
  MapPinned,
  SlidersHorizontal,
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
} from 'recharts'
import { tainanGrid, timeTabs } from '../data/dashboardData.js'
import { useDashboardModel } from '../hooks/useDashboardModel.js'
import { formatPrice, heatColor, sampleSeries } from '../utils/dashboard.js'
import { MetricCard } from './MetricCard.jsx'
import { ChartCard } from './ChartCard.jsx'
import { TrendBadge } from './TrendBadge.jsx'
import { HintBadge } from './HintBadge.jsx'
const LazyProjectDetailView = lazy(() =>
  import('./TainanDashboard.jsx').then((module) => ({ default: module.ProjectDetailView })),
)

const sectionTabs = [
  { id: 'home', label: '首頁', icon: Building2 },
  { id: 'regional', label: '區域總覽', icon: MapPinned },
  { id: 'product', label: '產品類型分析', icon: Layers3 },
  { id: 'filters', label: '條件篩選', icon: SlidersHorizontal },
  { id: 'about', label: '資料說明', icon: FileText },
]
const propertyTypeLabels = {
  existing: '中古屋',
  presale: '預售屋',
}
const tradeTargetLabels = {
  土地: '土地',
  建物: '建物',
  房地: '房地',
  '房地+車位': '房地+車位',
}
const buildingTypeLabels = {
  elevator: '大樓/華廈',
  apartment: '公寓',
  house: '透天',
  store: '店面/商辦',
}
const ADMIN_SESSION_KEY = 'tainanspot-admin-auth'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '1234'

function normalizePassword(value) {
  return value.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 65248))
}

function scrollToSection(sectionId) {
  const target = document.getElementById(sectionId)
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function DataBreakdownCard({ title, subtitle, items, emptyText = '目前沒有資料' }) {
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

function SampleStatusTag({ includeSpecialSamples }) {
  return (
    <span className={`sample-status-tag ${includeSpecialSamples ? 'is-special' : 'is-clean'}`}>
      {includeSpecialSamples ? '含特殊樣本' : '已排除特殊樣本'}
    </span>
  )
}

function SiteNav() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button type="button" className="brand-mark" onClick={() => scrollToSection('home')}>
          <Building2 size={22} />
          <span>TainanSpot</span>
        </button>

        <nav className="site-nav">
          {sectionTabs.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className="site-nav-link"
                onClick={() => scrollToSection(item.id)}
              >
                <Icon size={16} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

function AdminLoginCard({ password, onPasswordChange, onSubmit, authError }) {
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

function HomePage({ model, onJump }) {
  const quickDistricts = model.availableDistricts.slice(0, 8)

  return (
    <div className="page-stack">
      <section className="site-hero panel dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">Transaction Analysis Platform</p>
          <h1>看懂實價登錄成交資料，從條件比較開始</h1>
          <p className="site-hero-lead">
            用區域、坪數、屋齡、格局、樓層與車位條件，整理你真正看得懂的成交資訊。
          </p>
          <p className="site-hero-lead subtle">
            本網站分析內容僅依據已匯入的實價登錄成交資料欄位，不包含開價、生活機能或外部市場資訊。
          </p>
          <div className="hero-summary-bar">
            <div className="hero-summary-pill">區域比較</div>
            <div className="hero-summary-pill">產品分開分析</div>
            <div className="hero-summary-pill">條件交叉篩選</div>
            <div className="hero-summary-pill">成交明細判讀</div>
          </div>
          <div className="cta-row">
            <button type="button" className="cta-primary" onClick={() => onJump('filters')}>
              直接開始篩選
              <ArrowRight size={16} />
            </button>
            <button type="button" className="cta-secondary" onClick={() => onJump('regional')}>
              先看區域總覽
            </button>
          </div>
        </div>
        <div className="dashboard-hero-side">
          <div className="hero-highlight-card">
            <span>目前資料範圍</span>
            <strong>{model.latestDataDate || '-'}</strong>
            <p>{model.isRealMode ? '依已匯入成交資料分析' : '目前為展示資料模式'}</p>
          </div>
          <div className="hero-highlight-card">
            <span>分析核心</span>
            <strong>查詢 / 篩選 / 比較</strong>
            <p>先看分布，再看單一數值，避免把不同產品混在一起判讀</p>
          </div>
          <div className="hero-highlight-card">
            <span>可用欄位</span>
            <strong>區域 / 型態 / 坪數</strong>
            <p>也包含屋齡、格局、樓層、車位與備註欄位的條件分析</p>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>主要分析模組</h3>
              <p>先選你要用哪一種方式看成交資料。</p>
            </div>
          </div>
          <div className="simple-list">
            <button type="button" className="simple-list-item" onClick={() => onJump('regional')}>
              <div>
                <strong>區域總覽</strong>
                <p>看各行政區成交件數、總價分布、單價分布與建物型態概況</p>
              </div>
              <span>進入</span>
            </button>
            <button type="button" className="simple-list-item" onClick={() => onJump('product')}>
              <div>
                <strong>產品類型分析</strong>
                <p>先分開比較交易標的，再比較中古屋、預售屋與不同建物型態，不把不同產品混在一起看</p>
              </div>
              <span>進入</span>
            </button>
            <button type="button" className="simple-list-item" onClick={() => onJump('filters')}>
              <div>
                <strong>條件篩選</strong>
                <p>用區域、產品、房數、屋齡、樓層與車位條件，找出更接近需求的成交樣本</p>
              </div>
              <span>進入</span>
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>快速篩選入口</h3>
              <p>如果你已經有想先看的區域，可以從這裡直接開始。</p>
            </div>
          </div>
          <div className="chip-row">
            {quickDistricts.map((district) => (
              <button
                key={district}
                type="button"
                className="chip active"
                onClick={() => {
                  model.setSelectedDistrict(district)
                  model.setFilterDistrict(district)
                  onJump('regional')
                }}
              >
                {district}
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="dashboard-grid">
        <DataBreakdownCard
          title="本網站可分析的資料範圍"
          subtitle="以下都直接來自已匯入的實價登錄欄位，不另外加入外部資料。"
          items={[
            { name: '區域', value: '行政區 / 鄉鎮市區' },
            { name: '分析欄位', value: '交易標的 / 產品類型 / 建物型態' },
            { name: '空間條件', value: '坪數 / 屋齡 / 格局 / 樓層 / 車位' },
            { name: '價格資料', value: '總價 / 單價 / 成交件數' },
            { name: '樣本提醒', value: '備註 / 特殊交易標示' },
          ]}
        />
        <DataBreakdownCard
          title="資料使用原則"
          subtitle="先講分布，再講單一數值；條件一致，才拿來比較。"
          items={[
            { name: '先看分布', value: '避免只看單一平均值' },
            { name: '同條件比較', value: '不同產品不直接混比' },
            { name: '特殊樣本提示', value: '備註異常樣本會另外提醒' },
            { name: '資料限制', value: '不含開價、生活機能與外部市場資訊' },
          ]}
        />
      </section>
    </div>
  )
}

function RegionalOverviewPage({ model, onJump }) {
  const totalPriceDistributionItems = model.districtTotalPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const unitPriceDistributionItems = model.districtUnitPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const buildingTypeMixItems = model.districtBuildingTypeMix.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const topVolumeDistrictItems = model.regionalOverviewRows.slice(0, 6).map((row) => ({
    name: row.district,
    value: `${row.volume.toLocaleString()} 筆`,
  }))
  const topPriceDistrictItems = [...model.regionalOverviewRows]
    .sort((a, b) => b.price - a.price)
    .slice(0, 6)
    .map((row) => ({
      name: row.district,
      value: `${formatPrice(row.price)} 萬/坪`,
    }))
  const activeTrendFilters = [
    ...model.propertyTypeFilter.map((type) => propertyTypeLabels[type]),
    ...model.buildingFilter.map((type) => buildingTypeLabels[type]),
  ]

  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">Regional Overview</p>
          <h1>區域總覽</h1>
          <p className="site-hero-lead">
            先比較不同行政區的成交件數與價格輪廓，再切換到單一行政區，看總價分布、單價分布與建物型態概況。
          </p>
        </div>
        <label className="district-picker">
          <span>切換行政區</span>
          <select value={model.selectedDistrict} onChange={(event) => model.setSelectedDistrict(event.target.value)}>
            {model.availableDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel scenario-panel">
        <div className="panel-head compact">
          <div>
            <h3 className="panel-title-with-hint">
              <span>區域分析條件</span>
              <HintBadge text="下面的區域總覽、分布和趨勢，都會依照你選的時間、交易標的、產品類型和建物型態一起更新。" />
            </h3>
          </div>
        </div>
        <div className="filter-groups">
          <div className="filter-group">
            <span className="filter-label">時間區間</span>
            <div className="time-tabs compact">
              {timeTabs.map((tab) => (
                <button key={tab.id} type="button" className={tab.id === model.districtActiveTab ? 'is-active' : ''} onClick={() => model.setDistrictActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">產品類型</span>
            <div className="chip-row">
              <button type="button" className={model.propertyTypeFilter.includes('existing') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('existing')}>
                中古屋
              </button>
              <button type="button" className={model.propertyTypeFilter.includes('presale') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('presale')}>
                預售屋
              </button>
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">建物型態</span>
            <div className="chip-row">
              <button type="button" className={model.buildingFilter.includes('elevator') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('elevator')}>
                大樓 / 華廈
              </button>
              <button type="button" className={model.buildingFilter.includes('apartment') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('apartment')}>
                公寓
              </button>
              <button type="button" className={model.buildingFilter.includes('house') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('house')}>
                透天
              </button>
              <button type="button" className={model.buildingFilter.includes('store') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('store')}>
                店面 / 商辦
              </button>
            </div>
          </div>
        </div>
        <div className="panel-inline-hint">
          <HintBadge text={`目前已套用：${activeTrendFilters.length > 0 ? activeTrendFilters.join(' / ') : '無'}。`} />
        </div>
      </section>

      <section>
        <ChartCard
          title="行政區價格熱圖"
          subtitle="先看不同行政區的價格輪廓。統計方式：依目前篩選條件下最新年度各行政區中位數價格著色。"
        >
          <div className="heatmap">
            {tainanGrid.map((cell) => {
              const overview = model.realOverviews.find((item) => item.name === cell.id)
              const isSelected = model.selectedDistrict === cell.id

              return (
                <button
                  key={cell.id}
                  type="button"
                  style={{ gridColumn: cell.c, gridRow: cell.r }}
                  className={`heat-cell ${heatColor(overview?.price, model.minPrice, model.maxPrice)} ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (model.availableDistricts.includes(cell.id)) {
                      model.setSelectedDistrict(cell.id)
                    }
                  }}
                >
                  <strong>{cell.id}</strong>
                  <span>{overview ? `${formatPrice(overview.price)}萬` : '無資料'}</span>
                </button>
              )
            })}
          </div>
        </ChartCard>
      </section>

      <section className="panel data-breakdown-card">
        <div className="panel-head">
          <div>
            <h3 className="panel-title-with-hint">
              <span>各區成交概況</span>
              <HintBadge text="先看各行政區成交件數，再對照中位數價格與近期方向，建立不同區域的成交輪廓。" />
            </h3>
          </div>
        </div>
        {model.regionalOverviewRows.length > 0 ? (
          <div className="table-shell">
            <table className="records-table">
              <thead>
                <tr>
                  <th>行政區</th>
                  <th>成交件數</th>
                  <th>中位數價格</th>
                  <th>近期方向</th>
                </tr>
              </thead>
              <tbody>
                {model.regionalOverviewRows.map((row) => (
                  <tr key={row.district}>
                    <td>
                      <button
                        type="button"
                        className="inline-link-button"
                        onClick={() => model.setSelectedDistrict(row.district)}
                      >
                        {row.district}
                      </button>
                    </td>
                    <td>{row.volume.toLocaleString()} 筆</td>
                    <td>{formatPrice(row.price)} 萬/坪</td>
                    <td><TrendBadge value={row.yoy} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">目前篩選條件下沒有可顯示的行政區成交概況。</div>
        )}
      </section>

      <section className="dashboard-grid">
        <DataBreakdownCard title="各區成交件數比較" subtitle="先看不同區域目前哪裡成交最活躍。" items={topVolumeDistrictItems} emptyText="目前篩選條件下沒有可顯示的行政區成交件數比較。" />
        <DataBreakdownCard title="各區中位數價格比較" subtitle="再看不同區域目前常見單價位置的差異。" items={topPriceDistrictItems} emptyText="目前篩選條件下沒有可顯示的行政區價格比較。" />
      </section>

      <div className="metric-grid">
        <MetricCard label="區域成交件數" value={`${model.scenarioDistrictOverview?.volume ?? '-'} 筆`} helper="目前所選行政區的成交樣本數" accent="blue" showHint={false} />
        <MetricCard label="區域中位數價格" value={`${formatPrice(model.scenarioDistrictOverview?.price)} 萬/坪`} helper="目前所選行政區常見單價位置" accent="amber" showHint={false} />
        <MetricCard label="近一年平均總價" value={model.districtTotalPriceBand.label} helper="統計範圍：近 12 個月成交資料" accent="slate" showHint={false} />
        <MetricCard label="區域趨勢方向" value={<TrendBadge value={model.scenarioDistrictOverview?.yoy} />} helper="目前所選行政區最近價格方向變化" accent="green" showHint={false} />
        <MetricCard label="主力房型" value={model.scenarioRoomMix[0]?.name ?? '-'} helper="目前所選行政區成交最多的房型" accent="slate" showHint={false} />
      </div>
      <div className="panel-inline-hint">
        <HintBadge text="先看跨區比較，再回到單一行政區看成交件數、價格位置、近一年平均總價、近期方向和主力房型。" />
      </div>

      <section className="dashboard-grid">
        <DataBreakdownCard title={<><span>總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看這一區成交總價主要落在哪些價格帶。" items={totalPriceDistributionItems} emptyText="目前篩選條件下沒有可顯示的總價分布。" />
        <DataBreakdownCard title={<><span>單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看這一區單價主要落在哪些區間。" items={unitPriceDistributionItems} emptyText="目前篩選條件下沒有可顯示的單價分布。" />
        <DataBreakdownCard title="建物型態概況" subtitle="看這一區目前成交樣本主要是哪種建物型態。" items={buildingTypeMixItems} emptyText="目前篩選條件下沒有可顯示的建物型態概況。" />
      </section>
      <div className="panel-inline-hint">
        <HintBadge text={model.includeSpecialSamples ? '目前這些分布已納入特殊樣本，請留意備註異常樣本可能拉動價格區間。' : '目前這些分布已排除特殊樣本，較適合作為一般市場比較基準。'} />
      </div>

      <section>
        <ChartCard title={<><span>區域價格趨勢</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看所選行政區在目前條件下的時間變化。統計方式：依時間區間計算該區中位數價格與成交件數。">
          <div className="chart-wrap large">
            {model.scenarioDistrictTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={model.scenarioDistrictTrend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#1d4ed8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                  <Bar yAxisId="left" dataKey="volume" name="成交筆數" fill="#efc27b" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                  <Line yAxisId="right" dataKey="price" name="中位數價格" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">目前篩選條件下沒有可顯示的區域趨勢資料。</div>
            )}
          </div>
        </ChartCard>
      </section>
      <div className="panel-inline-hint">
        <HintBadge text={model.includeSpecialSamples ? '這張趨勢圖目前已納入特殊樣本。若波動異常，可切換特殊樣本設定再比較。' : '這張趨勢圖目前已排除特殊樣本，較適合觀察一般市場的時間變化。'} />
      </div>

      <div className="cta-row">
        <button type="button" className="cta-secondary" onClick={() => onJump('filters')}>
          直接做條件篩選
        </button>
      </div>
    </div>
  )
}

function AboutPage() {
  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">Data Notes</p>
          <h1>資料方法說明</h1>
          <p className="site-hero-lead">
            這一段只說明資料從哪裡來、可以分析哪些欄位、哪些內容不在範圍內，以及資料清理與分析呈現原則。
          </p>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>資料來源</h3>
              <p>本網站分析內容，僅依據已匯入的實價登錄 CSV 檔案欄位整理，不另外加入外部資料來源。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 主要資料來自已匯入的實價登錄成交 CSV。</p>
            <p>2. 網站會把這些欄位整理成區域、產品、條件與明細分析畫面。</p>
            <p>3. 所有分析結果都只建立在目前已匯入的成交資料內容上。</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>可分析欄位</h3>
              <p>本階段可直接用來分析的內容，只限目前 CSV 已提供的欄位。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 鄉鎮市區、交易標的、建物型態、門牌 / 位置、交易年月日。</p>
            <p>2. 建築完成年月、坪數、格局、樓層、總價、單價。</p>
            <p>3. 車位類別、車位面積、車位總價元、備註、建案名稱等欄位。</p>
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>不納入範圍</h3>
              <p>以下資訊不屬於本網站這一階段的分析範圍。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 學區、商圈、交通、重大建設等生活機能資料。</p>
            <p>2. 開價、議價率、待售物件資訊與即時市場監控資料。</p>
            <p>3. 外部社區履歷、推薦系統、AI 預測結果與外部市場資訊。</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>資料清理原則</h3>
              <p>為了讓分析結果更穩定，網站會先做基本資料整理與樣本清理。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 排除表頭重複列，統一欄位格式、面積單位與單價換算方式。</p>
            <p>2. 樓層格式與屋齡計算會先標準化，車位金額會獨立呈現。</p>
            <p>3. 可疑特殊交易、親友交易或不適合直接比較的樣本，會標示或排除。</p>
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>分析呈現原則</h3>
              <p>網站不是要提供更多資訊，而是把原本看得到但不容易理解的成交資料整理得更好讀。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 先講分布，再講單一數值，避免只看平均造成誤解。</p>
            <p>2. 條件一致才比較，同產品、同坪數帶、同屋齡帶的資料才適合放在一起看。</p>
            <p>3. 圖表都要能回到原始欄位與統計方式，讓使用者知道這個結果怎麼來。</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>使用提醒</h3>
              <p>這個網站適合拿來快速了解成交資料，但不能代替實際看屋與專業判斷。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 數據會隨匯入資料時間不同而更新。</p>
            <p>2. 單一物件仍要看樓層、位置、屋況、裝潢與個別條件。</p>
            <p>3. 真正出價或判斷前，仍建議搭配專業房仲或估價判讀。</p>
          </div>
        </section>
      </div>
    </div>
  )
}

function ProductAnalysisPage({ model }) {
  const activeTradeTargets =
    model.tradeTargetFilter.includes('all') ? ['全部交易標的'] : model.tradeTargetFilter
  const landPriceDistributionItems = model.landPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const landUnitPriceDistributionItems = model.landUnitPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const landPingDistributionItems = model.landPingDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const productPingDistributionItems = model.productPingDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const productTotalPriceDistributionItems = model.productTotalPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const productUnitPriceDistributionItems = model.productUnitPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const productSpecialHint = model.includeSpecialSamples
    ? '目前分布與比較已納入特殊樣本，判讀時請留意備註異常樣本可能影響價格位置。'
    : '目前分布與比較已排除特殊樣本，較適合作為一般市場比較基準。'

  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">Product Analysis</p>
          <h1>產品類型分析</h1>
          <p className="site-hero-lead">
            先把成交資料按交易標的、產品類型和建物型態分開，再比較成交件數、總價中位數、單價中位數與坪數分布，避免把不同產品混在一起判讀。
          </p>
        </div>
      </section>

      <section className="panel scenario-panel">
        <div className="panel-head compact">
          <div>
            <h3 className="panel-title-with-hint">
              <span>產品分析條件</span>
              <HintBadge text="這一頁先看交易標的，再看產品類型與建物型態。所有比較都依目前勾選條件重新統計。" />
            </h3>
          </div>
        </div>
        <div className="filter-groups">
          <div className="filter-group">
            <span className="filter-label">交易標的</span>
            <div className="chip-row">
              <button type="button" className={model.tradeTargetFilter.includes('all') ? 'chip active' : 'chip'} onClick={() => model.toggleTradeTarget('all')}>
                全部
              </button>
              {Object.entries(tradeTargetLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={model.tradeTargetFilter.includes(value) ? 'chip active' : 'chip'}
                  onClick={() => model.toggleTradeTarget(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {!model.isLandOnlyMode ? (
            <>
              <div className="filter-group">
                <span className="filter-label">產品類型</span>
                <div className="chip-row">
                  <button type="button" className={model.propertyTypeFilter.includes('existing') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('existing')}>
                    中古屋
                  </button>
                  <button type="button" className={model.propertyTypeFilter.includes('presale') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('presale')}>
                    預售屋
                  </button>
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">建物型態</span>
                <div className="chip-row">
                  <button type="button" className={model.buildingFilter.includes('elevator') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('elevator')}>
                    大樓 / 華廈
                  </button>
                  <button type="button" className={model.buildingFilter.includes('apartment') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('apartment')}>
                    公寓
                  </button>
                  <button type="button" className={model.buildingFilter.includes('house') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('house')}>
                    透天
                  </button>
                  <button type="button" className={model.buildingFilter.includes('store') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('store')}>
                    店面 / 商辦
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="info-list">
              <div>目前只看土地成交，因此不顯示產品類型與建物型態條件。</div>
            </div>
          )}
        </div>
        <div className="panel-inline-hint">
          <HintBadge text={`目前已套用交易標的：${activeTradeTargets.join(' / ')}。`} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3 className="panel-title-with-hint">
              <span>土地交易分析主模組</span>
              <HintBadge text="這一段專門看土地成交，先看土地樣本件數與價格位置，再看各行政區土地比較與土地坪數分布。" />
            </h3>
            <p>土地樣本完全獨立統計，不和建物、房地產品混在一起比較。</p>
          </div>
        </div>

        <div className="metric-grid">
          <MetricCard label="土地成交件數" value={`${model.landAnalysisSummary.volume.toLocaleString()} 筆`} helper="目前條件下屬於土地交易的樣本數" accent="blue" showHint={false} />
          <MetricCard label="土地總價中位數" value={model.landAnalysisSummary.medianTotalPrice > 0 ? `${model.landAnalysisSummary.medianTotalPrice} 萬` : '-'} helper="目前條件下土地成交總價中位數" accent="amber" showHint={false} />
          <MetricCard label="土地單價中位數" value={model.landAnalysisSummary.medianUnitPrice > 0 ? `${formatPrice(model.landAnalysisSummary.medianUnitPrice)} 萬/坪` : '-'} helper="目前條件下土地成交單價中位數" accent="slate" showHint={false} />
          <MetricCard label="平均土地坪數" value={model.landAnalysisSummary.avgPing > 0 ? `${model.landAnalysisSummary.avgPing} 坪` : '-'} helper="目前條件下土地成交的平均坪數" accent="green" showHint={false} />
        </div>

        {model.landDistrictRows.length > 0 ? (
          <div className="table-shell">
            <table className="records-table">
              <thead>
                <tr>
                  <th>行政區</th>
                  <th>成交件數</th>
                  <th>總價中位數</th>
                  <th>單價中位數</th>
                  <th>平均土地坪數</th>
                </tr>
              </thead>
              <tbody>
                {model.landDistrictRows.map((row) => (
                  <tr key={row.district}>
                    <td>{row.district}</td>
                    <td>{row.volume.toLocaleString()} 筆</td>
                    <td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice} 萬` : '-'}</td>
                    <td>{row.medianUnitPrice > 0 ? `${formatPrice(row.medianUnitPrice)} 萬/坪` : '-'}</td>
                    <td>{row.avgPing > 0 ? `${row.avgPing} 坪` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">目前條件下沒有可顯示的土地交易資料。</div>
        )}
      </section>

      <div className="dashboard-grid">
        <DataBreakdownCard title={<><span>土地總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看土地成交主要落在哪些總價區間。" items={landPriceDistributionItems} emptyText="目前條件下沒有可顯示的土地總價分布。" />
        <DataBreakdownCard title={<><span>土地單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看土地成交主要落在哪些單價區間。" items={landUnitPriceDistributionItems} emptyText="目前條件下沒有可顯示的土地單價分布。" />
        <DataBreakdownCard title={<><span>土地面積分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看土地成交主要落在哪些坪數帶。" items={landPingDistributionItems} emptyText="目前條件下沒有可顯示的土地面積分布。" />
      </div>
      <div className="panel-inline-hint">
        <HintBadge text={productSpecialHint} />
      </div>

      <section className="panel data-breakdown-card">
        <div className="panel-head">
          <div>
            <h3 className="panel-title-with-hint">
              <span>交易標的比較</span>
              <HintBadge text="先把土地、建物、房地、房地加車位分開看，再比較成交件數、總價中位數、單價中位數與平均坪數。" />
            </h3>
          </div>
        </div>
        {model.tradeTargetAnalysisRows.length > 0 ? (
          <div className="table-shell">
            <table className="records-table">
              <thead>
                <tr>
                  <th>交易標的</th>
                  <th>成交件數</th>
                  <th>總價中位數</th>
                  <th>單價中位數</th>
                  <th>平均面積</th>
                </tr>
              </thead>
              <tbody>
                {model.tradeTargetAnalysisRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.volume.toLocaleString()} 筆</td>
                    <td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice} 萬` : '-'}</td>
                    <td>{row.medianUnitPrice > 0 ? `${formatPrice(row.medianUnitPrice)} 萬/坪` : '-'}</td>
                    <td>{row.avgPing > 0 ? `${row.avgPing} 坪` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">目前條件下沒有可顯示的交易標的比較資料。</div>
        )}
      </section>

      <section className="panel data-breakdown-card">
        <div className="panel-head">
          <div>
            <h3 className="panel-title-with-hint">
              <span>產品類型比較</span>
              <HintBadge text="先看中古屋與預售屋的成交件數、總價中位數、單價中位數與平均建坪。" />
            </h3>
          </div>
        </div>
        {model.productTypeAnalysisRows.length > 0 ? (
          <div className="table-shell">
            <table className="records-table">
              <thead>
                <tr>
                  <th>產品類型</th>
                  <th>成交件數</th>
                  <th>總價中位數</th>
                  <th>單價中位數</th>
                  <th>平均建坪</th>
                </tr>
              </thead>
              <tbody>
                {model.productTypeAnalysisRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.volume.toLocaleString()} 筆</td>
                    <td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice} 萬` : '-'}</td>
                    <td>{row.medianUnitPrice > 0 ? `${formatPrice(row.medianUnitPrice)} 萬/坪` : '-'}</td>
                    <td>{row.avgPing > 0 ? `${row.avgPing} 坪` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">目前條件下沒有可顯示的產品類型比較資料。</div>
        )}
      </section>

      <section className="panel data-breakdown-card">
        <div className="panel-head">
          <div>
            <h3 className="panel-title-with-hint">
              <span>建物型態比較</span>
              <HintBadge text="再看大樓、華廈、公寓、透天與店面商辦的成交件數、總價中位數、單價中位數與平均建坪。" />
            </h3>
          </div>
        </div>
        {model.buildingTypeAnalysisRows.length > 0 ? (
          <div className="table-shell">
            <table className="records-table">
              <thead>
                <tr>
                  <th>建物型態</th>
                  <th>成交件數</th>
                  <th>總價中位數</th>
                  <th>單價中位數</th>
                  <th>平均建坪</th>
                </tr>
              </thead>
              <tbody>
                {model.buildingTypeAnalysisRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.volume.toLocaleString()} 筆</td>
                    <td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice} 萬` : '-'}</td>
                    <td>{row.medianUnitPrice > 0 ? `${formatPrice(row.medianUnitPrice)} 萬/坪` : '-'}</td>
                    <td>{row.avgPing > 0 ? `${row.avgPing} 坪` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">目前條件下沒有可顯示的建物型態比較資料。</div>
        )}
      </section>

      <div className="dashboard-grid">
        <DataBreakdownCard title={<><span>坪數分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看目前產品樣本主要落在哪些坪數帶。" items={productPingDistributionItems} emptyText="目前條件下沒有可顯示的坪數分布。" />
        <DataBreakdownCard title={<><span>總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看目前產品樣本主要落在哪些總價區間。" items={productTotalPriceDistributionItems} emptyText="目前條件下沒有可顯示的總價分布。" />
        <DataBreakdownCard title={<><span>單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看目前產品樣本主要落在哪些單價區間。" items={productUnitPriceDistributionItems} emptyText="目前條件下沒有可顯示的單價分布。" />
      </div>
      <div className="panel-inline-hint">
        <HintBadge text={productSpecialHint} />
      </div>

      <div className="metric-grid">
        <MetricCard label="樣本件數" value={`${model.productAnalysisSummary.volume.toLocaleString()} 筆`} helper="目前產品分析納入的成交樣本數" accent="blue" showHint={false} />
        <MetricCard label="總價中位數" value={model.productAnalysisSummary.medianTotalPrice > 0 ? `${model.productAnalysisSummary.medianTotalPrice} 萬` : '-'} helper="用目前條件下的成交總價中位數統計" accent="amber" showHint={false} />
        <MetricCard label="單價中位數" value={model.productAnalysisSummary.medianUnitPrice > 0 ? `${formatPrice(model.productAnalysisSummary.medianUnitPrice)} 萬/坪` : '-'} helper="用目前條件下的成交單價中位數統計" accent="slate" showHint={false} />
        <MetricCard
          label={model.isLandOnlyMode ? '平均土地坪數' : '平均建坪'}
          value={model.productAnalysisSummary.avgPing > 0 ? `${model.productAnalysisSummary.avgPing} 坪` : '-'}
          helper={model.isLandOnlyMode ? '目前樣本的平均土地坪數' : '目前樣本的平均建物坪數'}
          accent="green"
          showHint={false}
        />
      </div>
    </div>
  )
}

function FilterPage({ model, onJump, onOpenTransaction }) {
  const activeTradeTargets =
    model.tradeTargetFilter.includes('all') ? ['全部交易標的'] : model.tradeTargetFilter
  const resultRows = model.filterPageRecords.slice(0, 30)
  const specialSampleCount = model.filterPageRecords.filter((record) => record.isSpecialSample).length
  const filterTotalPriceItems = model.filterPageTotalPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const filterUnitPriceItems = model.filterPageUnitPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))

  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">Filter Results</p>
          <h1>條件篩選</h1>
          <p className="site-hero-lead">
            用條件把成交資料縮小到比較接近需求的樣本，再看篩選後的成交件數、總價分布、單價分布與明細列表。
          </p>
        </div>
      </section>

      <section className="panel scenario-panel">
        <div className="panel-head compact">
          <div>
            <h3 className="panel-title-with-hint">
              <span>篩選條件</span>
              <HintBadge text="這一頁的目的，是讓你用區域、交易標的、產品類型、建物型態、房數、屋齡、車位與樓層條件，找出更接近需求的成交樣本。" />
            </h3>
          </div>
        </div>
        <div className="filter-groups">
          <div className="filter-group">
            <span className="filter-label">行政區</span>
            <label className="district-picker">
              <select value={model.filterDistrict} onChange={(event) => model.setFilterDistrict(event.target.value)}>
                <option value="all">全台南</option>
                {model.availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="filter-group">
            <span className="filter-label">交易標的</span>
            <div className="chip-row">
              <button type="button" className={model.tradeTargetFilter.includes('all') ? 'chip active' : 'chip'} onClick={() => model.toggleTradeTarget('all')}>
                全部
              </button>
              {Object.entries(tradeTargetLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={model.tradeTargetFilter.includes(value) ? 'chip active' : 'chip'}
                  onClick={() => model.toggleTradeTarget(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">時間區間</span>
            <div className="time-tabs compact">
              {timeTabs.map((tab) => (
                <button key={tab.id} type="button" className={tab.id === model.districtActiveTab ? 'is-active' : ''} onClick={() => model.setDistrictActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {!model.isLandOnlyMode ? (
            <>
              <div className="filter-group">
                <span className="filter-label">產品類型</span>
                <div className="chip-row">
                  <button type="button" className={model.propertyTypeFilter.includes('existing') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('existing')}>
                    中古屋
                  </button>
                  <button type="button" className={model.propertyTypeFilter.includes('presale') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('presale')}>
                    預售屋
                  </button>
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">建物型態</span>
                <div className="chip-row">
                  <button type="button" className={model.buildingFilter.includes('elevator') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('elevator')}>
                    大樓 / 華廈
                  </button>
                  <button type="button" className={model.buildingFilter.includes('apartment') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('apartment')}>
                    公寓
                  </button>
                  <button type="button" className={model.buildingFilter.includes('house') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('house')}>
                    透天
                  </button>
                  <button type="button" className={model.buildingFilter.includes('store') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('store')}>
                    店面 / 商辦
                  </button>
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">房數</span>
                <div className="chip-row">
                  {[
                    { id: 'all', label: '全部' },
                    { id: '1', label: '1房' },
                    { id: '2', label: '2房' },
                    { id: '3', label: '3房' },
                    { id: '4+', label: '4房以上' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={model.filterRoomCount === option.id ? 'chip active' : 'chip'}
                      onClick={() => model.setFilterRoomCount(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">屋齡區間</span>
                <div className="chip-row">
                  {[
                    { id: 'all', label: '全部' },
                    { id: '0-5', label: '0-5年' },
                    { id: '6-15', label: '6-15年' },
                    { id: '16-30', label: '16-30年' },
                    { id: '30+', label: '30年以上' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={model.filterAgeRange === option.id ? 'chip active' : 'chip'}
                      onClick={() => model.setFilterAgeRange(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="info-list">
              <div>目前只看土地成交，因此不顯示產品類型、建物型態、房數與屋齡條件。</div>
            </div>
          )}
          <div className="filter-group">
            <span className="filter-label">坪數區間</span>
            <div className="range-input-row">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="最小坪數"
                value={model.filterPingMin}
                onChange={(event) => model.setFilterPingMin(event.target.value)}
              />
              <span>~</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="最大坪數"
                value={model.filterPingMax}
                onChange={(event) => model.setFilterPingMax(event.target.value)}
              />
            </div>
          </div>
          {!model.isLandOnlyMode && (
            <div className="filter-group">
              <span className="filter-label">車位有無</span>
              <div className="chip-row">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'yes', label: '有車位' },
                  { id: 'no', label: '無車位' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={model.filterParking === option.id ? 'chip active' : 'chip'}
                    onClick={() => model.setFilterParking(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="filter-group">
            <span className="filter-label">特殊樣本</span>
            <div className="chip-row">
              <button
                type="button"
                className={!model.includeSpecialSamples ? 'chip active' : 'chip'}
                onClick={() => model.setIncludeSpecialSamples(false)}
              >
                排除特殊交易
              </button>
              <button
                type="button"
                className={model.includeSpecialSamples ? 'chip active' : 'chip'}
                onClick={() => model.setIncludeSpecialSamples(true)}
              >
                納入特殊交易
              </button>
            </div>
          </div>
          {!model.isLandOnlyMode && (
            <div className="filter-group">
              <span className="filter-label">樓層條件</span>
              <div className="chip-row">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'low', label: '低樓層' },
                  { id: 'mid', label: '中樓層' },
                  { id: 'high', label: '高樓層' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={model.filterFloorType === option.id ? 'chip active' : 'chip'}
                    onClick={() => model.setFilterFloorType(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="panel-inline-hint">
          <HintBadge
            text={
              model.isLandOnlyMode
                ? `目前已套用交易標的：${activeTradeTargets.join(' / ')}。土地模式下不顯示產品類型、建物型態、房數、屋齡、車位與樓層條件。`
                : `目前已套用交易標的：${activeTradeTargets.join(' / ')}。`
            }
          />
        </div>
      </section>

      <section className={`panel compact-panel ${model.includeSpecialSamples ? 'special-sample-panel' : ''}`}>
        <div className="panel-head compact">
          <div>
            <h3>特殊樣本狀態</h3>
            <p>
              {model.includeSpecialSamples
                ? `目前結果已納入特殊樣本，共 ${specialSampleCount.toLocaleString()} 筆，列表會另外標示。`
                : '目前結果已排除特殊樣本，較適合作為一般市場比較基準。'}
            </p>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <DataBreakdownCard title={<><span>總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看目前篩選結果主要落在哪些總價區間。" items={filterTotalPriceItems} emptyText="目前條件下沒有可顯示的總價分布。" />
        <DataBreakdownCard title={<><span>單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看目前篩選結果主要落在哪些單價區間。" items={filterUnitPriceItems} emptyText="目前條件下沒有可顯示的單價分布。" />
      </div>

      <div className="metric-grid">
        <MetricCard label="篩選後件數" value={`${model.filterPageSummary.volume.toLocaleString()} 筆`} helper="目前條件下的成交樣本數" accent="blue" showHint={false} />
        <MetricCard label="單價中位數" value={model.filterPageSummary.medianPrice > 0 ? `${formatPrice(model.filterPageSummary.medianPrice)} 萬/坪` : '-'} helper="目前條件下的成交單價中位數" accent="amber" showHint={false} />
        <MetricCard label="總價中位數" value={model.filterPageSummary.medianTotalPrice > 0 ? `${model.filterPageSummary.medianTotalPrice} 萬` : '-'} helper="目前條件下的成交總價中位數" accent="slate" showHint={false} />
        <MetricCard
          label={model.isLandOnlyMode ? '平均土地坪數' : '平均建坪'}
          value={model.filterPageSummary.avgPing > 0 ? `${model.filterPageSummary.avgPing} 坪` : '-'}
          helper={model.isLandOnlyMode ? '目前條件下樣本的平均土地坪數' : '目前條件下樣本的平均建坪'}
          accent="green"
          showHint={false}
        />
      </div>

      <section className="panel transactions-panel">
        <div className="panel-head">
          <div>
            <h3>篩選結果列表</h3>
            <p>先看篩選後的成交樣本，再從總價、單價、坪數、樓層和格局找到更接近需求的案例。</p>
          </div>
        </div>
        {resultRows.length > 0 ? (
          <div className="table-shell">
            <table className="records-table">
              <thead>
                <tr>
                  <th>交易年月</th>
                  <th>位置 / 社區</th>
                  <th>產品類型</th>
                  <th>建物型態</th>
                  <th>房數</th>
                  <th>{model.isLandOnlyMode ? '土地坪數' : '建坪'}</th>
                  <th>樓層</th>
                  <th>總價</th>
                  <th>單價</th>
                </tr>
              </thead>
              <tbody>
                {resultRows.map((record) => (
                  <tr key={record.key}>
                    <td>{record.year} / {String(record.month).padStart(2, '0')}</td>
                    <td>
                      <button
                        type="button"
                        className="inline-link-button"
                        onClick={() => onOpenTransaction(record.key)}
                      >
                        {record.locationName || record.projectName || '-'}
                      </button>
                      {record.isSpecialSample ? <span className="sample-flag">特殊樣本</span> : null}
                    </td>
                    <td>{record.type === 'presale' ? '預售屋' : '中古屋'}</td>
                    <td>{record.buildType || '-'}</td>
                    <td>{model.isLandOnlyMode ? '-' : (record.roomCount > 0 ? `${record.roomCount} 房` : '-')}</td>
                    <td>{record.totalPing || record.landPing ? `${Number(record.totalPing || record.landPing).toFixed(1)} 坪` : '-'}</td>
                    <td>{model.isLandOnlyMode ? '-' : (record.level || '-')}</td>
                    <td>{record.totalPrice ? `${Math.round(record.totalPrice / 10000)} 萬` : '-'}</td>
                    <td>{record.unitPricePing ? `${formatPrice(record.unitPricePing)} 萬/坪` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">目前條件下沒有符合的成交資料。</div>
        )}
        <div className="cta-row">
          <button type="button" className="cta-secondary" onClick={() => onJump('community')}>
            往下看社區分析
          </button>
        </div>
      </section>
    </div>
  )
}

function TransactionDetailPage({ record, onBack, onOpenCommunity }) {
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
          <p className="eyebrow">Transaction Detail</p>
          <h1>成交明細頁</h1>
          <p className="site-hero-lead">
            這一頁只呈現單筆成交資料本身，不做推測。讓你直接看清楚交易日期、位置、產品、坪數、樓層、總價、單價、車位與備註。
          </p>
        </div>
      </section>

      <div className="cta-row">
        <button type="button" className="cta-secondary" onClick={onBack}>
          返回條件篩選
        </button>
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
        <DataBreakdownCard
          title="主資料"
          subtitle="先看這筆成交最核心的主資料。"
          items={[
            { name: '交易日期', value: `${record.year} / ${String(record.month).padStart(2, '0')}` },
            { name: '總價', value: record.totalPrice ? `${Math.round(record.totalPrice / 10000)} 萬` : '-' },
            { name: '單價', value: record.unitPricePing ? `${formatPrice(record.unitPricePing)} 萬/坪` : '-' },
            { name: '行政區', value: record.district || '-' },
            { name: '交易標的', value: record.tradeTarget || '-' },
            { name: '產品類型', value: productLabel },
          ]}
        />
        <DataBreakdownCard
          title="位置與產品資訊"
          subtitle="再看這筆成交的地點與產品條件。"
          items={[
            { name: '位置 / 社區', value: record.locationName || record.projectName || '-' },
            { name: '門牌 / 位置資訊', value: record.address || '-' },
            { name: '建物型態', value: record.buildType || '-' },
          ]}
        />
        <DataBreakdownCard
          title="空間條件"
          subtitle="看坪數、格局、樓層與土地資訊。"
          items={[
            { name: '房數', value: record.roomCount > 0 ? `${record.roomCount} 房` : '-' },
            { name: '建坪', value: record.totalPing ? `${record.totalPing.toFixed(1)} 坪` : '-' },
            { name: '樓層', value: record.level || '-' },
            { name: '土地坪數', value: record.landPing ? `${record.landPing.toFixed(1)} 坪` : '-' },
          ]}
        />
        <DataBreakdownCard
          title="車位資訊"
          subtitle="車位金額應和建物成交分開看。"
          items={[
            { name: '車位狀態', value: parkingLabel },
            { name: '車位坪數', value: record.parkAreaPing ? `${record.parkAreaPing.toFixed(1)} 坪` : '-' },
            { name: '車位總價', value: record.parkPrice ? `${Math.round(record.parkPrice / 10000)} 萬` : '-' },
          ]}
        />
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

function ManagePage({
  model,
  isAdminAuthenticated,
  adminPasswordInput,
  setAdminPasswordInput,
  adminAuthError,
  handleAdminLogin,
  handleAdminLogout,
}) {
  return (
    <div className="page-stack">
      {isAdminAuthenticated ? (
        <section className="panel upload-panel">
          <div className="panel-head compact">
            <div>
              <h3>GitHub 共用資料管理</h3>
              <p>把新一期 CSV 放進 `data/raw/`，重新部署後，全站就會更新成同一份資料。</p>
            </div>
            <div className="upload-actions">
              <button type="button" className="upload-trigger ghost" onClick={handleAdminLogout}>
                登出管理
              </button>
            </div>
          </div>
          <div className="upload-stats">
            <span className="upload-chip highlight">已匯入 {model.importedFiles.length} 期</span>
            <span className="upload-chip">現在資料：{model.isRealMode ? '真實資料' : '展示資料'}</span>
            <span className="upload-chip">{model.isSharedMode ? '資料模式：GitHub 共用資料' : `資料模式：${model.storageMode}`}</span>
            <span className="upload-chip">共讀到：{model.uploadStats.totalRaw.toLocaleString()} 筆</span>
            <span className="upload-chip">排除掉：{model.uploadStats.totalExcluded.toLocaleString()} 筆</span>
            <span className="upload-chip">重複的：{model.uploadStats.duplicateCount.toLocaleString()} 筆</span>
            <span className="upload-chip">{model.latestDataDate ? `最新資料：${model.latestDataDate}` : '目前尚未有可分析資料'}</span>
            <span className="upload-chip">{model.persistedAt ? `最近同步：${new Date(model.persistedAt).toLocaleString('zh-TW')}` : '目前還沒有同步記錄'}</span>
          </div>
          {model.importMessage ? <p className="import-feedback success">{model.importMessage}</p> : null}
          {model.importError ? <p className="import-feedback error">{model.importError}</p> : null}
          <div className="upload-sop">
            <span>1. 放進 `data/raw/`</span>
            <span>2. 跑 `npm run build:data`</span>
            <span>3. push 到 GitHub</span>
          </div>
          <div className="import-file-list">
            <div className="panel-head compact">
              <div>
                <h3>已匯入檔案清單</h3>
                <p>這份清單就是目前已整理進共用資料檔的期數。</p>
              </div>
            </div>
            {model.importedFiles.length > 0 ? (
              <div className="table-shell">
                <table className="records-table import-files-table">
                  <thead>
                    <tr>
                      <th>檔名</th>
                      <th>型態</th>
                      <th>有效資料</th>
                      <th>排除</th>
                      <th>重複</th>
                      <th>整理時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.importedFiles.map((file) => (
                      <tr key={file.name}>
                        <td>{file.name}</td>
                        <td>{file.propertyType === 'presale' ? '預售屋' : '中古屋'}</td>
                        <td>{file.validRecords}</td>
                        <td>{file.excludedCount}</td>
                        <td>{file.duplicateCount}</td>
                        <td>{new Date(file.importedAt).toLocaleString('zh-TW')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">目前還沒有任何匯入期數。</div>
            )}
          </div>
        </section>
      ) : (
        <AdminLoginCard
          password={adminPasswordInput}
          onPasswordChange={setAdminPasswordInput}
          onSubmit={handleAdminLogin}
          authError={adminAuthError}
        />
      )}
    </div>
  )
}

export function TainanSite() {
  const model = useDashboardModel()
  const [selectedProjectName, setSelectedProjectName] = useState(null)
  const [selectedRecordKey, setSelectedRecordKey] = useState(null)
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [adminAuthError, setAdminAuthError] = useState('')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsAdminAuthenticated(window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true')
  }, [])

  const projectDetail = useMemo(
    () => (selectedProjectName ? model.getProjectDetail(selectedProjectName) : null),
    [model, selectedProjectName],
  )
  const transactionDetail = useMemo(
    () => (selectedRecordKey ? model.getTransactionDetail(selectedRecordKey) : null),
    [model, selectedRecordKey],
  )

  const openProject = (projectName) => {
    setSelectedProjectName(projectName)
    setTimeout(() => scrollToSection('community'), 0)
  }

  const openTransaction = (recordKey) => {
    setSelectedRecordKey(recordKey)
    setTimeout(() => scrollToSection('detail'), 0)
  }

  useEffect(() => {
    const handleOpenProject = (event) => {
      if (!event.detail?.projectName) return
      openProject(event.detail.projectName)
    }

    window.addEventListener('tainanspot:open-project', handleOpenProject)
    return () => window.removeEventListener('tainanspot:open-project', handleOpenProject)
  }, [])

  const handleAdminLogin = (event) => {
    event.preventDefault()
    if (normalizePassword(adminPasswordInput) === normalizePassword(ADMIN_PASSWORD)) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
      setIsAdminAuthenticated(true)
      setAdminAuthError('')
      setAdminPasswordInput('')
      return
    }
    setAdminAuthError('管理密碼不正確，請再試一次。')
  }

  const handleAdminLogout = () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
    setIsAdminAuthenticated(false)
    setAdminPasswordInput('')
    setAdminAuthError('')
  }

  return (
    <div className="site-shell">
      <SiteNav />

      <main className="site-main">
        <section id="home">
          <HomePage model={model} onJump={scrollToSection} />
        </section>

        <section id="regional">
          <RegionalOverviewPage model={model} onJump={scrollToSection} />
        </section>

        <section id="product" className="single-page-section">
          <ProductAnalysisPage model={model} />
        </section>

        <section id="filters" className="single-page-section">
          <FilterPage model={model} onJump={scrollToSection} onOpenTransaction={openTransaction} />
        </section>

        <section id="detail" className="single-page-section">
          {transactionDetail ? (
            <TransactionDetailPage
              record={transactionDetail}
              onBack={() => scrollToSection('filters')}
              onOpenCommunity={() => {
                openProject(transactionDetail.locationName || transactionDetail.projectName)
              }}
            />
          ) : (
            <section className="panel empty-state-panel">
              <div className="panel-head">
                <div>
                  <h3>成交明細頁</h3>
                  <p>請先從條件篩選結果列表點一筆成交，這裡才會顯示單筆詳細資料。</p>
                </div>
              </div>
            </section>
          )}
        </section>

        <section id="community" className="single-page-section">
          {projectDetail ? (
            <Suspense fallback={<section className="panel"><p>正在載入社區資料...</p></section>}>
              <LazyProjectDetailView detail={projectDetail} onBack={() => scrollToSection('regional')} />
            </Suspense>
          ) : (
            <section className="panel empty-state-panel">
              <div className="panel-head">
                <div>
                  <h3>成交明細與社區分析</h3>
                  <p>從區域總覽或條件篩選點進社區後，這裡會顯示社區價格趨勢、樓層差異與交易明細。</p>
                </div>
              </div>
            </section>
          )}
        </section>

        <section id="about" className="single-page-section">
          <AboutPage />
        </section>

        <section id="manage" className="single-page-section">
          <ManagePage
            model={model}
            isAdminAuthenticated={isAdminAuthenticated}
            adminPasswordInput={adminPasswordInput}
            setAdminPasswordInput={setAdminPasswordInput}
            adminAuthError={adminAuthError}
            handleAdminLogin={handleAdminLogin}
            handleAdminLogout={handleAdminLogout}
          />
        </section>
      </main>
    </div>
  )
}
