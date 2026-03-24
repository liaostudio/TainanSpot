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
  ReferenceLine,
} from 'recharts'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Building2,
  Crown,
  Download,
  FileText,
  Flame,
  Layers3,
  MapPinned,
  ShieldCheck,
  TrendingUp,
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

function saveChartAsImage(containerRef, fileName) {
  const container = containerRef?.current
  if (!container) return
  const svgElement = container.querySelector('svg')
  if (!svgElement) return

  const bounds = svgElement.getBoundingClientRect()
  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = bounds.width * scale
  canvas.height = bounds.height * scale
  const context = canvas.getContext('2d')
  if (!context) return
  context.scale(scale, scale)

  const clone = svgElement.cloneNode(true)
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  background.setAttribute('width', '100%')
  background.setAttribute('height', '100%')
  background.setAttribute('fill', '#fffdf8')
  clone.insertBefore(background, clone.firstChild)

  const xml = new XMLSerializer().serializeToString(clone)
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const image = new Image()

  image.onload = () => {
    context.fillStyle = '#fffdf8'
    context.fillRect(0, 0, bounds.width, bounds.height)
    context.drawImage(image, 0, 0, bounds.width, bounds.height)
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${fileName}.png`
    link.click()
    URL.revokeObjectURL(url)
  }

  image.src = url
}

function chartToDataUrl(containerRef) {
  return new Promise((resolve) => {
    const container = containerRef?.current
    if (!container) {
      resolve('')
      return
    }

    const svgElement = container.querySelector('svg')
    if (!svgElement) {
      resolve('')
      return
    }

    const bounds = svgElement.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = bounds.width * scale
    canvas.height = bounds.height * scale
    const context = canvas.getContext('2d')
    if (!context) {
      resolve('')
      return
    }
    context.scale(scale, scale)

    const clone = svgElement.cloneNode(true)
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    background.setAttribute('width', '100%')
    background.setAttribute('height', '100%')
    background.setAttribute('fill', '#fffdf8')
    clone.insertBefore(background, clone.firstChild)

    const xml = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      context.fillStyle = '#fffdf8'
      context.fillRect(0, 0, bounds.width, bounds.height)
      context.drawImage(image, 0, 0, bounds.width, bounds.height)
      const dataUrl = canvas.toDataURL('image/png')
      URL.revokeObjectURL(url)
      resolve(dataUrl)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      resolve('')
    }

    image.src = url
  })
}

function DownloadChartButton({ chartRef, fileName }) {
  return (
    <button type="button" className="chart-download-btn" onClick={() => saveChartAsImage(chartRef, fileName)}>
      <Download size={15} />
      下載圖片
    </button>
  )
}

function PdfReportButton({ onExport }) {
  return (
    <button type="button" className="chart-download-btn" onClick={onExport}>
      <FileText size={15} />
      匯出 PDF 簡報
    </button>
  )
}

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
  const projectTrendRef = useRef(null)
  const topFloor = detail.floorStats?.[0]
  return (
    <div className="project-detail-page">
      <div className="project-back-row">
        <button type="button" className="back-button" onClick={onBack}>
          <ArrowLeft size={16} />
          返回上一頁
        </button>
      </div>

      <header className="project-hero panel">
        <div className="project-hero-top">
          <div className="project-hero-copy">
            <p className="eyebrow">Community Profile</p>
            <h2>{detail.projectName}</h2>
            <p className="project-subtitle">先看這個社區大概多少錢、成交熱不熱，再往下看價格變化、樓層差異和最近成交明細。</p>
            <div className="project-badges">
              <span className="upload-chip">以前成交過 {detail.stats.volume} 筆</span>
              <span className="upload-chip">平均價格 {formatPrice(detail.stats.medianPrice)} 萬/坪</span>
              <span className="upload-chip">平均總價 {detail.stats.avgTotalPrice} 萬</span>
            </div>
          </div>
          <aside className="project-hero-side">
            <div className="project-price-panel">
              <p>社區常見價格</p>
              <strong>{formatPrice(detail.stats.medianPrice)} 萬/坪</strong>
              <span>最高 {formatPrice(detail.stats.maxRecord?.unitPricePing)} / 最低 {formatPrice(detail.stats.minRecord?.unitPricePing)}</span>
            </div>
            <div className="project-quick-notes">
              <div>
                <span>主流總價</span>
                <strong>{detail.stats.avgTotalPrice} 萬</strong>
              </div>
              <div>
                <span>主流建坪</span>
                <strong>{detail.stats.avgPing} 坪</strong>
              </div>
            </div>
          </aside>
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

        <nav className="project-anchor-nav">
          <a href="#project-overview">社區概況</a>
          <a href="#project-trend">價格走勢</a>
          <a href="#project-floor">樓層差異</a>
          <a href="#project-records">交易明細</a>
        </nav>
      </header>

      <section id="project-overview" className="project-section project-section-overview">
        <div className="project-overview-grid">
          <section className="panel project-overview-card">
            <div className="panel-head">
              <div>
                <h3>社區概況</h3>
                <p>先用最簡單的方式認識這個社區。</p>
              </div>
            </div>
            <div className="project-overview-list">
              <div><span>成交筆數</span><strong>{detail.stats.volume} 筆</strong></div>
              <div><span>平均價格</span><strong>{formatPrice(detail.stats.medianPrice)} 萬/坪</strong></div>
              <div><span>平均總價</span><strong>{detail.stats.avgTotalPrice} 萬</strong></div>
              <div><span>平均建坪</span><strong>{detail.stats.avgPing} 坪</strong></div>
            </div>
          </section>

          <section className="panel project-overview-card">
            <div className="panel-head">
              <div>
                <h3>快速看法</h3>
                <p>幫你快速知道這個社區目前大概是什麼感覺。</p>
              </div>
            </div>
            <div className="project-summary-list">
              <div>
                <span>價格位置</span>
                <strong>目前價格落在歷史區間中段附近</strong>
              </div>
              <div>
                <span>成交節奏</span>
                <strong>{detail.trend.at(-1)?.volume || detail.stats.volume} 筆近期成交可參考</strong>
              </div>
              <div>
                <span>主要產品</span>
                <strong>{detail.roomMix?.[0]?.name || '未標示'} 最常見</strong>
              </div>
              <div>
                <span>樓層觀察</span>
                <strong>{topFloor ? `${topFloor.level} 成交最多` : '目前資料不多'}</strong>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section id="project-trend" className="project-section project-section-primary">
        <ChartCard
          title="這個社區的價格變化"
          subtitle="看這個社區以前和現在的價格怎麼變。"
          actions={<DownloadChartButton chartRef={projectTrendRef} fileName={`${detail.projectName}-價格變化`} />}
        >
          <div className="chart-wrap large" ref={projectTrendRef}>
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
                <ReferenceLine yAxisId="right" y={detail.stats.maxRecord?.unitPricePing} stroke="#dc2626" strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: '歷史天花板', fill: '#dc2626', fontSize: 11 }} />
                <ReferenceLine yAxisId="right" y={detail.stats.minRecord?.unitPricePing} stroke="#059669" strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: '歷史地板', fill: '#059669', fontSize: 11 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <div className="project-detail-grid">
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
      </div>

      <section id="project-records" className="project-section project-section-table">
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
      </section>
    </div>
  )
}

export function TainanDashboardView({ model, onSelectProject, canManageImports = false, onLogoutImports, loginCard = null }) {
  const cityTrendRef = useRef(null)
  const districtTrendRef = useRef(null)
  const comparisonTrendRef = useRef(null)
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
    totalPriceRange,
    setTotalPriceRange,
    totalPingRange,
    setTotalPingRange,
    isProcessing,
    uploadStats,
    latestDataDate,
    isRealMode,
    importMessage,
    importError,
    persistedAt,
    storageMode,
    isSharedMode,
    importedFiles,
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

  const exportPdfReport = async () => {
    const [cityChart, districtChart, comparisonChart] = await Promise.all([
      chartToDataUrl(cityTrendRef),
      chartToDataUrl(districtTrendRef),
      chartToDataUrl(comparisonTrendRef),
    ])

    const reportWindow = window.open('', '_blank', 'width=1200,height=900')
    if (!reportWindow) return

    const safeImage = (src, title) =>
      src
        ? `<section style="margin:20px 0;"><h2 style="font-size:18px;margin:0 0 10px;">${title}</h2><img src="${src}" style="width:100%;border:1px solid #e5d7c3;border-radius:16px;" /></section>`
        : ''

    reportWindow.document.write(`
      <html>
        <head>
          <title>${selectedDistrict} 房市簡報</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#fffdf8; color:#312318; margin:32px; }
            h1 { margin:0 0 8px; font-size:28px; }
            p { color:#6b5a48; line-height:1.6; }
            .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:24px 0; }
            .card { border:1px solid #e5d7c3; border-radius:18px; padding:16px; background:#fff; }
            .label { font-size:12px; color:#8a7259; font-weight:700; }
            .value { margin-top:8px; font-size:24px; font-weight:800; color:#9f611f; }
            .helper { margin-top:6px; font-size:12px; color:#7a6858; }
            @media print { body { margin:16px; } }
          </style>
        </head>
        <body>
          <h1>${selectedDistrict} 房市簡報</h1>
          <p>匯出時間：${new Date().toLocaleString('zh-TW')}。這份簡報整理目前篩選條件下的重點數據，可直接另存成 PDF 提供給客戶。</p>
          <div class="grid">
            <div class="card"><div class="label">台南平均價格</div><div class="value">${formatPrice(citySummary.price)} 萬/坪</div><div class="helper">整體市場大概價格</div></div>
            <div class="card"><div class="label">${selectedDistrict} 平均價格</div><div class="value">${formatPrice(selectedDistrictOverview?.price)} 萬/坪</div><div class="helper">當前行政區常見價格</div></div>
            <div class="card"><div class="label">最新資料</div><div class="value">${latestDataDate || '-'}</div><div class="helper">目前分析資料時間</div></div>
            <div class="card"><div class="label">已匯入期數</div><div class="value">${importedFiles.length} 期</div><div class="helper">可在匯入清單管理</div></div>
          </div>
          ${safeImage(cityChart, '台南房價變化')}
          ${safeImage(districtChart, `${selectedDistrict} 價格變化`)}
          ${safeImage(comparisonChart, '行政區價格比較')}
        </body>
      </html>
    `)
    reportWindow.document.close()
    reportWindow.focus()
    setTimeout(() => {
      reportWindow.print()
    }, 400)
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero dashboard-hero-pro">
        <div className="hero-copy hero-copy-compact">
          <p className="eyebrow">Professional View</p>
          <h1>專業分析頁</h1>
          <p className="hero-lead">把篩選器、價量變化、行政區比較和匯入工具集中在同一頁，方便快速配案與議價。</p>
        </div>
        <div className="metric-grid">
          <MetricCard label="台南平均價格" value={`${formatPrice(citySummary.price)} 萬/坪`} helper="整體市場大概價格" accent="blue" />
          <MetricCard label="最近有沒有變貴" value={<TrendBadge value={citySummary.yoy} />} helper="快速看現在是漲還是跌" accent="amber" />
          <MetricCard label="總共有幾筆資料" value={`${citySummary.volume || 0} 筆`} helper={isRealMode ? `最新資料到 ${latestDataDate}` : '現在是展示用範例資料'} accent="slate" />
          <MetricCard label="現在最貴的區" value={`${citySummary.hottest.name} ${formatPrice(citySummary.hottest.price)}`} helper="目前看起來最貴的行政區" accent="green" />
        </div>
        <div className="hero-actions-row">
          <PdfReportButton onExport={exportPdfReport} />
        </div>
      </header>

      {canManageImports ? (
        <section className="panel upload-panel">
          <div className="panel-head compact">
            <div>
              <h3>GitHub 共用資料管理</h3>
              <p>這個網站現在改成 GitHub 共用資料模式。把每一期 CSV 放進 repo 的 `data/raw/`，重新部署後，所有人看到的就會是同一份最新資料。</p>
            </div>
            <div className="upload-actions">
              <button type="button" className="upload-trigger ghost" onClick={onLogoutImports}>
                登出管理
              </button>
            </div>
          </div>
          <div className="upload-stats">
            <span className="upload-chip highlight">已匯入 {importedFiles.length} 期</span>
            <span className="upload-chip">現在資料：{isRealMode ? '真實資料' : '展示資料'}</span>
            <span className="upload-chip">{isSharedMode ? '資料模式：GitHub 共用資料' : `資料模式：${storageMode}`}</span>
            <span className="upload-chip">共讀到：{uploadStats.totalRaw.toLocaleString()} 筆</span>
            <span className="upload-chip">排除掉：{uploadStats.totalExcluded.toLocaleString()} 筆</span>
            <span className="upload-chip">重複的：{uploadStats.duplicateCount.toLocaleString()} 筆</span>
            <span className="upload-chip">{latestDataDate ? `最新資料：${latestDataDate}` : '目前尚未有可分析資料'}</span>
            <span className="upload-chip">{persistedAt ? `最近同步：${new Date(persistedAt).toLocaleString('zh-TW')}` : '目前還沒有同步記錄'}</span>
          </div>
          {importMessage ? <p className="import-feedback success">{importMessage}</p> : null}
          {importError ? <p className="import-feedback error">{importError}</p> : null}
          <div className="info-list">
            <p>1. 把原始 CSV 放進專案的 `data/raw/`。</p>
            <p>2. 執行 `npm run build:data` 產生共用資料檔。</p>
            <p>3. push 到 GitHub 後，Pages 重新部署，所有人就會看到同一份資料。</p>
          </div>
          <div className="import-file-list">
            <div className="panel-head compact">
              <div>
                <h3>已匯入檔案清單</h3>
                <p>這份清單來自目前 repo 裡已經整理進共用資料檔的 CSV。</p>
              </div>
            </div>
            {importedFiles.length > 0 ? (
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
                    {importedFiles.map((file) => (
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
              <div className="empty-state">目前 Supabase 裡還沒有任何匯入期數。</div>
            )}
          </div>
        </section>
      ) : (
        loginCard
      )}

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
                中古屋
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
          <div className="filter-group">
            <span className="filter-label">總價區間（萬）</span>
            <div className="range-grid">
              <label className="range-input">
                <span>最低</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="例如 1000"
                  value={totalPriceRange.min}
                  onChange={(event) => setTotalPriceRange((previous) => ({ ...previous, min: event.target.value }))}
                />
              </label>
              <label className="range-input">
                <span>最高</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="例如 1500"
                  value={totalPriceRange.max}
                  onChange={(event) => setTotalPriceRange((previous) => ({ ...previous, max: event.target.value }))}
                />
              </label>
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">建坪區間</span>
            <div className="range-grid">
              <label className="range-input">
                <span>最小坪數</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="例如 20"
                  value={totalPingRange.min}
                  onChange={(event) => setTotalPingRange((previous) => ({ ...previous, min: event.target.value }))}
                />
              </label>
              <label className="range-input">
                <span>最大坪數</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="例如 45"
                  value={totalPingRange.max}
                  onChange={(event) => setTotalPingRange((previous) => ({ ...previous, max: event.target.value }))}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <ChartCard title="台南房價變化" subtitle="看看整個台南的房價和成交筆數怎麼變。" actions={<DownloadChartButton chartRef={cityTrendRef} fileName="台南房價變化" />}>
          <div className="chart-wrap large" ref={cityTrendRef}>
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
          <ChartCard title="這一區的價格變化" subtitle="看看這一區的房價和成交筆數怎麼變。" actions={<DownloadChartButton chartRef={districtTrendRef} fileName={`${selectedDistrict}-價格變化`} />}>
            <div className="chart-wrap large" ref={districtTrendRef}>
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

          <ChartCard title="中古屋和預售屋" subtitle="看看大家比較常買哪一種。">
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

      <ChartCard title="幾個行政區一起比" subtitle="把幾個區放在一起，比較誰比較貴。" actions={<DownloadChartButton chartRef={comparisonTrendRef} fileName="行政區價格比較" />}>
        <div className="chart-wrap compare" ref={comparisonTrendRef}>
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
