import {
  ResponsiveContainer,
  BarChart,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
} from 'recharts'
import { formatPrice, heatColor } from '../../utils/dashboard.js'
import { MetricCard } from '../MetricCard.jsx'
import { ChartCard } from '../ChartCard.jsx'
import { TrendBadge } from '../TrendBadge.jsx'
import { HintBadge } from '../HintBadge.jsx'
import { buildingTypeLabels, propertyTypeLabels } from '../siteLabels.js'
import { DataBreakdownCard, SampleStatusTag } from '../siteShared.jsx'
import { tainanGrid, timeTabs } from '../../data/dashboardData.js'

export function RegionalOverviewPage({ model, onJump }) {
  const districtTotalPriceChartData = [...model.regionalOverviewRows]
    .filter((row) => row.medianTotalPrice > 0)
    .sort((a, b) => b.medianTotalPrice - a.medianTotalPrice)
    .map((row) => ({
      district: row.district,
      value: row.medianTotalPrice,
    }))

  const districtUnitPriceChartData = [...model.regionalOverviewRows]
    .filter((row) => row.price > 0)
    .sort((a, b) => b.price - a.price)
    .map((row) => ({
      district: row.district,
      value: Number(row.price.toFixed(1)),
    }))

  const districtTotalPriceBandItems = [
    { name: '800萬以下', matcher: (value) => value > 0 && value < 800 },
    { name: '800-1,200萬', matcher: (value) => value >= 800 && value < 1200 },
    { name: '1,200-1,600萬', matcher: (value) => value >= 1200 && value < 1600 },
    { name: '1,600-2,000萬', matcher: (value) => value >= 1600 && value < 2000 },
    { name: '2,000萬以上', matcher: (value) => value >= 2000 },
  ]
    .map((bucket) => ({
      name: bucket.name,
      value: `${model.regionalOverviewRows.filter((row) => bucket.matcher(row.medianTotalPrice)).length} 區`,
    }))
    .filter((item) => !item.value.startsWith('0 '))

  const districtUnitPriceBandItems = [
    { name: '20萬以下', matcher: (value) => value > 0 && value < 20 },
    { name: '20-30萬', matcher: (value) => value >= 20 && value < 30 },
    { name: '30-40萬', matcher: (value) => value >= 30 && value < 40 },
    { name: '40-50萬', matcher: (value) => value >= 40 && value < 50 },
    { name: '50萬以上', matcher: (value) => value >= 50 },
  ]
    .map((bucket) => ({
      name: bucket.name,
      value: `${model.regionalOverviewRows.filter((row) => bucket.matcher(row.price)).length} 區`,
    }))
    .filter((item) => !item.value.startsWith('0 '))

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
  const topTotalPriceDistrictItems = [...model.regionalOverviewRows]
    .sort((a, b) => b.medianTotalPrice - a.medianTotalPrice)
    .slice(0, 6)
    .map((row) => ({
      name: row.district,
      value: row.medianTotalPrice > 0 ? `${row.medianTotalPrice.toLocaleString()} 萬` : '-',
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
          <p className="eyebrow">區域總覽</p>
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
              <button type="button" className={model.propertyTypeFilter.includes('existing') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('existing')}>中古屋</button>
              <button type="button" className={model.propertyTypeFilter.includes('presale') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('presale')}>預售屋</button>
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">建物型態</span>
            <div className="chip-row">
              <button type="button" className={model.buildingFilter.includes('elevator') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('elevator')}>大樓 / 華廈</button>
              <button type="button" className={model.buildingFilter.includes('apartment') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('apartment')}>公寓</button>
              <button type="button" className={model.buildingFilter.includes('house') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('house')}>透天</button>
              <button type="button" className={model.buildingFilter.includes('store') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('store')}>店面 / 商辦</button>
            </div>
          </div>
        </div>
        <div className="panel-inline-hint">
          <HintBadge text={`目前已套用：${activeTrendFilters.length > 0 ? activeTrendFilters.join(' / ') : '無'}。`} />
        </div>
      </section>

      <section>
        <ChartCard title="行政區價格熱圖" subtitle="先看不同行政區的價格輪廓。統計方式：依目前篩選條件下最新年度各行政區中位數價格著色。">
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
              <span>各區價格分布輪廓</span>
              <HintBadge text="先不看單一行政區，直接看台南各行政區有多少區落在不同的總價帶與單價帶，建立整體跨區分布感。" />
            </h3>
          </div>
        </div>
        <div className="dashboard-grid">
          <DataBreakdownCard title="各區總價分布" subtitle="依各行政區中位數總價分桶，先看目前台南各區主流總價大多落在哪些帶。" items={districtTotalPriceBandItems} emptyText="目前篩選條件下沒有可顯示的各區總價分布。" />
          <DataBreakdownCard title="各區單價分布" subtitle="依各行政區中位數單價分桶，先看目前台南各區常見單價大多落在哪些帶。" items={districtUnitPriceBandItems} emptyText="目前篩選條件下沒有可顯示的各區單價分布。" />
        </div>
      </section>

      <section className="dashboard-grid">
        <ChartCard title="各區中位數總價圖" subtitle="把所有行政區依中位數總價排開，直接比較各區主流成交總價落點。">
          <div className="chart-wrap" style={{ height: `${Math.max(360, districtTotalPriceChartData.length * 28)}px` }}>
            {districtTotalPriceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtTotalPriceChartData} layout="vertical" margin={{ top: 8, right: 18, left: 18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eadfce" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="district" type="category" width={60} tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} formatter={(value) => [`${Number(value).toLocaleString()} 萬`, '中位數總價']} />
                  <Bar dataKey="value" fill="#c88b36" radius={[0, 8, 8, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state">目前篩選條件下沒有可顯示的各區總價圖。</div>}
          </div>
        </ChartCard>

        <ChartCard title="各區中位數單價圖" subtitle="把所有行政區依中位數單價排開，直接比較各區常見單價位置。">
          <div className="chart-wrap" style={{ height: `${Math.max(360, districtUnitPriceChartData.length * 28)}px` }}>
            {districtUnitPriceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtUnitPriceChartData} layout="vertical" margin={{ top: 8, right: 18, left: 18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eadfce" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="district" type="category" width={60} tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} formatter={(value) => [`${formatPrice(value)} 萬/坪`, '中位數單價']} />
                  <Bar dataKey="value" fill="#1d4ed8" radius={[0, 8, 8, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state">目前篩選條件下沒有可顯示的各區單價圖。</div>}
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
                  <th>中位數總價</th>
                  <th>中位數價格</th>
                  <th>近期方向</th>
                </tr>
              </thead>
              <tbody>
                {model.regionalOverviewRows.map((row) => (
                  <tr key={row.district}>
                    <td><button type="button" className="inline-link-button" onClick={() => model.setSelectedDistrict(row.district)}>{row.district}</button></td>
                    <td>{row.volume.toLocaleString()} 筆</td>
                    <td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice.toLocaleString()} 萬` : '-'}</td>
                    <td>{formatPrice(row.price)} 萬/坪</td>
                    <td><TrendBadge value={row.yoy} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state">目前篩選條件下沒有可顯示的行政區成交概況。</div>}
      </section>

      <section className="dashboard-grid triple">
        <DataBreakdownCard title="各區成交件數比較" subtitle="先看不同區域目前哪裡成交最活躍。" items={topVolumeDistrictItems} emptyText="目前篩選條件下沒有可顯示的行政區成交件數比較。" />
        <DataBreakdownCard title="各區中位數總價比較" subtitle="再看不同區域主流成交總價大約落在哪裡。" items={topTotalPriceDistrictItems} emptyText="目前篩選條件下沒有可顯示的行政區總價比較。" />
        <DataBreakdownCard title="各區中位數價格比較" subtitle="最後看不同區域常見單價位置的差異。" items={topPriceDistrictItems} emptyText="目前篩選條件下沒有可顯示的行政區價格比較。" />
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
            ) : <div className="empty-state">目前篩選條件下沒有可顯示的區域趨勢資料。</div>}
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
