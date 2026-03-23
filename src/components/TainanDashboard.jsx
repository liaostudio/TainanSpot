import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Bar,
  Legend,
} from 'recharts'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Building2,
  Crown,
  Flame,
  Home,
  Layers3,
  Loader2,
  MapPinned,
  PieChart as PieChartIcon,
  ShieldCheck,
  TrendingUp,
  Upload,
} from 'lucide-react'
import {
  cityTrendByTab,
  comparisonSeries,
  districtOverviews,
  districtTrendMap,
  tainanGrid,
  timeTabs,
} from '../data/dashboardData.js'
import {
  buildAgeDistribution,
  buildComparisonSeries,
  buildDistrictOverviews,
  buildInsights,
  buildProjectDetail,
  buildPropertyTypeMix,
  buildRankings,
  buildRoomLayout,
  buildVolumeSeries,
  formatPrice,
  heatColor,
  processTrendData,
  summarizeCity,
  withMovingAverage,
} from '../utils/dashboard.js'
import { useHousingData } from '../hooks/useHousingData.js'
import { MetricCard } from './MetricCard.jsx'
import { TrendBadge } from './TrendBadge.jsx'
import { ChartCard } from './ChartCard.jsx'

const pieColors = ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fcd34d']
const compareColors = ['#1d4ed8', '#059669', '#d97706', '#dc2626']
const typeColors = ['#1d4ed8', '#d97706']

function DetailMetric({ label, value, helper }) {
  return (
    <article className="detail-metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{helper}</span>
    </article>
  )
}

