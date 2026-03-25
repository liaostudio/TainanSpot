import { useMemo, useState } from 'react'
import {
  Building2,
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
import { timeTabs } from '../data/dashboardData.js'
import { buildingTypeLabels, tradeTargetLabels } from './siteLabels.js'
import { DataBreakdownCard, SampleStatusTag } from './siteShared.jsx'
import { MetricCard } from './MetricCard.jsx'
import { ChartCard } from './ChartCard.jsx'
import { TrendBadge } from './TrendBadge.jsx'
import { HintBadge } from './HintBadge.jsx'
import { formatPrice } from '../utils/dashboard.js'

const navItems = [
  { id: 'home', label: '首頁', icon: Building2 },
  { id: 'regional', label: '區域總覽', icon: MapPinned },
  { id: 'filters', label: '條件篩選', icon: Search },
  { id: 'detail', label: '成交明細', icon: Search },
]

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function getTimeRangeLabel(timeTab) {
  if (timeTab === '1y') return '1 年'
  if (timeTab === '3y') return '3 年'
  if (timeTab === '5y') return '5 年'
  return '10 年'
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
              <button
                key={item.id}
                type="button"
                className="rebuild-nav-link"
                onClick={() => scrollToSection(item.id)}
              >
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
      <small>分析模組</small>
      <strong>{title}</strong>
      <p>{text}</p>
      <span>查看模組</span>
    </button>
  )
}

