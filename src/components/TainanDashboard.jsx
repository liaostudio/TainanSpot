import { useRef } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
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
  ArrowLeft,
  Download,
  FileText,
  MapPinned,
} from 'lucide-react'
import { tainanGrid, timeTabs } from '../data/dashboardData.js'
import { buildVolumeSeries, formatPrice, heatColor } from '../utils/dashboard.js'
import { useDashboardModel } from '../hooks/useDashboardModel.js'
import { MetricCard } from './MetricCard.jsx'
import { TrendBadge } from './TrendBadge.jsx'
import { ChartCard } from './ChartCard.jsx'

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

function DataSummaryList({ title, subtitle, items, emptyText = '目前沒有資料' }) {
  return (
    <section className="panel chart-card">
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
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

export function ProjectDetailView({ detail, onBack }) {
  const projectTrendRef = useRef(null)
  const topFloor = detail.floorStats?.[0]
  const latestTrend = detail.trend.at(-1)
  const previousTrend = detail.trend.at(-2)
  const trendChange =
    latestTrend && previousTrend && previousTrend.price > 0
      ? Number((((latestTrend.price - previousTrend.price) / previousTrend.price) * 100).toFixed(1))
      : null

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
          <p className="eyebrow">Community Analysis Desk</p>
            <h2>{detail.projectName}</h2>
            <p className="project-subtitle">這一段只做社區判價分析。先看社區價格定位，再看歷史走勢、樓層差異和最近成交明細。</p>
            <div className="project-badges">
              <span className="upload-chip">以前成交過 {detail.stats.volume} 筆</span>
              <span className="upload-chip">中位數價格 {formatPrice(detail.stats.medianPrice)} 萬/坪</span>
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
          <DetailMetric label="中位數價格" value={`${formatPrice(detail.stats.medianPrice)} 萬/坪`} helper="這個社區大多數成交的大概價格" />
          <DetailMetric label="最近變化" value={trendChange == null ? '-' : <TrendBadge value={trendChange} />} helper="和上一期相比，最近價格有沒有變動" />
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
                <h3>判價重點</h3>
              <p>先看這個社區現在的價格定位和主要成交輪廓。</p>
              </div>
            </div>
            <div className="project-overview-list">
              <div><span>成交筆數</span><strong>{detail.stats.volume} 筆</strong></div>
              <div><span>中位數價格</span><strong>{formatPrice(detail.stats.medianPrice)} 萬/坪</strong></div>
              <div><span>平均總價</span><strong>{detail.stats.avgTotalPrice} 萬</strong></div>
              <div><span>平均建坪</span><strong>{detail.stats.avgPing} 坪</strong></div>
            </div>
          </section>

          <section className="panel project-overview-card">
            <div className="panel-head">
              <div>
                <h3>行情節奏</h3>
                <p>把最近價格和成交節奏濃縮成幾個判斷點。</p>
              </div>
            </div>
            <div className="project-summary-list">
              <div>
                <span>最近價格</span>
                <strong>{latestTrend ? `${formatPrice(latestTrend.price)} 萬/坪` : '目前資料不多'}</strong>
              </div>
              <div>
                <span>成交節奏</span>
                <strong>{latestTrend?.volume || detail.stats.volume} 筆近期成交可參考</strong>
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
          title="社區價格趨勢"
          subtitle="主圖只回答一件事：這個社區現在的價格，在歷史上算高、算低，還是差不多。"
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
                <Bar yAxisId="left" dataKey="volume" name="成交筆數" fill="#efc27b" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                <Line yAxisId="right" dataKey="price" name="中位數價格" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                <Line yAxisId="right" dataKey="maPrice" name="移動平均線" type="monotone" stroke="#059669" strokeWidth={2.5} strokeDasharray="6 5" dot={false} isAnimationActive={false} />
                <ReferenceLine yAxisId="right" y={detail.stats.maxRecord?.unitPricePing} stroke="#dc2626" strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: '歷史天花板', fill: '#dc2626', fontSize: 11 }} />
                <ReferenceLine yAxisId="right" y={detail.stats.minRecord?.unitPricePing} stroke="#059669" strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: '歷史地板', fill: '#059669', fontSize: 11 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <div className="project-detail-grid">
        <ChartCard title="樓層價格差異" subtitle="看樓層和價格、坪數的關係，這是談價時最常用的參考。">
          <div className="chart-wrap medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detail.floorStats} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                <Legend />
                <Bar dataKey="avgPrice" name="樓層中位數價格" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
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
  const {
    districtActiveTab,
    setDistrictActiveTab,
    selectedDistrict,
    setSelectedDistrict,
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
    persistedAt,
    storageMode,
    isSharedMode,
    importedFiles,
    availableDistricts,
    citySummary,
    cityTrend,
    cityVolumeTrend,
    realOverviews,
    districtRecords,
    districtTrend,
    ageDistribution,
    roomMix,
    selectedDistrictOverview,
    minPrice,
    maxPrice,
  } = model
  const ageDistributionItems = ageDistribution.map((item) => ({
    name: item.ageGroup,
    value: `${item.volume} 筆 / 均價 ${formatPrice(item.price)} 萬`,
  }))
  const roomMixItems = roomMix.map((item) => ({ name: item.name, value: `${item.value} 筆` }))

  const exportPdfReport = async () => {
    const [cityChart, districtChart] = await Promise.all([
      chartToDataUrl(cityTrendRef),
      chartToDataUrl(districtTrendRef),
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
            <div class="card"><div class="label">台南整體價格</div><div class="value">${formatPrice(citySummary.price)} 萬/坪</div><div class="helper">整體市場價格基準</div></div>
            <div class="card"><div class="label">${selectedDistrict} 中位數價格</div><div class="value">${formatPrice(selectedDistrictOverview?.price)} 萬/坪</div><div class="helper">當前行政區常見價格</div></div>
            <div class="card"><div class="label">最新資料</div><div class="value">${latestDataDate || '-'}</div><div class="helper">目前分析資料時間</div></div>
            <div class="card"><div class="label">已匯入期數</div><div class="value">${importedFiles.length} 期</div><div class="helper">可在匯入清單管理</div></div>
          </div>
          ${safeImage(cityChart, '台南房價變化')}
          ${safeImage(districtChart, `${selectedDistrict} 價格變化`)}
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
        <div className="hero-copy hero-copy-compact pro-hero-copy">
          <p className="eyebrow">Professional Analysis Desk</p>
          <h1>專業分析台</h1>
          <p className="hero-lead">這一段只放分析和判斷會用到的東西：篩選器、關鍵數據、主圖、熱圖和匯出工具。</p>
        </div>
        <div className="metric-grid pro-metric-grid">
          <MetricCard label="目前分析行政區" value={selectedDistrict} helper="先確認現在正在看哪一區" accent="slate" />
          <MetricCard label="行政區價格" value={`${formatPrice(selectedDistrictOverview?.price)} 萬/坪`} helper="這一區目前常見價格" accent="blue" />
          <MetricCard label="行政區漲跌" value={<TrendBadge value={selectedDistrictOverview?.yoy} />} helper="快速看最近價格方向" accent="amber" />
          <MetricCard label="行政區成交筆數" value={`${selectedDistrictOverview?.volume ?? '-'} 筆`} helper="筆數越多，代表這區越熱" accent="green" />
          <MetricCard label="台南整體價格" value={`${formatPrice(citySummary.price)} 萬/坪`} helper={isRealMode ? `最新資料到 ${latestDataDate}` : '現在是展示用範例資料'} accent="slate" />
        </div>
        <div className="hero-actions-row pro-toolbar">
          <PdfReportButton onExport={exportPdfReport} />
        </div>
      </header>

      {canManageImports ? (
        <section className="panel upload-panel">
          <div className="panel-head compact">
            <div>
              <h3>GitHub 共用資料管理</h3>
              <p>把新一期 CSV 放進 `data/raw/`，重新部署後，全站就會更新成同一份資料。</p>
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
            <h3>分析篩選器</h3>
            <p>先定義條件，再看下面所有圖和排行。</p>
          </div>
        </div>
        <div className="filter-row">
          <div className="time-tabs">
            {timeTabs.map((tab) => (
              <button key={tab.id} type="button" className={tab.id === districtActiveTab ? 'is-active' : ''} onClick={() => setDistrictActiveTab(tab.id)}>
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
        </div>
      </section>

      <section className="dashboard-grid">
        <ChartCard title="台南全市價量走勢" subtitle="用一張主圖看整個台南目前的價格方向和成交熱度。" actions={<DownloadChartButton chartRef={cityTrendRef} fileName="台南房價變化" />}>
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
                <Line yAxisId="right" dataKey="price" name="中位數價格" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="right" dataKey="maPrice" name="移動平均線" type="monotone" stroke="#059669" strokeWidth={2.5} strokeDasharray="6 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="行政區價格熱圖" subtitle="顏色越深代表價格越高，方便快速抓各區價格位置。">
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

        <div className="metric-grid district-metrics">
          <MetricCard label="行政區價格" value={`${formatPrice(selectedDistrictOverview?.price)} 萬/坪`} helper="這一區目前常見價格" accent="blue" />
          <MetricCard label="行政區漲跌" value={<TrendBadge value={selectedDistrictOverview?.yoy} />} helper="快速看最近是漲還是跌" accent="amber" />
          <MetricCard label="行政區成交筆數" value={`${selectedDistrictOverview?.volume ?? '-'} 筆`} helper="數字越大，代表成交越熱" accent="slate" />
          <MetricCard label="主力房型" value={roomMix[0]?.name ?? '-'} helper="先看這區主要成交哪一種房型" accent="green" />
        </div>

        <div className="dashboard-grid">
          <ChartCard title="行政區價量走勢" subtitle="主圖用來判斷這一區價格方向和成交節奏。" actions={<DownloadChartButton chartRef={districtTrendRef} fileName={`${selectedDistrict}-價格變化`} />}>
            <div className="chart-wrap large" ref={districtTrendRef}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={districtTrend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#1d4ed8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="volume" name="成交筆數" fill="#efc27b" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                  <Line yAxisId="right" dataKey="price" name="中位數價格" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line yAxisId="right" dataKey="maPrice" name="移動平均線" type="monotone" stroke="#059669" strokeWidth={2.5} strokeDasharray="6 5" dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <DataSummaryList title="屋齡結構" subtitle="用數量和均價直接看目前成交主力偏新屋還是偏舊屋。" items={ageDistributionItems} />
        </div>

        <div className="dashboard-grid">
          <DataSummaryList title="房型結構" subtitle="看這一區最常成交的是幾房。" items={roomMixItems} />

          <ChartCard title="成交熱度" subtitle="成交筆數越多，通常代表這一區目前比較熱。">
            <div className="chart-wrap medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildVolumeSeries(districtRecords, districtActiveTab).length > 0 ? buildVolumeSeries(districtRecords, districtActiveTab) : cityVolumeTrend} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                  <Bar dataKey="volume" name="成交筆數" fill="#d97706" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </section>
    </div>
  )
}

export function TainanDashboard() {
  const model = useDashboardModel()
  return <TainanDashboardView model={model} />
}
