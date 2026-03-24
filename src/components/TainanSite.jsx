import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Building2,
  FileText,
  LockKeyhole,
  MapPinned,
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
  { id: 'overview', label: '全市總覽', icon: Building2 },
  { id: 'district', label: '行政區分析', icon: MapPinned },
  { id: 'community', label: '社區分析', icon: BarChart3 },
  { id: 'manage', label: '資料管理', icon: LockKeyhole },
  { id: 'about', label: '資料說明', icon: FileText },
]
const propertyTypeLabels = {
  existing: '中古屋',
  presale: '預售屋',
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

function SiteNav() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button type="button" className="brand-mark" onClick={() => scrollToSection('overview')}>
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
  const sampledCityTrend = sampleSeries(model.cityTrend, 24)

  return (
    <div className="page-stack">
      <section className="site-hero panel dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">City Analysis Desk</p>
          <h1>全市行情分析台</h1>
          <p className="site-hero-lead">
            這裡先用全市數據回答三件事：台南現在大概多少錢、最近是升溫還是盤整、哪些行政區值得先看。
            看完這一屏，再往下切到行政區和社區分析會更快進入重點。
          </p>
          <div className="hero-summary-bar">
            <div className="hero-summary-pill">全市價格定位</div>
            <div className="hero-summary-pill">成交熱度變化</div>
            <div className="hero-summary-pill">行政區價格熱圖</div>
          </div>
          <div className="cta-row">
            <button type="button" className="cta-primary" onClick={() => onJump('district')}>
              進入區域分析台
              <ArrowRight size={16} />
            </button>
            <button type="button" className="cta-secondary" onClick={() => onJump('community')}>
              直接看社區分析
            </button>
          </div>
        </div>
        <div className="dashboard-hero-side">
          <div className="hero-highlight-card">
            <span>全市價格定位</span>
            <strong>{formatPrice(model.citySummary.price)} 萬/坪</strong>
            <p>{model.latestDataDate ? `資料最新到 ${model.latestDataDate}` : '目前是展示資料模式'}</p>
          </div>
          <div className="hero-highlight-card">
            <span>最新趨勢方向</span>
            <strong><TrendBadge value={model.citySummary.yoy} /></strong>
            <p>快速判斷現在比較像升溫、修正，還是盤整</p>
          </div>
          <div className="hero-highlight-card">
            <span>市場熱度</span>
            <strong>{model.citySummary.volume} 筆</strong>
            <p>筆數越多，越能代表這段時間的市場節奏</p>
          </div>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard label="全市整體價格" value={`${formatPrice(model.citySummary.price)} 萬/坪`} helper="先抓台南整體價格基準" accent="blue" />
        <MetricCard label="趨勢方向" value={<TrendBadge value={model.citySummary.yoy} />} helper="快速看目前行情是升是降" accent="amber" />
        <MetricCard label="成交筆數" value={`${model.citySummary.volume} 筆`} helper={model.latestDataDate ? `最新資料到 ${model.latestDataDate}` : '目前是展示資料模式'} accent="slate" />
        <MetricCard label="高價區代表" value={model.citySummary.hottest?.name ?? '-'} helper="目前價格最高的行政區" accent="green" />
        <MetricCard label="親民區代表" value={model.citySummary.mostAffordable?.name ?? '-'} helper="目前價格相對低的行政區" accent="slate" />
      </div>

      <section>
        <ChartCard title="行政區價格熱圖" subtitle="顏色越深代表價格越高，方便快速抓各區價格位置。">
          <div className="panel-filter-row">
            <HintBadge text="統計方式：依目前篩選條件下最新年度各行政區中位數價格著色。" />
            <HintBadge
              text={`目前已套用：${[...model.propertyTypeFilter.map((type) => propertyTypeLabels[type]), ...model.buildingFilter.map((type) => buildingTypeLabels[type])]
                .filter(Boolean)
                .join(' / ')} 篩選。`}
            />
          </div>
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
                      onJump('district')
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

      <section>
        <ChartCard title="台南全市價量走勢" subtitle="用一張主圖一起看台南整體中位數價格和成交筆數的變化。">
          <div className="panel-filter-row">
            <div className="time-tabs compact">
              {timeTabs.map((tab) => (
                <button key={tab.id} type="button" className={tab.id === model.cityActiveTab ? 'is-active' : ''} onClick={() => model.setCityActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            <HintBadge text="統計方式：依所選時間區間，彙整全市中位數價格與成交筆數。" />
          </div>
          <div className="chart-wrap large">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sampledCityTrend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#1d4ed8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                <Bar yAxisId="left" dataKey="volume" name="成交筆數" fill="#efc27b" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                <Line yAxisId="right" dataKey="price" name="中位數價格" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>
    </div>
  )
}

function DistrictPage({ model, onJump }) {
  const roomMixItems = model.scenarioRoomMix.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const topProjects = model.scenarioRankings.slice(0, 8)
  const activeTrendFilters = [
    ...model.propertyTypeFilter.map((type) => propertyTypeLabels[type]),
    ...model.buildingFilter.map((type) => buildingTypeLabels[type]),
  ]
  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">District Analysis Desk</p>
          <h1>{model.selectedDistrict} 區域行情分析台</h1>
          <p className="site-hero-lead">
            先看區域價格定位，再看趨勢圖和房型分布。這一段的重點是快速判斷這一區值不值得繼續往下看。
          </p>
        </div>
        <label className="district-picker">
          <span>切換分析行政區</span>
          <select value={model.selectedDistrict} onChange={(event) => model.setSelectedDistrict(event.target.value)}>
            {model.availableDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="metric-grid">
        <MetricCard label="區域中位數價格" value={`${formatPrice(model.scenarioDistrictOverview?.price)} 萬/坪`} helper="先看這區常見價格" accent="blue" />
        <MetricCard label="區域趨勢方向" value={<TrendBadge value={model.scenarioDistrictOverview?.yoy} />} helper="快速看最近漲跌" accent="amber" />
        <MetricCard label="近一年平均總價" value={model.districtTotalPriceBand.label} helper="用近一年成交資料算出的平均總價" accent="slate" />
        <MetricCard label="區域成交筆數" value={`${model.scenarioDistrictOverview?.volume ?? '-'} 筆`} helper="筆數越多，代表這區越熱" accent="slate" />
        <MetricCard label="主力房型" value={model.scenarioRoomMix[0]?.name ?? '-'} helper="先看這區主要成交哪一種房型" accent="green" />
      </div>
      <section className="panel scenario-panel">
        <div className="panel-head compact">
          <div>
            <h3 className="panel-title-with-hint">
              <span>區域趨勢篩選器</span>
              <HintBadge text="下面的價格趨勢會依照你選的時間、產品和建物型態一起更新。" />
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

      <section className="dashboard-grid">
        <ChartCard title="區域價格趨勢" subtitle="先看這一區最近是變貴、變便宜，還是大致持平。">
          <div className="panel-filter-row">
            <HintBadge text="統計方式：依目前篩選條件，按時間區間計算區域中位數價格與成交筆數。" />
          </div>
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

        <DataBreakdownCard title="區域房型分布" subtitle="直接看成交數量，不用圓餅圖。" items={roomMixItems} />
      </section>

      <section className="panel data-breakdown-card">
        <div className="panel-head">
          <div>
            <h3>這一區值得先看的社區</h3>
            <p>先從成交筆數較多、資料較完整的社區往下看，判價會更快。</p>
          </div>
        </div>
        {topProjects.length > 0 ? (
          <div className="simple-list">
            {topProjects.map((project) => (
              <button
                key={project.name}
                type="button"
                className="simple-list-item"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('tainanspot:open-project', {
                      detail: { projectName: project.name },
                    }),
                  )
                  onJump('community')
                }}
              >
                <div>
                  <strong>{project.name}</strong>
                  <p>{project.volume} 筆成交</p>
                </div>
                <span>{formatPrice(project.medianPrice)} 萬/坪</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">目前這個行政區在目前篩選條件下沒有可分析的社區。</div>
        )}
      </section>
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
            這一段只說明三件事：資料從哪裡來、價格怎麼算、哪些資料會被排除。
          </p>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>資料來源</h3>
              <p>目前以內政部實價登錄公開資料為主，也支援把 CSV 整理進 GitHub 共用資料檔。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 可自動讀取 `public` 裡的房價資料檔。</p>
            <p>2. 也可以把很多期 `CSV` 放進 repo 的 `data/raw/`。</p>
            <p>3. 重新建置後會整理成行政區、社區和時間趨勢，所有人看到同一份資料。</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>價格怎麼整理</h3>
              <p>網站會先整理資料，再算出每一區和每個社區的中位數價格、成交筆數和趨勢。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 會先去掉重複資料。</p>
            <p>2. 會扣掉部分特殊交易。</p>
            <p>3. 會依照你選的條件重新計算結果。</p>
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>哪些資料可能被排除</h3>
              <p>有些資料會因為太特殊，不適合拿來當一般市場參考。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 親友交易或特殊關係交易。</p>
            <p>2. 地下室、一樓或部分特殊物件。</p>
            <p>3. 內容明顯異常或重複的資料。</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>使用提醒</h3>
              <p>這個網站適合拿來快速了解市場，但不能代替實際看屋和專業判斷。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 數字會因資料更新時間而改變。</p>
            <p>2. 單一物件還要看樓層、裝潢、位置和屋況。</p>
            <p>3. 真正出價前，還是建議請專業房仲一起判讀。</p>
          </div>
        </section>
      </div>
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

  const openProject = (projectName) => {
    setSelectedProjectName(projectName)
    setTimeout(() => scrollToSection('community'), 0)
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
        <section id="overview">
          <HomePage model={model} onJump={scrollToSection} />
        </section>

        <section id="district">
          <DistrictPage model={model} onJump={scrollToSection} />
        </section>

        <section id="community" className="single-page-section">
          {projectDetail ? (
            <Suspense fallback={<section className="panel"><p>正在載入社區資料...</p></section>}>
              <LazyProjectDetailView detail={projectDetail} onBack={() => scrollToSection('district')} />
            </Suspense>
          ) : (
            <section className="panel empty-state-panel">
              <div className="panel-head">
                <div>
                  <h3>社區判價分析台</h3>
                  <p>從上面的社區清單點一個社區，這裡就會顯示它的價格趨勢、樓層差異和交易明細。</p>
                </div>
              </div>
            </section>
          )}
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

        <section id="about" className="single-page-section">
          <AboutPage />
        </section>
      </main>
    </div>
  )
}
