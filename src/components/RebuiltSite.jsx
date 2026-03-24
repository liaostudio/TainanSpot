import { useMemo, useState } from 'react'
import {
  BarChart3,
  Building2,
  FileText,
  Layers3,
  MapPinned,
  Search,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ComposedChart,
  Line,
} from 'recharts'
import { useDashboardModel } from '../hooks/useDashboardModel.js'
import { timeTabs, tainanGrid } from '../data/dashboardData.js'
import { buildingTypeLabels, tradeTargetLabels } from './siteLabels.js'
import { DataBreakdownCard, SampleStatusTag } from './siteShared.jsx'
import { MetricCard } from './MetricCard.jsx'
import { ChartCard } from './ChartCard.jsx'
import { TrendBadge } from './TrendBadge.jsx'
import { HintBadge } from './HintBadge.jsx'
import { formatPrice, heatColor } from '../utils/dashboard.js'

const navItems = [
  { id: 'home', label: '首頁', icon: Building2 },
  { id: 'regional', label: '區域總覽', icon: MapPinned },
  { id: 'product', label: '產品類型分析', icon: Layers3 },
  { id: 'filters', label: '條件篩選', icon: Search },
  { id: 'about', label: '資料說明', icon: FileText },
]

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function SiteHeader() {
  return (
    <header className="rebuild-header">
      <div className="rebuild-header-inner">
        <button type="button" className="rebuild-brand" onClick={() => scrollToSection('home')}>
          <Building2 size={20} />
          <span>TainanSpot</span>
        </button>
        <nav className="rebuild-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} type="button" className="rebuild-nav-link" onClick={() => scrollToSection(item.id)}>
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

function SectionIntro({ eyebrow, title, description, actions }) {
  return (
    <section className="rebuild-section-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? <div className="rebuild-intro-actions">{actions}</div> : null}
    </section>
  )
}

function ModuleEntryCard({ title, text, onClick }) {
  return (
    <button type="button" className="module-entry-card" onClick={onClick}>
      <strong>{title}</strong>
      <p>{text}</p>
      <span>進入</span>
    </button>
  )
}

function HomeSection({ model }) {
  const quickDistricts = model.availableDistricts.slice(0, 8)

  return (
    <div className="rebuild-stack">
      <section className="rebuild-hero">
        <div className="rebuild-hero-copy">
          <p className="eyebrow">首頁</p>
          <h1>看懂實價登錄成交資料，從條件比較開始</h1>
          <p>
            用區域、交易標的、建物型態、坪數、屋齡、格局、樓層與車位條件，整理你真正看得懂的成交資訊。
          </p>
          <p className="rebuild-muted">
            本網站分析內容僅依據已匯入的實價登錄成交資料欄位，不包含開價、生活機能或外部市場資訊。
          </p>
          <div className="rebuild-hero-actions">
            <button type="button" className="rebuild-primary-btn" onClick={() => scrollToSection('filters')}>
              直接開始篩選
            </button>
            <button type="button" className="rebuild-secondary-btn" onClick={() => scrollToSection('regional')}>
              先看區域總覽
            </button>
          </div>
        </div>
        <div className="rebuild-hero-side">
          <div className="rebuild-note-card">
            <span>最新資料</span>
            <strong>{model.latestDataDate || '-'}</strong>
            <p>{model.isRealMode ? '依已匯入成交資料分析' : '目前為展示資料模式'}</p>
          </div>
          <div className="rebuild-note-card">
            <span>分析原則</span>
            <strong>先看分布</strong>
            <p>先看資料落在哪裡，再看單一數值，避免不同產品混在一起判讀。</p>
          </div>
        </div>
      </section>

      <section className="rebuild-grid-3">
        <ModuleEntryCard title="區域總覽" text="比較各行政區成交件數、總價與單價輪廓，再進單區分析。" onClick={() => scrollToSection('regional')} />
        <ModuleEntryCard title="產品類型分析" text="先分開看土地、建物、房地，再比較產品類型與建物型態。" onClick={() => scrollToSection('product')} />
        <ModuleEntryCard title="條件篩選" text="用區域、產品、坪數、屋齡、樓層與車位條件找出接近需求的樣本。" onClick={() => scrollToSection('filters')} />
      </section>

      <section className="rebuild-grid-2">
        <DataBreakdownCard
          title="本網站可分析的資料範圍"
          subtitle="以下都直接來自已匯入的實價登錄欄位，不另外加入外部資料。"
          items={[
            { name: '區域', value: '行政區 / 鄉鎮市區' },
            { name: '產品', value: '交易標的 / 產品類型 / 建物型態' },
            { name: '空間', value: '坪數 / 屋齡 / 格局 / 樓層 / 車位' },
            { name: '價格', value: '總價 / 單價 / 成交件數' },
            { name: '提醒', value: '備註 / 特殊樣本標示' },
          ]}
        />
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>快速區域入口</h3>
              <p>如果你已經知道想先看哪一區，可以直接進區域總覽。</p>
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
                  scrollToSection('regional')
                }}
              >
                {district}
              </button>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}

function RegionalSection({ model }) {
  const totalPriceChartRows = [...model.regionalOverviewRows]
    .filter((row) => row.medianTotalPrice > 0)
    .sort((a, b) => b.medianTotalPrice - a.medianTotalPrice)
    .slice(0, 12)
  const unitPriceChartRows = [...model.regionalOverviewRows]
    .filter((row) => row.price > 0)
    .sort((a, b) => b.price - a.price)
    .slice(0, 12)

  return (
    <div className="rebuild-stack">
      <SectionIntro
        eyebrow="區域總覽"
        title="先看各區比較，再進單區分析"
        description="先比較台南各行政區成交件數、中位數總價與中位數價格，再切到單一行政區看分布與趨勢。"
        actions={
          <label className="rebuild-inline-select">
            <span>目前行政區</span>
            <select value={model.selectedDistrict} onChange={(event) => model.setSelectedDistrict(event.target.value)}>
              {model.availableDistricts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </label>
        }
      />

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>區域分析條件</h3>
            <p>區域總覽、跨區比較、單區分布與趨勢都會一起跟著更新。</p>
          </div>
        </div>
        <div className="rebuild-filter-grid">
          <div>
            <span className="filter-label">時間區間</span>
            <div className="time-tabs compact">
              {timeTabs.map((tab) => (
                <button key={tab.id} type="button" className={tab.id === model.districtActiveTab ? 'is-active' : ''} onClick={() => model.setDistrictActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="filter-label">產品類型</span>
            <div className="chip-row">
              <button type="button" className={model.propertyTypeFilter.includes('existing') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('existing')}>中古屋</button>
              <button type="button" className={model.propertyTypeFilter.includes('presale') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('presale')}>預售屋</button>
            </div>
          </div>
          <div>
            <span className="filter-label">建物型態</span>
            <div className="chip-row">
              {Object.entries(buildingTypeLabels).map(([key, label]) => (
                <button key={key} type="button" className={model.buildingFilter.includes(key) ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType(key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ChartCard
        title="行政區價格熱圖"
        subtitle="依目前篩選條件下各行政區的中位數價格著色。點行政區可切換單區分析。"
      >
        <div className="heatmap">
          {tainanGrid.map((cell) => {
            const overview = model.realOverviews.find((item) => item.name === cell.id)
            const selected = model.selectedDistrict === cell.id
            return (
              <button
                key={cell.id}
                type="button"
                className={`heat-cell ${heatColor(overview?.price, model.minPrice, model.maxPrice)} ${selected ? 'selected' : ''}`}
                style={{ gridColumn: cell.c, gridRow: cell.r }}
                onClick={() => model.availableDistricts.includes(cell.id) && model.setSelectedDistrict(cell.id)}
              >
                <strong>{cell.id}</strong>
                <span>{overview ? `${formatPrice(overview.price)}萬/坪` : '無資料'}</span>
              </button>
            )
          })}
        </div>
      </ChartCard>

      <section className="rebuild-grid-2">
        <ChartCard title="各區中位數總價比較" subtitle="先看主流成交總價高低，建立跨區總價輪廓。">
          <div className="chart-wrap medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalPriceChartRows} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e0d6" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="district" type="category" width={64} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} 萬`, '中位數總價']} />
                <Bar dataKey="medianTotalPrice" fill="#c99041" radius={[0, 8, 8, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="各區中位數單價比較" subtitle="再看各區常見單價位置，建立跨區單價輪廓。">
          <div className="chart-wrap medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitPriceChartRows} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e0d6" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="district" type="category" width={64} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [`${formatPrice(value)} 萬/坪`, '中位數價格']} />
                <Bar dataKey="price" fill="#2155c8" radius={[0, 8, 8, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>各區成交概況</h3>
            <p>這一張表先回答哪些區成交比較多、總價大約在哪裡、單價位置在哪裡。</p>
          </div>
        </div>
        <div className="table-shell">
          <table className="records-table">
            <thead>
              <tr>
                <th>行政區</th>
                <th>成交件數</th>
                <th>中位數總價</th>
                <th>中位數價格</th>
                <th>趨勢方向</th>
              </tr>
            </thead>
            <tbody>
              {model.regionalOverviewRows.map((row) => (
                <tr key={row.district}>
                  <td>
                    <button type="button" className="inline-link-button" onClick={() => model.setSelectedDistrict(row.district)}>
                      {row.district}
                    </button>
                  </td>
                  <td>{row.volume.toLocaleString()} 筆</td>
                  <td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice.toLocaleString()} 萬` : '-'}</td>
                  <td>{formatPrice(row.price)} 萬/坪</td>
                  <td><TrendBadge value={row.yoy} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard label="區域成交件數" value={`${model.scenarioDistrictOverview?.volume ?? '-'} 筆`} helper="目前行政區的成交樣本數" accent="blue" showHint={false} />
        <MetricCard label="區域中位數價格" value={`${formatPrice(model.scenarioDistrictOverview?.price)} 萬/坪`} helper="目前行政區的常見單價" accent="amber" showHint={false} />
        <MetricCard label="近一年平均總價" value={model.districtTotalPriceBand.label} helper="近 12 個月成交資料" accent="slate" showHint={false} />
        <MetricCard label="主力房型" value={model.scenarioRoomMix[0]?.name ?? '-'} helper="目前行政區成交最多的房型" accent="green" showHint={false} />
      </div>

      <section className="rebuild-grid-3">
        <DataBreakdownCard title={<><span>總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看所選行政區成交總價主要落在哪些價格帶。" items={model.districtTotalPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
        <DataBreakdownCard title={<><span>單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看所選行政區單價主要落在哪些區間。" items={model.districtUnitPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
        <DataBreakdownCard title="建物型態概況" subtitle="看所選行政區目前成交樣本主要是哪種建物型態。" items={model.districtBuildingTypeMix.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
      </section>

      <ChartCard title={<><span>區域價格趨勢</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="依時間區間計算該區中位數價格與成交筆數。">
        <div className="chart-wrap large">
          {model.scenarioDistrictTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={model.scenarioDistrictTrend} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e0d6" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="volume" fill="#edc57c" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                <Line yAxisId="right" dataKey="price" stroke="#2155c8" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">目前篩選條件下沒有可顯示的區域趨勢資料。</div>
          )}
        </div>
      </ChartCard>
    </div>
  )
}

function ProductSection({ model, productSubview, setProductSubview }) {
  const tradeTargets =
    model.tradeTargetFilter.includes('all') ? ['全部交易標的'] : model.tradeTargetFilter

  return (
    <div className="rebuild-stack">
      <SectionIntro
        eyebrow="產品類型分析"
        title="先分開產品，再比較價格"
        description="先選土地交易分析或建物 / 房地分析，再看分布、再看中位數與比較表。"
      />

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>分析子模組</h3>
            <p>土地與建物不直接混比，先分路徑再分析。</p>
          </div>
        </div>
        <div className="analysis-subnav">
          <button type="button" className={productSubview === 'land' ? 'analysis-subnav-button is-active' : 'analysis-subnav-button'} onClick={() => setProductSubview('land')}>
            <strong>土地交易分析</strong>
            <span>土地成交件數、總價、單價、土地坪數與各區比較</span>
          </button>
          <button type="button" className={productSubview === 'building' ? 'analysis-subnav-button is-active' : 'analysis-subnav-button'} onClick={() => setProductSubview('building')}>
            <strong>建物 / 房地分析</strong>
            <span>交易標的、產品類型、建物型態與價格分布</span>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>產品分析條件</h3>
            <p>交易標的會決定下面是走土地口徑還是建物口徑。</p>
          </div>
        </div>
        <div className="rebuild-filter-grid">
          <div>
            <span className="filter-label">交易標的</span>
            <div className="chip-row">
              <button type="button" className={model.tradeTargetFilter.includes('all') ? 'chip active' : 'chip'} onClick={() => model.toggleTradeTarget('all')}>全部</button>
              {Object.entries(tradeTargetLabels).map(([key, label]) => (
                <button key={key} type="button" className={model.tradeTargetFilter.includes(key) ? 'chip active' : 'chip'} onClick={() => model.toggleTradeTarget(key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {!model.isLandOnlyMode && (
            <>
              <div>
                <span className="filter-label">產品類型</span>
                <div className="chip-row">
                  <button type="button" className={model.propertyTypeFilter.includes('existing') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('existing')}>中古屋</button>
                  <button type="button" className={model.propertyTypeFilter.includes('presale') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('presale')}>預售屋</button>
                </div>
              </div>
              <div>
                <span className="filter-label">建物型態</span>
                <div className="chip-row">
                  {Object.entries(buildingTypeLabels).map(([key, label]) => (
                    <button key={key} type="button" className={model.buildingFilter.includes(key) ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType(key)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="panel-inline-hint">
          <HintBadge text={`目前已套用交易標的：${tradeTargets.join(' / ')}。`} />
        </div>
      </section>

      {productSubview === 'land' ? (
        <>
          <section className="rebuild-grid-3">
            <DataBreakdownCard title={<><span>土地總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="先看土地成交總價主要落在哪些區間。" items={model.landPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
            <DataBreakdownCard title={<><span>土地單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="再看土地單價主要落在哪些區間。" items={model.landUnitPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
            <DataBreakdownCard title={<><span>土地面積分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="最後看土地坪數主要落在哪些範圍。" items={model.landPingDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
          </section>

          <div className="metric-grid">
            <MetricCard label="土地成交件數" value={`${model.landAnalysisSummary.volume.toLocaleString()} 筆`} helper="目前條件下土地成交樣本數" accent="blue" showHint={false} />
            <MetricCard label="土地總價中位數" value={model.landAnalysisSummary.medianTotalPrice > 0 ? `${model.landAnalysisSummary.medianTotalPrice} 萬` : '-'} helper="土地總價中位數" accent="amber" showHint={false} />
            <MetricCard label="土地單價中位數" value={model.landAnalysisSummary.medianUnitPrice > 0 ? `${formatPrice(model.landAnalysisSummary.medianUnitPrice)} 萬/坪` : '-'} helper="土地單價中位數" accent="slate" showHint={false} />
            <MetricCard label="平均土地坪數" value={model.landAnalysisSummary.avgPing > 0 ? `${model.landAnalysisSummary.avgPing} 坪` : '-'} helper="土地平均坪數" accent="green" showHint={false} />
          </div>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>各行政區土地比較</h3>
                <p>分布看完之後，再回來比較各區土地成交位置。</p>
              </div>
            </div>
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
          </section>
        </>
      ) : (
        <>
          <section className="rebuild-grid-3">
            <DataBreakdownCard title={<><span>坪數分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="先看樣本主要落在哪些坪數帶。" items={model.productPingDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
            <DataBreakdownCard title={<><span>總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="再看樣本主要落在哪些總價帶。" items={model.productTotalPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
            <DataBreakdownCard title={<><span>單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="最後看樣本主要落在哪些單價帶。" items={model.productUnitPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
          </section>

          <div className="metric-grid">
            <MetricCard label="樣本件數" value={`${model.productAnalysisSummary.volume.toLocaleString()} 筆`} helper="目前分析樣本數" accent="blue" showHint={false} />
            <MetricCard label="總價中位數" value={model.productAnalysisSummary.medianTotalPrice > 0 ? `${model.productAnalysisSummary.medianTotalPrice} 萬` : '-'} helper="總價中位數" accent="amber" showHint={false} />
            <MetricCard label="單價中位數" value={model.productAnalysisSummary.medianUnitPrice > 0 ? `${formatPrice(model.productAnalysisSummary.medianUnitPrice)} 萬/坪` : '-'} helper="單價中位數" accent="slate" showHint={false} />
            <MetricCard label="平均建坪" value={model.productAnalysisSummary.avgPing > 0 ? `${model.productAnalysisSummary.avgPing} 坪` : '-'} helper="平均建坪" accent="green" showHint={false} />
          </div>

          <section className="rebuild-grid-3">
            <section className="panel">
              <div className="panel-head"><div><h3>交易標的比較</h3><p>再比較不同交易標的的成交位置。</p></div></div>
              <div className="table-shell">
                <table className="records-table">
                  <thead><tr><th>交易標的</th><th>成交件數</th><th>總價中位數</th><th>單價中位數</th><th>平均面積</th></tr></thead>
                  <tbody>{model.tradeTargetAnalysisRows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.volume.toLocaleString()} 筆</td><td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice} 萬` : '-'}</td><td>{row.medianUnitPrice > 0 ? `${formatPrice(row.medianUnitPrice)} 萬/坪` : '-'}</td><td>{row.avgPing > 0 ? `${row.avgPing} 坪` : '-'}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
            <section className="panel">
              <div className="panel-head"><div><h3>產品類型比較</h3><p>再比較中古屋與預售屋的成交位置。</p></div></div>
              <div className="table-shell">
                <table className="records-table">
                  <thead><tr><th>產品類型</th><th>成交件數</th><th>總價中位數</th><th>單價中位數</th><th>平均建坪</th></tr></thead>
                  <tbody>{model.productTypeAnalysisRows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.volume.toLocaleString()} 筆</td><td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice} 萬` : '-'}</td><td>{row.medianUnitPrice > 0 ? `${formatPrice(row.medianUnitPrice)} 萬/坪` : '-'}</td><td>{row.avgPing > 0 ? `${row.avgPing} 坪` : '-'}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
            <section className="panel">
              <div className="panel-head"><div><h3>建物型態比較</h3><p>最後比較大樓、公寓、透天等型態差異。</p></div></div>
              <div className="table-shell">
                <table className="records-table">
                  <thead><tr><th>建物型態</th><th>成交件數</th><th>總價中位數</th><th>單價中位數</th><th>平均建坪</th></tr></thead>
                  <tbody>{model.buildingTypeAnalysisRows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.volume.toLocaleString()} 筆</td><td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice} 萬` : '-'}</td><td>{row.medianUnitPrice > 0 ? `${formatPrice(row.medianUnitPrice)} 萬/坪` : '-'}</td><td>{row.avgPing > 0 ? `${row.avgPing} 坪` : '-'}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          </section>
        </>
      )}
    </div>
  )
}

function FilterSection({ model, onOpenRecord, activeRecordKey }) {
  const specialCount = model.filterPageRecords.filter((record) => record.isSpecialSample).length

  return (
    <div className="rebuild-stack">
      <SectionIntro
        eyebrow="條件篩選"
        title="把成交資料縮小到接近需求的樣本"
        description="用區域、交易標的、產品類型、建物型態、坪數、屋齡、樓層與車位條件，找到更接近需求的成交資料。"
      />

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>篩選條件</h3>
            <p>條件一致，才適合拿來比較。</p>
          </div>
        </div>
        <div className="rebuild-filter-grid">
          <label className="rebuild-inline-select">
            <span>行政區</span>
            <select value={model.filterDistrict} onChange={(event) => model.setFilterDistrict(event.target.value)}>
              <option value="all">全台南</option>
              {model.availableDistricts.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </label>
          <div>
            <span className="filter-label">交易標的</span>
            <div className="chip-row">
              <button type="button" className={model.tradeTargetFilter.includes('all') ? 'chip active' : 'chip'} onClick={() => model.toggleTradeTarget('all')}>全部</button>
              {Object.entries(tradeTargetLabels).map(([key, label]) => (
                <button key={key} type="button" className={model.tradeTargetFilter.includes(key) ? 'chip active' : 'chip'} onClick={() => model.toggleTradeTarget(key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="filter-label">時間區間</span>
            <div className="time-tabs compact">
              {timeTabs.map((tab) => (
                <button key={tab.id} type="button" className={tab.id === model.districtActiveTab ? 'is-active' : ''} onClick={() => model.setDistrictActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {!model.isLandOnlyMode && (
            <>
              <div>
                <span className="filter-label">產品類型</span>
                <div className="chip-row">
                  <button type="button" className={model.propertyTypeFilter.includes('existing') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('existing')}>中古屋</button>
                  <button type="button" className={model.propertyTypeFilter.includes('presale') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('presale')}>預售屋</button>
                </div>
              </div>
              <div>
                <span className="filter-label">建物型態</span>
                <div className="chip-row">
                  {Object.entries(buildingTypeLabels).map(([key, label]) => (
                    <button key={key} type="button" className={model.buildingFilter.includes(key) ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType(key)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div>
            <span className="filter-label">坪數區間</span>
            <div className="range-input-row">
              <input type="number" min="0" placeholder="最小坪數" value={model.filterPingMin} onChange={(event) => model.setFilterPingMin(event.target.value)} />
              <span>~</span>
              <input type="number" min="0" placeholder="最大坪數" value={model.filterPingMax} onChange={(event) => model.setFilterPingMax(event.target.value)} />
            </div>
          </div>
          {!model.isLandOnlyMode && (
            <>
              <div>
                <span className="filter-label">房數</span>
                <div className="chip-row">
                  {['all', '1', '2', '3', '4+'].map((value) => (
                    <button key={value} type="button" className={model.filterRoomCount === value ? 'chip active' : 'chip'} onClick={() => model.setFilterRoomCount(value)}>
                      {value === 'all' ? '全部' : value === '4+' ? '4房以上' : `${value}房`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="filter-label">屋齡</span>
                <div className="chip-row">
                  {[
                    ['all', '全部'],
                    ['0-5', '0-5年'],
                    ['6-15', '6-15年'],
                    ['16-30', '16-30年'],
                    ['30+', '30年以上'],
                  ].map(([value, label]) => (
                    <button key={value} type="button" className={model.filterAgeRange === value ? 'chip active' : 'chip'} onClick={() => model.setFilterAgeRange(value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="filter-label">車位</span>
                <div className="chip-row">
                  {[
                    ['all', '全部'],
                    ['yes', '有車位'],
                    ['no', '無車位'],
                  ].map(([value, label]) => (
                    <button key={value} type="button" className={model.filterParking === value ? 'chip active' : 'chip'} onClick={() => model.setFilterParking(value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="filter-label">樓層</span>
                <div className="chip-row">
                  {[
                    ['all', '全部'],
                    ['low', '低樓層'],
                    ['mid', '中樓層'],
                    ['high', '高樓層'],
                  ].map(([value, label]) => (
                    <button key={value} type="button" className={model.filterFloorType === value ? 'chip active' : 'chip'} onClick={() => model.setFilterFloorType(value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div>
            <span className="filter-label">特殊樣本</span>
            <div className="chip-row">
              <button type="button" className={!model.includeSpecialSamples ? 'chip active' : 'chip'} onClick={() => model.setIncludeSpecialSamples(false)}>排除特殊交易</button>
              <button type="button" className={model.includeSpecialSamples ? 'chip active' : 'chip'} onClick={() => model.setIncludeSpecialSamples(true)}>納入特殊交易</button>
            </div>
          </div>
        </div>
      </section>

      <section className={`panel ${model.includeSpecialSamples ? 'special-sample-panel' : ''}`}>
        <div className="panel-head compact">
          <div>
            <h3>特殊樣本狀態</h3>
            <p>{model.includeSpecialSamples ? `目前結果已納入特殊樣本，共 ${specialCount.toLocaleString()} 筆。` : '目前結果已排除特殊樣本，較適合作為一般市場比較基準。'}</p>
          </div>
        </div>
      </section>

      <section className="rebuild-grid-2">
        <DataBreakdownCard title={<><span>總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="先看篩選結果主要落在哪些總價區間。" items={model.filterPageTotalPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
        <DataBreakdownCard title={<><span>單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="再看篩選結果主要落在哪些單價區間。" items={model.filterPageUnitPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
      </section>

      <div className="metric-grid">
        <MetricCard label="篩選後件數" value={`${model.filterPageSummary.volume.toLocaleString()} 筆`} helper="篩選後的成交樣本數" accent="blue" showHint={false} />
        <MetricCard label="總價中位數" value={model.filterPageSummary.medianTotalPrice > 0 ? `${model.filterPageSummary.medianTotalPrice} 萬` : '-'} helper="篩選後總價中位數" accent="amber" showHint={false} />
        <MetricCard label="單價中位數" value={model.filterPageSummary.medianPrice > 0 ? `${formatPrice(model.filterPageSummary.medianPrice)} 萬/坪` : '-'} helper="篩選後單價中位數" accent="slate" showHint={false} />
        <MetricCard label={model.isLandOnlyMode ? '平均土地坪數' : '平均建坪'} value={model.filterPageSummary.avgPing > 0 ? `${model.filterPageSummary.avgPing} 坪` : '-'} helper="篩選後平均面積" accent="green" showHint={false} />
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>成交結果列表</h3>
            <p>從這裡進入單筆成交明細頁。</p>
          </div>
        </div>
        <div className="table-shell">
          <table className="records-table">
            <thead>
              <tr>
                <th>交易年月</th>
                <th>位置 / 社區</th>
                <th>交易標的</th>
                <th>建物型態</th>
                <th>{model.isLandOnlyMode ? '土地坪數' : '建坪'}</th>
                <th>總價</th>
                <th>單價</th>
              </tr>
            </thead>
            <tbody>
              {model.filterPageRecords.slice(0, 40).map((record) => (
                <tr key={record.key} id={`record-row-${record.key}`} className={activeRecordKey === record.key ? 'is-active-row' : ''}>
                  <td>{record.year} / {String(record.month).padStart(2, '0')}</td>
                  <td>
                    <button type="button" className="inline-link-button" onClick={() => onOpenRecord(record.key)}>
                      {record.locationName || record.projectName || record.address || '-'}
                    </button>
                    {record.isSpecialSample ? <span className="sample-flag">特殊樣本</span> : null}
                  </td>
                  <td>{record.tradeTarget || '-'}</td>
                  <td>{record.buildType || '-'}</td>
                  <td>{record.totalPing || record.landPing ? `${Number(record.totalPing || record.landPing).toFixed(1)} 坪` : '-'}</td>
                  <td>{record.totalPrice ? `${Math.round(record.totalPrice / 10000)} 萬` : '-'}</td>
                  <td>{record.unitPricePing ? `${formatPrice(record.unitPricePing)} 萬/坪` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function DetailSection({ record, onPrev, onNext, hasPrev, hasNext, onBack }) {
  if (!record) {
    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>成交明細</h3>
            <p>請先從條件篩選結果列表點一筆成交，這裡才會顯示單筆詳細資料。</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="rebuild-stack">
      <SectionIntro
        eyebrow="成交明細"
        title="單筆成交詳細資料"
        description="這一頁只呈現單筆成交本身，不做推測，讓你直接看清楚主資料、空間條件、車位資訊與備註提醒。"
        actions={
          <div className="rebuild-intro-actions">
            <button type="button" className="rebuild-secondary-btn" onClick={onBack}>回到條件篩選</button>
            <button type="button" className="rebuild-secondary-btn" onClick={onPrev} disabled={!hasPrev}>前一筆</button>
            <button type="button" className="rebuild-secondary-btn" onClick={onNext} disabled={!hasNext}>下一筆</button>
          </div>
        }
      />

      <div className="metric-grid">
        <MetricCard label="交易日期" value={`${record.year} / ${String(record.month).padStart(2, '0')}`} helper="交易年月" accent="blue" showHint={false} />
        <MetricCard label="交易標的" value={record.tradeTarget || '-'} helper="原始交易標的欄位" accent="amber" showHint={false} />
        <MetricCard label="總價" value={record.totalPrice ? `${Math.round(record.totalPrice / 10000)} 萬` : '-'} helper="成交總價" accent="slate" showHint={false} />
        <MetricCard label="單價" value={record.unitPricePing ? `${formatPrice(record.unitPricePing)} 萬/坪` : '-'} helper="成交單價" accent="green" showHint={false} />
      </div>

      <section className={`panel ${record.isSpecialSample ? 'special-sample-panel' : ''}`}>
        <div className="panel-head compact">
          <div>
            <h3>樣本狀態</h3>
            <p>{record.isSpecialSample ? '這筆成交屬於特殊樣本，判讀時不建議直接視為一般市場行情。' : '這筆成交未被標記為特殊樣本。'}</p>
          </div>
        </div>
      </section>

      <section className="rebuild-grid-2">
        <DataBreakdownCard title="主資料" subtitle="先看這筆成交的主資料。" items={[
          { name: '行政區', value: record.district || '-' },
          { name: '交易日期', value: `${record.year} / ${String(record.month).padStart(2, '0')}` },
          { name: '總價', value: record.totalPrice ? `${Math.round(record.totalPrice / 10000)} 萬` : '-' },
          { name: '單價', value: record.unitPricePing ? `${formatPrice(record.unitPricePing)} 萬/坪` : '-' },
        ]} />
        <DataBreakdownCard title="位置與產品" subtitle="再看位置與產品條件。" items={[
          { name: '位置 / 社區', value: record.locationName || record.projectName || '-' },
          { name: '門牌 / 位置', value: record.address || '-' },
          { name: '產品類型', value: record.type === 'presale' ? '預售屋' : '中古屋' },
          { name: '建物型態', value: record.buildType || '-' },
        ]} />
        <DataBreakdownCard title="空間條件" subtitle="看坪數、格局、樓層與土地資訊。" items={[
          { name: '建坪', value: record.totalPing ? `${record.totalPing.toFixed(1)} 坪` : '-' },
          { name: '土地坪數', value: record.landPing ? `${record.landPing.toFixed(1)} 坪` : '-' },
          { name: '房數', value: record.roomCount > 0 ? `${record.roomCount} 房` : '-' },
          { name: '樓層', value: record.level || '-' },
        ]} />
        <DataBreakdownCard title="車位資訊" subtitle="車位資訊與建物價格應分開看。" items={[
          { name: '車位狀態', value: record.hasPark ? '有車位' : '無車位' },
          { name: '車位坪數', value: record.parkAreaPing ? `${record.parkAreaPing.toFixed(1)} 坪` : '-' },
          { name: '車位總價', value: record.parkPrice ? `${Math.round(record.parkPrice / 10000)} 萬` : '-' },
        ]} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>備註與判讀提醒</h3>
            <p>備註欄是判斷樣本是否適合直接拿來比較的重要依據。</p>
          </div>
        </div>
        <div className="info-list detail-note-list">
          <p><strong>備註：</strong>{record.note || '無'}</p>
          {record.isSpecialSample ? <p><strong>特殊樣本原因：</strong>{record.specialReason || '備註含特殊交易關鍵字'}</p> : null}
          <p><strong>判讀建議：</strong>車位金額與特殊備註都應獨立看，不建議直接和一般成交混在一起比較。</p>
        </div>
      </section>
    </div>
  )
}

function AboutSection() {
  return (
    <div className="rebuild-stack">
      <SectionIntro
        eyebrow="資料說明"
        title="資料方法與限制"
        description="本網站只依已匯入的實價登錄 CSV 欄位分析，不另外加入學區、交通、開價、議價率或其他外部資料。"
      />
      <section className="rebuild-grid-2">
        <DataBreakdownCard title="可分析欄位" subtitle="本階段只用目前 CSV 真正有的欄位。" items={[
          { name: '區域', value: '鄉鎮市區' },
          { name: '交易', value: '交易標的 / 交易年月日' },
          { name: '建物', value: '建物型態 / 樓層 / 屋齡 / 格局' },
          { name: '價格', value: '總價 / 單價 / 面積' },
          { name: '補充', value: '車位資訊 / 備註 / 建案名稱' },
        ]} />
        <DataBreakdownCard title="資料清理原則" subtitle="讓分析結果更穩定的基本清理流程。" items={[
          { name: '格式統一', value: '欄位、單位、樓層格式標準化' },
          { name: '屋齡計算', value: '交易年月日搭配建築完成年月' },
          { name: '車位處理', value: '車位金額與面積獨立呈現' },
          { name: '樣本提醒', value: '特殊交易與親友交易另外標示' },
          { name: '比較原則', value: '條件一致才比較' },
        ]} />
      </section>
    </div>
  )
}

export function RebuiltSite() {
  const model = useDashboardModel()
  const [selectedRecordKey, setSelectedRecordKey] = useState(null)
  const [lastRecordKey, setLastRecordKey] = useState(null)
  const [productSubview, setProductSubview] = useState('land')

  const detail = useMemo(
    () => (selectedRecordKey ? model.getTransactionDetail(selectedRecordKey) : null),
    [model, selectedRecordKey],
  )

  const currentFilterRecordIndex = useMemo(
    () => model.filterPageRecords.findIndex((record) => record.key === selectedRecordKey),
    [model.filterPageRecords, selectedRecordKey],
  )

  const prevRecordKey =
    currentFilterRecordIndex > 0 ? model.filterPageRecords[currentFilterRecordIndex - 1]?.key : null
  const nextRecordKey =
    currentFilterRecordIndex >= 0 && currentFilterRecordIndex < model.filterPageRecords.length - 1
      ? model.filterPageRecords[currentFilterRecordIndex + 1]?.key
      : null

  const openRecord = (recordKey) => {
    setLastRecordKey(recordKey)
    setSelectedRecordKey(recordKey)
    window.setTimeout(() => scrollToSection('detail'), 0)
  }

  const backToFilters = () => {
    scrollToSection('filters')
    if (!lastRecordKey) return
    window.setTimeout(() => {
      const row = document.getElementById(`record-row-${lastRecordKey}`)
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }

  return (
    <div className="rebuild-shell">
      <SiteHeader />
      <main className="rebuild-main">
        <section id="home" className="rebuild-section">
          <HomeSection model={model} />
        </section>
        <section id="regional" className="rebuild-section">
          <RegionalSection model={model} />
        </section>
        <section id="product" className="rebuild-section">
          <ProductSection model={model} productSubview={productSubview} setProductSubview={setProductSubview} />
        </section>
        <section id="filters" className="rebuild-section">
          <FilterSection model={model} onOpenRecord={openRecord} activeRecordKey={selectedRecordKey} />
        </section>
        <section id="detail" className="rebuild-section">
          <DetailSection
            record={detail}
            onBack={backToFilters}
            onPrev={() => prevRecordKey && openRecord(prevRecordKey)}
            onNext={() => nextRecordKey && openRecord(nextRecordKey)}
            hasPrev={Boolean(prevRecordKey)}
            hasNext={Boolean(nextRecordKey)}
          />
        </section>
        <section id="about" className="rebuild-section">
          <AboutSection />
        </section>
      </main>
    </div>
  )
}
