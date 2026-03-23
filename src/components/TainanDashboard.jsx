import { useRef } from 'react'
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
  Layers3,
  Loader2,
  MapPinned,
  ShieldCheck,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { tainanGrid, timeTabs } from '../data/dashboardData.js'
import { buildVolumeSeries, formatPrice, heatColor } from '../utils/dashboard.js'
import { useDashboardModel } from '../hooks/useDashboardModel.js'
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

export function ProjectDetailView({ detail, onBack }) {
  return (
    <div className="project-detail-page">
      <div className="project-back-row">
        <button type="button" className="back-button" onClick={onBack}>
          <ArrowLeft size={16} />
          返回上一頁
        </button>
      </div>

      <header className="project-hero panel">
        <div className="project-hero-head">
          <div>
            <p className="eyebrow">Project Focus</p>
            <h2>{detail.projectName}</h2>
            <p className="project-subtitle">這裡把一個社區最重要的資料整理給你看，先看價格，再看成交，再看細節。</p>
          </div>
          <div className="project-badges">
            <span className="upload-chip">以前成交過 {detail.stats.volume} 筆</span>
            <span className="upload-chip">平均價格 {formatPrice(detail.stats.medianPrice)} 萬/坪</span>
          </div>
        </div>

        <div className="project-metric-grid">
          <DetailMetric label="平均價格" value={`${formatPrice(detail.stats.medianPrice)} 萬/坪`} helper="這個社區大多數成交的大概價格" />
          <DetailMetric label="平均總價" value={`${detail.stats.avgTotalPrice} 萬`} helper="大家大約花多少錢買這裡" />
          <DetailMetric label="平均建坪" value={`${detail.stats.avgPing} 坪`} helper="房子大約有多大" />
          <DetailMetric
            label="最高 / 最低"
            value={`${formatPrice(detail.stats.maxRecord?.unitPricePing)} / ${formatPrice(detail.stats.minRecord?.unitPricePing)}`}
            helper="最貴和最便宜差多少"
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

        <ChartCard title="房型和新舊比例" subtitle="看看大家買的是幾房，還有預售屋多不多。">
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

export function TainanDashboardView({ model, onSelectProject }) {
  const fileInputRef = useRef(null)
  const {
    activeTab,
    setActiveTab,
    selectedDistrict,
    setSelectedDistrict,
    selectedLocation,
    setSelectedLocation,
    propertyTypeFilter,
    buildingFilter,
    togglePropertyType,
    toggleBuildingType,
    isProcessing,
    uploadStats,
    latestDataDate,
    isRealMode,
    importMessage,
    importError,
    loadFiles,
    availableDistricts,
    citySummary,
    cityTrend,
    cityVolumeTrend,
    comparisonData,
    realOverviews,
    districtRecords,
    districtTrend,
    ageDistribution,
    rankings,
    insights,
    roomMix,
    typeMix,
    popularLocations,
    selectedDistrictOverview,
    minPrice,
    maxPrice,
  } = model

  const openProject = (projectName) => {
    if (onSelectProject) onSelectProject(projectName)
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div className="hero-main">
          <div className="hero-copy">
            <p className="eyebrow">Professional View</p>
            <h1>專業分析頁</h1>
            <p className="hero-lead">
              這一頁保留比較完整的圖表、篩選器和 CSV 匯入功能，讓房仲或進階使用者可以更深入看資料。
            </p>
          </div>

          <div className="hero-highlights">
            <div className="highlight-card">
              <Building2 className="highlight-icon" />
              <div>
                <p>目前模式</p>
                <strong>{isRealMode ? '真實資料分析中' : '展示資料模式'}</strong>
              </div>
            </div>
            <div className="highlight-card">
              <ShieldCheck className="highlight-icon" />
              <div>
                <p>這頁適合誰</p>
                <strong>房仲、代銷、進階使用者</strong>
              </div>
            </div>
            <div className="highlight-card">
              <Layers3 className="highlight-icon" />
              <div>
                <p>這裡能做什麼</p>
                <strong>篩資料、看趨勢、比較行政區</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-grid">
          <MetricCard label="台南平均價格" value={`${formatPrice(citySummary.price)} 萬/坪`} helper="整體市場大概價格" accent="blue" />
          <MetricCard label="最近有沒有變貴" value={<TrendBadge value={citySummary.yoy} />} helper="快速看現在是漲還是跌" accent="amber" />
          <MetricCard label="總共有幾筆資料" value={`${citySummary.volume || 0} 筆`} helper={isRealMode ? `最新資料到 ${latestDataDate}` : '現在是展示用範例資料'} accent="slate" />
          <MetricCard label="現在最貴的區" value={`${citySummary.hottest.name} ${formatPrice(citySummary.hottest.price)}`} helper="目前看起來最貴的行政區" accent="green" />
        </div>
      </header>

      <section className="panel upload-panel">
        <div className="panel-head compact">
          <div>
            <h3>CSV 匯入與解析</h3>
            <p>把房價資料檔丟進來，網站會幫你整理。</p>
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
            <p>你可以換時間、換行政區、換房子種類。</p>
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
            <span className="filter-label">已經蓋好還是預售屋</span>
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
          <MetricCard label="這一區的房價" value={`${formatPrice(selectedDistrictOverview?.price)} 萬/坪`} helper="這一區常見的價格" accent="blue" />
          <MetricCard label="這一區有沒有變貴" value={<TrendBadge value={selectedDistrictOverview?.yoy} />} helper="可以快看最近是漲還是跌" accent="amber" />
          <MetricCard label="這一區成交筆數" value={`${selectedDistrictOverview?.volume ?? '-'} 筆`} helper="數字越大，代表資料越多" accent="slate" />
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
                <button key={project.name} type="button" className="ranking-row ranking-button" onClick={() => openProject(project.name)}>
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

export function TainanDashboard() {
  const model = useDashboardModel()
  return <TainanDashboardView model={model} />
}