function ProjectDetailView({ detail, onBack }) {
  return (
    <div className="project-detail-page">
      <div className="project-back-row">
        <button type="button" className="back-button" onClick={onBack}>
          <ArrowLeft size={16} />
          返回總覽
        </button>
      </div>

      <header className="project-hero panel">
        <div className="project-hero-head">
          <div>
            <p className="eyebrow">Project Focus</p>
            <h2>{detail.projectName}</h2>
            <p className="project-subtitle">補回建案明細頁後，現在可以從排行榜直接展開單一建案的趨勢、組成與交易明細。</p>
          </div>
          <div className="project-badges">
            <span className="upload-chip">歷史成交 {detail.stats.volume} 筆</span>
            <span className="upload-chip">中位數 {formatPrice(detail.stats.medianPrice)} 萬/坪</span>
          </div>
        </div>

        <div className="project-metric-grid">
          <DetailMetric
            label="歷史中位數"
            value={`${formatPrice(detail.stats.medianPrice)} 萬/坪`}
            helper="此建案所有交易的單價中位數"
          />
          <DetailMetric
            label="平均總價"
            value={`${detail.stats.avgTotalPrice} 萬`}
            helper="總價平均值"
          />
          <DetailMetric
            label="平均建坪"
            value={`${detail.stats.avgPing} 坪`}
            helper="建坪平均值"
          />
          <DetailMetric
            label="最高 / 最低"
            value={`${formatPrice(detail.stats.maxRecord?.unitPricePing)} / ${formatPrice(detail.stats.minRecord?.unitPricePing)}`}
            helper="單價區間"
          />
        </div>
      </header>

      <div className="dashboard-grid">
        <ChartCard title="建案價量趨勢" subtitle="把原本建案明細頁最重要的歷史價量圖補回來。">
          <div className="chart-wrap large">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={detail.trend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#1d4ed8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="volume" name="成交量" fill="#efc27b" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" dataKey="price" name="均價" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="right" dataKey="maPrice" name="4期移動平均" type="monotone" stroke="#059669" strokeWidth={2.5} strokeDasharray="6 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="格局與產品別" subtitle="補回建案明細頁的結構面分析。">
          <div className="stacked-mini-grid">
            <div className="chart-wrap small">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={detail.roomMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={84} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {detail.roomMix.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-wrap small">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={detail.typeMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={84} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {detail.typeMix.map((entry, index) => (
                      <Cell key={entry.name} fill={typeColors[index % typeColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="dashboard-grid">
        <ChartCard title="樓層價差統計" subtitle="用樓層聚合，快速看每個樓層帶的價差與建坪差異。">
          <div className="chart-wrap medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detail.floorStats} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                <Legend />
                <Bar dataKey="avgPrice" name="平均單價" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="avgPing" name="平均建坪" fill="#d97706" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <section className="panel transactions-panel">
          <div className="panel-head">
            <div>
              <h3>交易明細</h3>
              <p>保留明細檢視能力，先給出近期交易表。</p>
            </div>
          </div>
          <div className="table-shell">
            <table className="records-table">
              <thead>
                <tr>
                  <th>交易年月</th>
                  <th>單價</th>
                  <th>總價</th>
                  <th>建坪</th>
                  <th>樓層</th>
                  <th>格局</th>
                </tr>
              </thead>
              <tbody>
                {detail.records.slice(0, 12).map((record) => (
                  <tr key={record.key}>
                    <td>{record.year}年{record.month}月</td>
                    <td>{formatPrice(record.unitPricePing)} 萬</td>
                    <td>{Math.round(record.totalPrice / 10000)} 萬</td>
                    <td>{record.totalPing} 坪</td>
                    <td>{record.level || '未標示'}</td>
                    <td>{record.roomCount > 0 ? `${record.roomCount} 房` : '未標示'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export function TainanDashboard() {
  const [activeTab, setActiveTab] = useState('1y')
  const [selectedDistrict, setSelectedDistrict] = useState('東區')
  const [selectedProjectName, setSelectedProjectName] = useState(null)
  const fileInputRef = useRef(null)
  const { isProcessing, recordsByDistrict, uploadStats, latestDataDate, isRealMode, loadFiles } = useHousingData()

  const realOverviews = useMemo(
    () => (isRealMode ? buildDistrictOverviews(recordsByDistrict) : districtOverviews),
    [isRealMode, recordsByDistrict],
  )
  const availableDistricts = useMemo(
    () => (isRealMode ? realOverviews.map((item) => item.name) : Object.keys(districtTrendMap)),
    [isRealMode, realOverviews],
  )
  const allRecords = useMemo(
    () => (isRealMode ? Array.from(recordsByDistrict.values()).flat() : []),
    [isRealMode, recordsByDistrict],
  )
  const districtRecords = useMemo(
    () => (isRealMode ? recordsByDistrict.get(selectedDistrict) ?? [] : []),
    [isRealMode, recordsByDistrict, selectedDistrict],
  )
  const citySummary = useMemo(() => summarizeCity(realOverviews), [realOverviews])
  const cityTrend = useMemo(
    () => withMovingAverage(isRealMode ? processTrendData(allRecords, activeTab) : cityTrendByTab[activeTab]),
    [activeTab, allRecords, isRealMode],
  )
  const cityVolumeTrend = useMemo(
    () => (isRealMode ? buildVolumeSeries(allRecords, activeTab) : cityTrendByTab[activeTab].map((item) => ({ period: item.period, volume: item.volume }))),
    [activeTab, allRecords, isRealMode],
  )
  const districtData = districtTrendMap[selectedDistrict] ?? districtTrendMap.東區
  const districtTrend = useMemo(
    () =>
      withMovingAverage(
        isRealMode ? processTrendData(districtRecords, activeTab) : districtData.trend[activeTab] ?? districtData.trend['1y'],
      ),
    [activeTab, districtData, districtRecords, isRealMode],
  )
  const ageDistribution = useMemo(
    () => (isRealMode ? buildAgeDistribution(districtRecords) : districtData.ageDistribution),
    [districtData.ageDistribution, districtRecords, isRealMode],
  )
  const rankings = useMemo(
    () => (isRealMode ? buildRankings(districtRecords) : districtData.rankings),
    [districtData.rankings, districtRecords, isRealMode],
  )
  const insights = useMemo(
    () => (isRealMode ? buildInsights(districtRecords) : districtData.aiReport),
    [districtData.aiReport, districtRecords, isRealMode],
  )
  const roomMix = useMemo(
    () => (isRealMode ? buildRoomLayout(districtRecords) : [{ name: '2房', value: 45 }, { name: '3房', value: 33 }, { name: '1房', value: 12 }, { name: '4房以上', value: 10 }]),
    [districtRecords, isRealMode],
  )
  const typeMix = useMemo(
    () => (isRealMode ? buildPropertyTypeMix(districtRecords) : [{ name: '一般成屋', value: 65 }, { name: '預售建案', value: 35 }]),
    [districtRecords, isRealMode],
  )
  const comparisonData = useMemo(
    () =>
      isRealMode
        ? buildComparisonSeries(recordsByDistrict, availableDistricts.slice(0, 4), activeTab)
        : comparisonSeries,
    [activeTab, availableDistricts, isRealMode, recordsByDistrict],
  )
  const projectDetail = useMemo(() => {
    if (!selectedProjectName) return null
    if (isRealMode) return buildProjectDetail(selectedProjectName, districtRecords)

    const ranking = rankings.find((item) => item.name === selectedProjectName)
    if (!ranking) return null
    const mockRecords = Array.from({ length: ranking.volume }).map((_, index) => ({
      key: `${ranking.name}-${index}`,
      year: 2025 - Math.floor(index / 6),
      month: (index % 12) + 1,
      unitPricePing: Number((ranking.medianPrice + (index % 5) * 0.4 - 0.8).toFixed(2)),
      totalPrice: (ranking.medianPrice + 5) * 35 * 10000,
      totalPing: 35 + (index % 3) * 4,
      roomCount: (index % 4) + 1,
      level: `${(index % 12) + 2}層`,
      locationName: ranking.name,
      projectName: ranking.name,
      type: ranking.type.includes('預售') ? 'presale' : 'existing',
    }))
    return buildProjectDetail(ranking.name, mockRecords)
  }, [districtRecords, isRealMode, rankings, selectedProjectName])

  const pricedDistricts = realOverviews.map((item) => item.price)
  const minPrice = Math.min(...pricedDistricts)
  const maxPrice = Math.max(...pricedDistricts)

  useEffect(() => {
    if (availableDistricts.length > 0 && !availableDistricts.includes(selectedDistrict)) {
      setSelectedDistrict(availableDistricts[0])
    }
  }, [availableDistricts, selectedDistrict])

  useEffect(() => {
    setSelectedProjectName(null)
  }, [selectedDistrict])

  if (projectDetail) {
    return <ProjectDetailView detail={projectDetail} onBack={() => setSelectedProjectName(null)} />
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div className="hero-main">
          <div className="hero-copy">
            <p className="eyebrow">TainanSpot Housing Intelligence</p>
            <h1>台南房價深度分析儀表板</h1>
            <p className="hero-lead">
              我把你原本那份大頁面改成比較能維護的版本，先整理成模組化儀表板，
              保留它原本的核心感覺：全市總覽、行政區熱圖、區域趨勢、建案排行與多區比較。
            </p>
          </div>

          <div className="hero-highlights">
            <div className="highlight-card">
              <Building2 className="highlight-icon" />
              <div>
                <p>專案版本</p>
                <strong>模組化整合版</strong>
              </div>
            </div>
            <div className="highlight-card">
              <ShieldCheck className="highlight-icon" />
              <div>
                <p>目前資料模式</p>
                <strong>{isRealMode ? 'CSV 真實資料模式' : '展示資料模式'}</strong>
              </div>
            </div>
            <div className="highlight-card">
              <Layers3 className="highlight-icon" />
              <div>
                <p>下一階段</p>
                <strong>建案明細與更多圖表已補回主流程</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-grid">
          <MetricCard label="全市加權均價" value={`${formatPrice(citySummary.price)} 萬/坪`} helper="以示意交易量做加權後的城市價格中心" accent="blue" />
          <MetricCard label="平均年增率" value={<TrendBadge value={citySummary.yoy} />} helper="綜合熱門行政區的平均年增率" accent="amber" />
          <MetricCard label="總觀測成交量" value={`${citySummary.volume || 0} 筆`} helper={isRealMode ? `CSV 匯入後最新資料至 ${latestDataDate}` : '目前儀表板示意採計的年度樣本量'} accent="slate" />
          <MetricCard label="最高均價區" value={`${citySummary.hottest.name} ${formatPrice(citySummary.hottest.price)}`} helper="目前是善化區領先，反映科技買盤熱度" accent="green" />
        </div>
      </header>

      <section className="panel upload-panel">
        <div className="panel-head compact">
          <div>
            <h3>CSV 匯入與解析</h3>
            <p>已接回你原本的 CSV 解析邏輯核心：去重、特殊交易排除、純建物單價換算、行政區聚合。</p>
          </div>
          <button type="button" className="upload-trigger" onClick={() => fileInputRef.current?.click()}>
            {isProcessing ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
            匯入 CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            hidden
            onChange={(event) => {
              const files = Array.from(event.target.files || [])
              loadFiles(files)
              event.target.value = ''
            }}
          />
        </div>
        <div className="upload-stats">
          <span className="upload-chip">資料模式：{isRealMode ? '真實資料' : '展示資料'}</span>
          <span className="upload-chip">讀取總筆數：{uploadStats.totalRaw.toLocaleString()}</span>
          <span className="upload-chip">排除特殊交易：{uploadStats.totalExcluded.toLocaleString()}</span>
          <span className="upload-chip">重複紀錄：{uploadStats.duplicateCount.toLocaleString()}</span>
          <span className="upload-chip">{latestDataDate ? `資料最新至：${latestDataDate}` : '可從 public 放 data_existing.csv / data_presale.csv 自動載入'}</span>
        </div>
      </section>

      <section className="panel filter-panel">
        <div className="panel-head compact">
          <div>
            <h3>看板控制列</h3>
            <p>把原本單一 App 的狀態濃縮成兩個最核心切換，先讓頁面穩定。</p>
          </div>
        </div>
        <div className="filter-row">
          <div className="time-tabs">
            {timeTabs.map((tab) => (
              <button key={tab.id} type="button" className={tab.id === activeTab ? 'is-active' : ''} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>

          <label className="district-picker">
            <span>分析行政區</span>
            <select value={selectedDistrict} onChange={(event) => setSelectedDistrict(event.target.value)}>
              {availableDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="dashboard-grid">
        <ChartCard title="全市價量趨勢" subtitle="保留你原本最重要的價量合成圖，並把移動平均封裝成共用工具。">
          <div className="chart-wrap large">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cityTrend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#1d4ed8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="volume" name="成交量" fill="#efc27b" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" dataKey="price" name="均價" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="right" dataKey="maPrice" name="4期移動平均" type="monotone" stroke="#059669" strokeWidth={2.5} strokeDasharray="6 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="台南 37 區熱力格" subtitle="把原本空間價格熱圖保留，但先改成乾淨的互動卡格版本。">
          <div className="heatmap">
            {tainanGrid.map((cell) => {
              const overview = realOverviews.find((item) => item.name === cell.id)
              const isSelected = selectedDistrict === cell.id

              return (
                <button
                  key={cell.id}
                  type="button"
                  style={{ gridColumn: cell.c, gridRow: cell.r }}
                  className={`heat-cell ${heatColor(overview?.price, minPrice, maxPrice)} ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (availableDistricts.includes(cell.id)) setSelectedDistrict(cell.id)
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

      <section className="district-section">
        <div className="section-title">
          <MapPinned className="section-title-icon" />
          <div>
            <p className="eyebrow">District Focus</p>
            <h2>{selectedDistrict} 深度分析</h2>
          </div>
        </div>

        <div className="metric-grid district-metrics">
          <MetricCard label="區域中位數單價" value={`${formatPrice(realOverviews.find((item) => item.name === selectedDistrict)?.price)} 萬/坪`} helper="保留原本首頁中最常被使用的行政區價格入口" accent="blue" />
          <MetricCard label="區域年增率" value={<TrendBadge value={realOverviews.find((item) => item.name === selectedDistrict)?.yoy} />} helper="方便快速對照現在是不是強勢區域" accent="amber" />
          <MetricCard label="區域成交量" value={`${realOverviews.find((item) => item.name === selectedDistrict)?.volume ?? '-'} 筆`} helper="先保留排行榜的決策訊號" accent="slate" />
          <MetricCard label="AI 市況判讀" value={insights.health} helper={`${insights.structure} / ${insights.momentum}`} accent="green" />
        </div>

        <div className="dashboard-grid">
          <ChartCard title="行政區價量趨勢" subtitle="這塊就是原本的重點區域圖，只是把資料來源與圖表分離。">
            <div className="chart-wrap large">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={districtTrend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#1d4ed8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="volume" name="成交量" fill="#efc27b" radius={[8, 8, 0, 0]} />
                  <Line yAxisId="right" dataKey="price" name="均價" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} />
                  <Line yAxisId="right" dataKey="maPrice" name="4期移動平均" type="monotone" stroke="#059669" strokeWidth={2.5} strokeDasharray="6 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="屋齡成交佔比" subtitle="把屋齡分析留著，作為後續串接真實成交資料的接口。">
            <div className="chart-wrap medium">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ageDistribution} dataKey="volume" nameKey="ageGroup" cx="50%" cy="50%" innerRadius={55} outerRadius={95} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {ageDistribution.map((entry, index) => (
                      <Cell key={entry.ageGroup} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, _name, item) => [`${value} 筆`, `${item.payload.ageGroup} / 均價 ${formatPrice(item.payload.price)} 萬`]} contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="dashboard-grid">
          <ChartCard title="房型成交佔比" subtitle="把原本區域房型模組補回來，快速看 1~4 房需求分佈。">
            <div className="chart-wrap medium">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roomMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={92} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {roomMix.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="預售 vs 成屋" subtitle="保留產品別結構圖，方便判讀區域主力買盤。">
            <div className="chart-wrap medium">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={92} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {typeMix.map((entry, index) => (
                      <Cell key={entry.name} fill={typeColors[index % typeColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="dashboard-grid">
          <ChartCard title="區域量能走勢" subtitle="把量能單獨拉出來，讓你看熱度變化更直覺。">
            <div className="chart-wrap medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildVolumeSeries(districtRecords, activeTab).length > 0 ? buildVolumeSeries(districtRecords, activeTab) : cityVolumeTrend} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                  <Bar dataKey="volume" name="成交量" fill="#d97706" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <section className="panel ai-panel">
            <div className="panel-head">
              <div>
                <h3>區域 AI 體檢</h3>
                <p>把原本頁面裡最有辨識度的白話分析保留下來，但改成結構化卡片。</p>
              </div>
            </div>
            <div className="insight-grid">
              <article className="insight-card">
                <Flame className="insight-icon" />
                <strong>{insights.structure}</strong>
                <span>市場主力</span>
              </article>
              <article className="insight-card">
                <TrendingUp className="insight-icon" />
                <strong>{insights.health}</strong>
                <span>健康度</span>
              </article>
              <article className="insight-card">
                <Activity className="insight-icon" />
                <strong>{insights.volatility}</strong>
                <span>穩定度</span>
              </article>
              <article className="insight-card">
                <ShieldCheck className="insight-icon" />
                <strong>{insights.liquidity}</strong>
                <span>去化速度</span>
              </article>
              <article className="insight-card">
                <BarChart3 className="insight-icon" />
                <strong>{insights.momentum}</strong>
                <span>近期動能</span>
              </article>
            </div>
          </section>
        </div>

        <div className="dashboard-grid">
          <section className="panel rankings-panel">
            <div className="panel-head">
              <div>
                <h3>建案排行榜</h3>
                <p>現在已經可以點進去看建案明細頁。</p>
              </div>
              <Crown className="panel-badge" />
            </div>
            <div className="ranking-list">
              {rankings.map((project, index) => (
                <button key={project.name} type="button" className="ranking-row ranking-button" onClick={() => setSelectedProjectName(project.name)}>
                  <div className="ranking-main">
                    <span className="ranking-index">#{index + 1}</span>
                    <div>
                      <strong>{project.name}</strong>
                      <p>{project.type}</p>
                    </div>
                  </div>
                  <div className="ranking-meta">
                    <strong>{formatPrice(project.medianPrice)} 萬/坪</strong>
                    <span>{project.volume} 筆</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <ChartCard title="熱門建案成交量" subtitle="把建案榜轉成圖表版，方便快速看量體差距。">
            <div className="chart-wrap medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankings.slice(0, 6)} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eadfce" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                  <Bar dataKey="volume" name="成交量" fill="#1d4ed8" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </section>

      <ChartCard title="多行政區價格比較" subtitle="這是把原本多區比較模組收斂成單一清楚的折線圖版本。">
        <div className="chart-wrap compare">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonData} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => [`${formatPrice(value)} 萬/坪`, '單價']} contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
              <Legend />
              {(isRealMode ? availableDistricts.slice(0, 4) : ['東區', '永康區', '善化區', '安平區']).map((district, index) => (
                <Line key={district} type="monotone" dataKey={district} stroke={compareColors[index]} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
