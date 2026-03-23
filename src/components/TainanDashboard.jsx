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
  buildPopularLocations,
  buildProjectDetail,
  buildPropertyTypeMix,
  buildRankings,
  buildRoomLayout,
  buildVolumeSeries,
  formatPrice,
  groupRecordsByDistrict,
  heatColor,
  processTrendData,
  summarizeCity,
  withMovingAverage,
  checkBuildingMatch,
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
            <p className="project-subtitle">你現在可以看到這個社區的價格變化、房子大小，還有最近成交的資料。</p>
          </div>
          <div className="project-badges">
            <span className="upload-chip">以前成交過 {detail.stats.volume} 筆</span>
            <span className="upload-chip">平均價格 {formatPrice(detail.stats.medianPrice)} 萬/坪</span>
          </div>
        </div>

        <div className="project-metric-grid">
          <DetailMetric
            label="平均價格"
            value={`${formatPrice(detail.stats.medianPrice)} 萬/坪`}
            helper="這個社區常見的每坪價格"
          />
          <DetailMetric
            label="平均總價"
            value={`${detail.stats.avgTotalPrice} 萬`}
            helper="大家大約花多少錢買"
          />
          <DetailMetric
            label="平均建坪"
            value={`${detail.stats.avgPing} 坪`}
            helper="房子大約有多大"
          />
          <DetailMetric
            label="最高 / 最低"
            value={`${formatPrice(detail.stats.maxRecord?.unitPricePing)} / ${formatPrice(detail.stats.minRecord?.unitPricePing)}`}
            helper="最貴和最便宜的差別"
          />
        </div>
      </header>

      <div className="dashboard-grid">
        <ChartCard title="這個社區的價格變化" subtitle="看這個社區以前和現在的價格怎麼變。">
          <div className="chart-wrap large">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={detail.trend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#1d4ed8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="volume" name="成交筆數" fill="#efc27b" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" dataKey="price" name="平均價格" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="right" dataKey="maPrice" name="平均線" type="monotone" stroke="#059669" strokeWidth={2.5} strokeDasharray="6 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="房型和新屋比例" subtitle="看看大家買的是幾房，還有新屋多不多。">
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
        <ChartCard title="不同樓層的差別" subtitle="看看高樓層和低樓層，價格和大小有沒有不同。">
          <div className="chart-wrap medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detail.floorStats} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                <Legend />
                <Bar dataKey="avgPrice" name="平均價格" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="avgPing" name="平均大小" fill="#d97706" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <section className="panel transactions-panel">
          <div className="panel-head">
            <div>
              <h3>交易明細</h3>
              <p>這裡可以看到最近幾筆成交資料。</p>
            </div>
          </div>
          <div className="table-shell">
            <table className="records-table">
              <thead>
                <tr>
                  <th>交易年月</th>
                  <th>價格</th>
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
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState(['existing', 'presale'])
  const [buildingFilter, setBuildingFilter] = useState(['elevator', 'apartment', 'house', 'store'])
  const fileInputRef = useRef(null)
  const { isProcessing, recordsByDistrict, uploadStats, latestDataDate, isRealMode, importMessage, importError, loadFiles } = useHousingData()

  const allRecords = useMemo(
    () => (isRealMode ? Array.from(recordsByDistrict.values()).flat() : []),
    [isRealMode, recordsByDistrict],
  )
  const filteredAllRecords = useMemo(
    () =>
      isRealMode
        ? allRecords.filter(
            (record) =>
              propertyTypeFilter.includes(record.type) && checkBuildingMatch(record, buildingFilter),
          )
        : [],
    [allRecords, buildingFilter, isRealMode, propertyTypeFilter],
  )
  const filteredRecordsByDistrict = useMemo(
    () => (isRealMode ? groupRecordsByDistrict(filteredAllRecords) : new Map()),
    [filteredAllRecords, isRealMode],
  )
  const realOverviews = useMemo(
    () => (isRealMode ? buildDistrictOverviews(filteredRecordsByDistrict) : districtOverviews),
    [filteredRecordsByDistrict, isRealMode],
  )
  const availableDistricts = useMemo(
    () => (isRealMode ? realOverviews.map((item) => item.name) : Object.keys(districtTrendMap)),
    [isRealMode, realOverviews],
  )
  const districtData = districtTrendMap[selectedDistrict] ?? districtTrendMap.東區
  const districtBaseRecords = useMemo(
    () => (isRealMode ? filteredRecordsByDistrict.get(selectedDistrict) ?? [] : []),
    [filteredRecordsByDistrict, isRealMode, selectedDistrict],
  )
  const popularLocations = useMemo(
    () => (isRealMode ? buildPopularLocations(districtBaseRecords) : (districtData.rankings || []).map((item) => item.name)),
    [districtBaseRecords, districtData.rankings, isRealMode],
  )
  const districtRecords = useMemo(
    () =>
      isRealMode
        ? districtBaseRecords.filter((record) =>
            selectedLocation === 'all' ? true : record.locationName === selectedLocation,
          )
        : [],
    [districtBaseRecords, isRealMode, selectedLocation],
  )
  const citySummary = useMemo(() => summarizeCity(realOverviews), [realOverviews])
  const cityTrend = useMemo(
    () =>
      withMovingAverage(
        isRealMode ? processTrendData(filteredAllRecords, activeTab) : cityTrendByTab[activeTab],
      ),
    [activeTab, filteredAllRecords, isRealMode],
  )
  const cityVolumeTrend = useMemo(
    () =>
      isRealMode
        ? buildVolumeSeries(filteredAllRecords, activeTab)
        : cityTrendByTab[activeTab].map((item) => ({ period: item.period, volume: item.volume })),
    [activeTab, filteredAllRecords, isRealMode],
  )
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
    () => (isRealMode ? buildRankings(districtBaseRecords) : districtData.rankings),
    [districtBaseRecords, districtData.rankings, isRealMode],
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
    () => (isRealMode ? buildPropertyTypeMix(districtRecords) : [{ name: '已經蓋好的房子', value: 65 }, { name: '預售屋', value: 35 }]),
    [districtRecords, isRealMode],
  )
  const comparisonData = useMemo(
    () =>
      isRealMode
        ? buildComparisonSeries(filteredRecordsByDistrict, availableDistricts.slice(0, 4), activeTab)
        : comparisonSeries,
    [activeTab, availableDistricts, filteredRecordsByDistrict, isRealMode],
  )
  const projectDetail = useMemo(() => {
    if (!selectedProjectName) return null
    if (isRealMode) return buildProjectDetail(selectedProjectName, districtBaseRecords)

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
      type: ranking.type.includes('還沒蓋好') ? 'presale' : 'existing',
    }))
    return buildProjectDetail(ranking.name, mockRecords)
  }, [districtBaseRecords, isRealMode, rankings, selectedProjectName])

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
    setSelectedLocation('all')
  }, [selectedDistrict])

  useEffect(() => {
    if (selectedLocation !== 'all' && !popularLocations.includes(selectedLocation)) {
      setSelectedLocation('all')
    }
  }, [popularLocations, selectedLocation])

  const togglePropertyType = (type) => {
    setPropertyTypeFilter((previous) => {
      const next = previous.includes(type)
        ? previous.filter((item) => item !== type)
        : [...previous, type]
      return next.length === 0 ? previous : next
    })
  }

  const toggleBuildingType = (type) => {
    setBuildingFilter((previous) => {
      const next = previous.includes(type)
        ? previous.filter((item) => item !== type)
        : [...previous, type]
      return next.length === 0 ? previous : next
    })
  }

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
              這個頁面可以幫你看台南各區的房價。
              你可以看哪裡比較貴、哪裡最近比較熱，還可以點進社區看更細的資料。
            </p>
          </div>

          <div className="hero-highlights">
            <div className="highlight-card">
              <Building2 className="highlight-icon" />
              <div>
                <p>這是什麼</p>
                <strong>看台南房價的網站</strong>
              </div>
            </div>
            <div className="highlight-card">
              <ShieldCheck className="highlight-icon" />
              <div>
                <p>現在用的資料</p>
                <strong>{isRealMode ? '你上傳的真實資料' : '展示用範例資料'}</strong>
              </div>
            </div>
            <div className="highlight-card">
              <Layers3 className="highlight-icon" />
              <div>
                <p>你可以做什麼</p>
                <strong>看全市、看行政區、看社區</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-grid">
          <MetricCard label="台南平均房價" value={`${formatPrice(citySummary.price)} 萬/坪`} helper="大概可以看成台南常見的價格" accent="blue" />
          <MetricCard label="最近有沒有變貴" value={<TrendBadge value={citySummary.yoy} />} helper="數字越大，代表漲得越多" accent="amber" />
          <MetricCard label="總共有幾筆資料" value={`${citySummary.volume || 0} 筆`} helper={isRealMode ? `最新資料到 ${latestDataDate}` : '現在是展示用的範例資料'} accent="slate" />
          <MetricCard label="現在最貴的區" value={`${citySummary.hottest.name} ${formatPrice(citySummary.hottest.price)}`} helper="目前看起來這一區最貴" accent="green" />
        </div>
      </header>

      <section className="panel upload-panel">
        <div className="panel-head compact">
          <div>
            <h3>CSV 匯入與解析</h3>
            <p>你可以把房價資料檔丟進來，網站會幫你整理。</p>
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
          <span className="upload-chip">現在資料：{isRealMode ? '真實資料' : '展示資料'}</span>
          <span className="upload-chip">共讀到：{uploadStats.totalRaw.toLocaleString()} 筆</span>
          <span className="upload-chip">排除掉：{uploadStats.totalExcluded.toLocaleString()} 筆</span>
          <span className="upload-chip">重複的：{uploadStats.duplicateCount.toLocaleString()} 筆</span>
          <span className="upload-chip">{latestDataDate ? `最新資料：${latestDataDate}` : '你也可以把資料檔放進 public 自動讀取'}</span>
        </div>
        {importMessage ? <p className="import-feedback success">{importMessage}</p> : null}
        {importError ? <p className="import-feedback error">{importError}</p> : null}
      </section>

      <section className="panel filter-panel">
        <div className="panel-head compact">
          <div>
            <h3>快速切換</h3>
            <p>你可以在這裡換時間、換行政區、換房子種類。</p>
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
            <span>要看哪一區</span>
            <select value={selectedDistrict} onChange={(event) => setSelectedDistrict(event.target.value)}>
              {availableDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-groups">
          <div className="filter-group">
            <span className="filter-label">已經蓋好還是還沒蓋好</span>
            <div className="chip-row">
              <button type="button" className={propertyTypeFilter.includes('existing') ? 'chip active' : 'chip'} onClick={() => togglePropertyType('existing')}>
                已經蓋好的房子
              </button>
              <button type="button" className={propertyTypeFilter.includes('presale') ? 'chip active' : 'chip'} onClick={() => togglePropertyType('presale')}>
                預售屋
              </button>
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">房子長怎樣</span>
            <div className="chip-row">
              <button type="button" className={buildingFilter.includes('elevator') ? 'chip active' : 'chip'} onClick={() => toggleBuildingType('elevator')}>
                大樓 / 華廈
              </button>
              <button type="button" className={buildingFilter.includes('apartment') ? 'chip active' : 'chip'} onClick={() => toggleBuildingType('apartment')}>
                公寓
              </button>
              <button type="button" className={buildingFilter.includes('house') ? 'chip active' : 'chip'} onClick={() => toggleBuildingType('house')}>
                透天
              </button>
              <button type="button" className={buildingFilter.includes('store') ? 'chip active' : 'chip'} onClick={() => toggleBuildingType('store')}>
                店面 / 商辦
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <ChartCard title="台南房價變化" subtitle="看看整個台南的房價和成交筆數怎麼變。">
          <div className="chart-wrap large">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cityTrend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#1d4ed8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="volume" name="成交筆數" fill="#efc27b" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" dataKey="price" name="平均價格" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="right" dataKey="maPrice" name="平均線" type="monotone" stroke="#059669" strokeWidth={2.5} strokeDasharray="6 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="台南哪裡比較貴" subtitle="顏色越深，通常代表那一區比較貴。">
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
            <h2>{selectedDistrict} 這一區的資料</h2>
          </div>
        </div>

        <section className="panel location-panel">
          <div className="panel-head compact">
            <div>
              <h3>熱門社區切換</h3>
              <p>你可以只看這一區裡面某一個熱門社區。</p>
            </div>
          </div>
          <div className="chip-row">
            <button type="button" className={selectedLocation === 'all' ? 'chip active' : 'chip'} onClick={() => setSelectedLocation('all')}>
              全區綜合
            </button>
            {popularLocations.slice(0, 8).map((location) => (
              <button
                key={location}
                type="button"
                className={selectedLocation === location ? 'chip active' : 'chip'}
                onClick={() => setSelectedLocation(location)}
              >
                {location}
              </button>
            ))}
          </div>
        </section>

        <div className="metric-grid district-metrics">
          <MetricCard label="這一區的房價" value={`${formatPrice(realOverviews.find((item) => item.name === selectedDistrict)?.price)} 萬/坪`} helper="這一區常見的價格" accent="blue" />
          <MetricCard label="這一區有沒有變貴" value={<TrendBadge value={realOverviews.find((item) => item.name === selectedDistrict)?.yoy} />} helper="可以快看最近是漲還是跌" accent="amber" />
          <MetricCard label="這一區賣了幾次" value={`${realOverviews.find((item) => item.name === selectedDistrict)?.volume ?? '-'} 筆`} helper="數字越大，代表資料越多" accent="slate" />
          <MetricCard label="簡單判斷" value={insights.health} helper={`${insights.structure} / ${insights.momentum}`} accent="green" />
        </div>

        <div className="dashboard-grid">
          <ChartCard title="這一區的價格變化" subtitle="看看這一區的房價和成交筆數怎麼變。">
            <div className="chart-wrap large">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={districtTrend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#1d4ed8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                  <Legend />
                <Bar yAxisId="left" dataKey="volume" name="成交筆數" fill="#efc27b" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" dataKey="price" name="平均價格" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="right" dataKey="maPrice" name="平均線" type="monotone" stroke="#059669" strokeWidth={2.5} strokeDasharray="6 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="新房子還是舊房子" subtitle="看看大家買的是比較新的房子，還是比較舊的房子。">
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
          <ChartCard title="大家買幾房" subtitle="看看這一區最常成交的是幾房。">
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

          <ChartCard title="已經蓋好的房子和預售屋" subtitle="看看大家比較常買哪一種。">
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
          <ChartCard title="這一區熱不熱門" subtitle="成交筆數越多，通常代表這一區比較熱。">
            <div className="chart-wrap medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildVolumeSeries(districtRecords, activeTab).length > 0 ? buildVolumeSeries(districtRecords, activeTab) : cityVolumeTrend} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                  <Bar dataKey="volume" name="成交筆數" fill="#d97706" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <section className="panel ai-panel">
            <div className="panel-head">
              <div>
                <h3>電腦幫你快速看</h3>
                <p>用幾個簡單小卡，幫你快看這一區現在的情況。</p>
              </div>
            </div>
            <div className="insight-grid">
              <article className="insight-card">
                <Flame className="insight-icon" />
                <strong>{insights.structure}</strong>
                <span>現在主要在賣什麼</span>
              </article>
              <article className="insight-card">
                <TrendingUp className="insight-icon" />
                <strong>{insights.health}</strong>
                <span>現在情況好不好</span>
              </article>
              <article className="insight-card">
                <Activity className="insight-icon" />
                <strong>{insights.volatility}</strong>
                <span>價格穩不穩</span>
              </article>
              <article className="insight-card">
                <ShieldCheck className="insight-icon" />
                <strong>{insights.liquidity}</strong>
                <span>賣得快不快</span>
              </article>
              <article className="insight-card">
                <BarChart3 className="insight-icon" />
                <strong>{insights.momentum}</strong>
                <span>最近有沒有變熱</span>
              </article>
            </div>
          </section>
        </div>

        <div className="dashboard-grid">
          <section className="panel rankings-panel">
            <div className="panel-head">
              <div>
                <h3>熱門社區排行</h3>
                <p>按一下就能看那個社區更細的資料。</p>
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

          <ChartCard title="熱門社區成交筆數" subtitle="看看哪個社區最近成交最多。">
            <div className="chart-wrap medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankings.slice(0, 6)} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eadfce" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                  <Bar dataKey="volume" name="成交筆數" fill="#1d4ed8" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </section>

      <ChartCard title="幾個行政區一起比" subtitle="把幾個區放在一起，比較誰比較貴。">
        <div className="chart-wrap compare">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonData} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => [`${formatPrice(value)} 萬/坪`, '價格']} contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
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