function HomeSection({ model }) {
  const quickDistricts = model.availableDistricts.slice(0, 8)
  const homeStats = [
    {
      label: '資料期間',
      value: model.latestDataDate || '-',
      helper: model.isRealMode ? '依已匯入成交資料統計' : '目前顯示展示資料',
    },
    {
      label: '全市單價中位數',
      value: model.citySummary?.price ? `${formatPrice(model.citySummary.price)} 萬/坪` : '-',
      helper: '依最新年度全市成交樣本統計',
    },
    {
      label: '成交件數',
      value: model.citySummary?.volume ? `${model.citySummary.volume.toLocaleString()} 筆` : '-',
      helper: '依最新年度全市成交樣本統計',
    },
  ]

  return (
    <div className="rebuild-stack">
      <section className="rebuild-hero">
        <div className="rebuild-hero-copy">
          <p className="eyebrow">首頁</p>
          <h1>實價登錄成交資料分析</h1>
          <p>
            提供區域、交易標的、建物型態、坪數、屋齡、格局、樓層與車位條件的成交資料整理與比較。
          </p>
          <p className="rebuild-muted">
            本網站分析內容僅依據已匯入之實價登錄成交資料欄位，不包含開價、生活機能或其他外部市場資訊。
          </p>
          <div className="rebuild-hero-actions">
            <button type="button" className="rebuild-primary-btn" onClick={() => scrollToSection('filters')}>
              進入條件篩選
            </button>
            <button type="button" className="rebuild-secondary-btn" onClick={() => scrollToSection('regional')}>
              查看區域總覽
            </button>
          </div>
          <div className="hero-quick-stats">
            {homeStats.map((item) => (
              <article key={item.label} className="hero-quick-stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.helper}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="rebuild-hero-side">
          <div className="rebuild-note-card">
            <span>最新資料</span>
            <strong>{model.latestDataDate || '-'}</strong>
            <p>{model.isRealMode ? '依已匯入成交資料統計' : '目前顯示展示資料'}</p>
          </div>
          <div className="rebuild-note-card">
            <span>分析原則</span>
            <strong>先看分布，再看統計值</strong>
            <p>建議先檢視資料分布，再參考單一統計值，避免不同產品或條件混合判讀。</p>
          </div>
        </div>
      </section>

      <section className="rebuild-grid-2">
        <ModuleEntryCard title="區域總覽" text="提供各行政區成交件數、總價與單價的比較，並支援單一行政區進一步檢視。" onClick={() => scrollToSection('regional')} />
        <ModuleEntryCard title="條件篩選" text="依區域、產品、坪數、屋齡、樓層與車位條件篩選成交樣本。" onClick={() => scrollToSection('filters')} />
      </section>

      <section className="rebuild-grid-2">
        <DataBreakdownCard
          title="本網站可分析的資料範圍"
          subtitle="以下內容均依據已匯入之實價登錄欄位整理，不另行加入外部資料。"
          items={[
            { name: '區域', value: '行政區 / 鄉鎮市區' },
            { name: '產品', value: '交易標的 / 建物型態' },
            { name: '空間', value: '坪數 / 屋齡 / 格局 / 樓層 / 車位' },
            { name: '價格', value: '總價 / 單價 / 成交件數' },
            { name: '提醒', value: '備註 / 特殊樣本標示' },
          ]}
        />
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>快速區域入口</h3>
              <p>可直接選擇行政區，查看該區成交資料概況。</p>
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
        title="行政區成交資料總覽"
        description="提供台南各行政區成交件數、中位數總價與單價中位數比較，並支援單一行政區分布與趨勢檢視。"
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

      <section className="rebuild-grid-2">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>各區中位數總價比較</h3>
              <p>依目前條件下最新年度成交樣本，顯示各行政區中位數總價排名。</p>
            </div>
          </div>
          <div className="table-shell">
            <table className="records-table">
              <thead>
                <tr>
                  <th>序</th>
                  <th>行政區</th>
                  <th>中位數總價</th>
                  <th>成交件數</th>
                </tr>
              </thead>
              <tbody>
                {totalPriceChartRows.map((row, index) => (
                  <tr key={row.district}>
                    <td>{index + 1}</td>
                    <td>{row.district}</td>
                    <td>{row.medianTotalPrice.toLocaleString()} 萬</td>
                    <td>{row.volume.toLocaleString()} 筆</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>各區單價中位數比較</h3>
              <p>依目前條件下最新年度成交樣本，顯示各行政區單價中位數排名。</p>
            </div>
          </div>
          <div className="table-shell">
            <table className="records-table">
              <thead>
                <tr>
                  <th>序</th>
                  <th>行政區</th>
                  <th>單價中位數</th>
                  <th>成交件數</th>
                </tr>
              </thead>
              <tbody>
                {unitPriceChartRows.map((row, index) => (
                  <tr key={row.district}>
                    <td>{index + 1}</td>
                    <td>{row.district}</td>
                    <td>{formatPrice(row.price)} 萬/坪</td>
                    <td>{row.volume.toLocaleString()} 筆</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="panel">
        <div className="panel-head">
            <div>
              <h3>各區成交概況</h3>
              <p>本表依目前條件下最新年度成交樣本整理，提供各行政區成交件數、總價與單價概況。</p>
            </div>
          </div>
        <div className="table-shell">
          <table className="records-table">
            <thead>
              <tr>
                <th>行政區</th>
                <th>成交件數</th>
                <th>中位數總價</th>
                <th>單價中位數</th>
                <th>年增率</th>
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
        <MetricCard label="區域成交件數" value={`${model.scenarioDistrictOverview?.volume ?? '-'} 筆`} helper="依目前條件下最新年度成交樣本統計" accent="blue" showHint={false} />
        <MetricCard label="區域單價中位數" value={`${formatPrice(model.scenarioDistrictOverview?.price)} 萬/坪`} helper="依目前條件下最新年度成交樣本統計" accent="amber" showHint={false} />
        <MetricCard label="總價中位數" value={model.scenarioDistrictOverview?.medianTotalPrice ? `${model.scenarioDistrictOverview.medianTotalPrice.toLocaleString()} 萬` : '-'} helper="依目前條件下最新年度成交樣本統計" accent="slate" showHint={false} />
        <MetricCard label="主力房型" value={model.scenarioRoomMix[0]?.name ?? '-'} helper="目前行政區成交最多的房型" accent="green" showHint={false} />
      </div>

      <section className="rebuild-grid-3">
        <DataBreakdownCard title={<><span>總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="顯示所選行政區成交總價主要分布區間。" items={model.districtTotalPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} emptyText="目前條件下，所選行政區無可顯示之總價分布資料。" />
        <DataBreakdownCard title={<><span>單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="顯示所選行政區成交單價主要分布區間。" items={model.districtUnitPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} emptyText="目前條件下，所選行政區無可顯示之單價分布資料。" />
        <DataBreakdownCard title="建物型態概況" subtitle="顯示所選行政區成交樣本之建物型態組成。" items={model.districtBuildingTypeMix.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} emptyText="目前條件下，所選行政區無可顯示之建物型態資料。" />
      </section>

      <ChartCard title={<><span>區域價格趨勢</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="依所選時間區間顯示該行政區單價中位數與成交件數變化。">
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
            <div className="empty-state">目前條件下無可顯示之區域趨勢資料。</div>
          )}
        </div>
      </ChartCard>
    </div>
  )
}

function FilterSection({ model, onOpenRecord, activeRecordKey }) {
  const specialCount = model.filterPageRecords.filter((record) => record.isSpecialSample).length
  const filterTimeLabel = getTimeRangeLabel(model.districtActiveTab)

  return (
    <div className="rebuild-stack">
      <SectionIntro
        eyebrow="條件篩選"
        title="成交樣本條件篩選"
        description="依區域、交易標的、產品類型、建物型態、坪數、屋齡、樓層與車位條件篩選成交樣本，並同步更新分布、摘要與結果列表。"
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
            <p>{model.includeSpecialSamples ? `目前結果已納入特殊樣本，共 ${specialCount.toLocaleString()} 筆。` : '目前結果已排除特殊樣本，可作為一般市場比較基準。'}</p>
          </div>
        </div>
      </section>

      <section className="rebuild-grid-2">
        <DataBreakdownCard title={<><span>總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="顯示篩選結果之總價主要分布區間。" items={model.filterPageTotalPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
        <DataBreakdownCard title={<><span>單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="顯示篩選結果之單價主要分布區間。" items={model.filterPageUnitPriceDistribution.map((item) => ({ name: item.name, value: `${item.value} 筆` }))} />
      </section>

      <div className="metric-grid">
        <MetricCard label="篩選後件數" value={`${model.filterPageSummary.volume.toLocaleString()} 筆`} helper={`依目前篩選條件與 ${filterTimeLabel} 時間區間統計`} accent="blue" showHint={false} />
        <MetricCard label="總價中位數" value={model.filterPageSummary.medianTotalPrice > 0 ? `${model.filterPageSummary.medianTotalPrice} 萬` : '-'} helper={`依目前篩選條件與 ${filterTimeLabel} 時間區間統計`} accent="amber" showHint={false} />
        <MetricCard label="單價中位數" value={model.filterPageSummary.medianPrice > 0 ? `${formatPrice(model.filterPageSummary.medianPrice)} 萬/坪` : '-'} helper={`依目前篩選條件與 ${filterTimeLabel} 時間區間統計`} accent="slate" showHint={false} />
        <MetricCard label={model.isLandOnlyMode ? '平均土地坪數' : '平均建坪'} value={model.filterPageSummary.avgPing > 0 ? `${model.filterPageSummary.avgPing} 坪` : '-'} helper={`依目前篩選條件與 ${filterTimeLabel} 時間區間統計`} accent="green" showHint={false} />
      </div>

      <section className="panel">
        <div className="panel-head">
            <div>
              <h3>成交結果列表</h3>
              <p>可由此查看篩選結果，並進入單筆成交明細頁。</p>
            </div>
          </div>
        <div className="table-shell">
          <table className="records-table">
            <thead>
              <tr>
                <th>交易日期</th>
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
            <p>請先於條件篩選結果列表選擇一筆成交資料，以顯示單筆明細內容。</p>
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
        description="本頁依單筆成交資料顯示主資料、空間條件、車位資訊與備註提醒，不另作推測或延伸判斷。"
        actions={
          <div className="rebuild-intro-actions">
            <button type="button" className="rebuild-secondary-btn" onClick={onBack}>返回條件篩選</button>
            <button type="button" className="rebuild-secondary-btn" onClick={onPrev} disabled={!hasPrev}>上一筆</button>
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
            <p>{record.isSpecialSample ? '此筆成交屬特殊樣本，判讀時不宜直接視為一般市場行情。' : '此筆成交未標記為特殊樣本。'}</p>
          </div>
        </div>
      </section>

      <section className="rebuild-grid-2">
        <DataBreakdownCard title="主資料" subtitle="顯示本筆成交之主要資料。" items={[
          { name: '行政區', value: record.district || '-' },
          { name: '交易日期', value: `${record.year} / ${String(record.month).padStart(2, '0')}` },
          { name: '總價', value: record.totalPrice ? `${Math.round(record.totalPrice / 10000)} 萬` : '-' },
          { name: '單價', value: record.unitPricePing ? `${formatPrice(record.unitPricePing)} 萬/坪` : '-' },
        ]} />
        <DataBreakdownCard title="位置與產品" subtitle="顯示位置資訊與產品條件。" items={[
          { name: '位置 / 社區', value: record.locationName || record.projectName || '-' },
          { name: '門牌 / 位置', value: record.address || '-' },
          { name: '產品類型', value: record.type === 'presale' ? '預售屋' : '中古屋' },
          { name: '建物型態', value: record.buildType || '-' },
        ]} />
        <DataBreakdownCard title="空間條件" subtitle="顯示坪數、格局、樓層與土地資訊。" items={[
          { name: '建坪', value: record.totalPing ? `${record.totalPing.toFixed(1)} 坪` : '-' },
          { name: '土地坪數', value: record.landPing ? `${record.landPing.toFixed(1)} 坪` : '-' },
          { name: '房數', value: record.roomCount > 0 ? `${record.roomCount} 房` : '-' },
          { name: '樓層', value: record.level || '-' },
        ]} />
        <DataBreakdownCard title="車位資訊" subtitle="車位資訊與建物價格應分開檢視。" items={[
          { name: '車位狀態', value: record.hasPark ? '有車位' : '無車位' },
          { name: '車位坪數', value: record.parkAreaPing ? `${record.parkAreaPing.toFixed(1)} 坪` : '-' },
          { name: '車位總價', value: record.parkPrice ? `${Math.round(record.parkPrice / 10000)} 萬` : '-' },
        ]} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>備註與判讀提醒</h3>
            <p>備註欄位可作為判斷樣本是否適合納入比較的重要參考。</p>
          </div>
        </div>
        <div className="info-list detail-note-list">
          <p><strong>備註：</strong>{record.note || '無'}</p>
          {record.isSpecialSample ? <p><strong>特殊樣本原因：</strong>{record.specialReason || '備註含特殊交易關鍵字'}</p> : null}
          <p><strong>判讀提醒：</strong>車位金額與特殊備註建議獨立檢視，避免直接與一般成交樣本混合比較。</p>
        </div>
      </section>
    </div>
  )
}

export function RebuiltSite() {
  const model = useDashboardModel()
  const [selectedRecordKey, setSelectedRecordKey] = useState(null)
  const [lastRecordKey, setLastRecordKey] = useState(null)

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
      </main>
    </div>
  )
}
