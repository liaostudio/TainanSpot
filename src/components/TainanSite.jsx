import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Building2,
  FileText,
  Home,
  LockKeyhole,
  MapPinned,
  LogOut,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useDashboardModel } from '../hooks/useDashboardModel.js'
import { formatPrice } from '../utils/dashboard.js'
import { MetricCard } from './MetricCard.jsx'
import { ChartCard } from './ChartCard.jsx'
import { TrendBadge } from './TrendBadge.jsx'

const LazyDashboardView = lazy(() =>
  import('./TainanDashboard.jsx').then((module) => ({ default: module.TainanDashboardView })),
)
const LazyProjectDetailView = lazy(() =>
  import('./TainanDashboard.jsx').then((module) => ({ default: module.ProjectDetailView })),
)

const routeTabs = [
  { id: 'home', label: '首頁', icon: Home },
  { id: 'district', label: '行政區找房', icon: MapPinned },
  { id: 'pro', label: '專業分析', icon: BarChart3 },
  { id: 'about', label: '資料說明', icon: FileText },
]

const pieColors = ['#b45309', '#d97706', '#f59e0b', '#fbbf24']
const ADMIN_SESSION_KEY = 'tainanspot-admin-auth'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '1234'

function normalizePassword(value) {
  return value.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 65248))
}

function buildHash(page, projectName) {
  if (page === 'project' && projectName) return `#project/${encodeURIComponent(projectName)}`
  return `#${page}`
}

function readHash() {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return { page: 'home', projectName: null }
  if (hash.startsWith('project/')) {
    return {
      page: 'project',
      projectName: decodeURIComponent(hash.replace('project/', '')),
    }
  }
  if (['home', 'district', 'pro', 'about'].includes(hash)) return { page: hash, projectName: null }
  return { page: 'home', projectName: null }
}

function SiteNav({ page, onNavigate }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button type="button" className="brand-mark" onClick={() => onNavigate('home')}>
          <Building2 size={22} />
          <span>TainanSpot</span>
        </button>

        <nav className="site-nav">
          {routeTabs.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={page === item.id ? 'site-nav-link active' : 'site-nav-link'}
                onClick={() => onNavigate(item.id)}
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

function HomePage({ model, onNavigate, onOpenProject }) {
  const topDistricts = model.realOverviews.slice(0, 8)
  const hottestProjects = model.rankings.slice(0, 6)

  return (
    <div className="page-stack">
      <section className="site-hero panel dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">Tainan Market Dashboard</p>
          <h1>用數據和趨勢圖，快速看懂台南房價。</h1>
          <p className="site-hero-lead">
            先看全市價格在哪裡、最近走勢怎麼變，再往下看行政區和社區排行。
            這個首頁的重點只有一件事：讓你 30 秒內掌握現在市場大概在哪裡。
          </p>
          <div className="cta-row">
            <button type="button" className="cta-primary" onClick={() => onNavigate('district')}>
              直接看行政區分析
              <ArrowRight size={16} />
            </button>
            <button type="button" className="cta-secondary" onClick={() => onNavigate('pro')}>
              進入專業分析
            </button>
          </div>
        </div>
        <div className="dashboard-hero-side">
          <div className="hero-highlight-card">
            <span>全市平均價格</span>
            <strong>{formatPrice(model.citySummary.price)} 萬/坪</strong>
            <p>{model.latestDataDate ? `資料最新到 ${model.latestDataDate}` : '展示資料模式'}</p>
          </div>
          <div className="hero-highlight-card">
            <span>最近有沒有變貴</span>
            <strong><TrendBadge value={model.citySummary.yoy} /></strong>
            <p>快速看全市目前是升溫還是盤整</p>
          </div>
          <div className="hero-highlight-card">
            <span>成交筆數</span>
            <strong>{model.citySummary.volume} 筆</strong>
            <p>資料越多，越能代表現在市場狀況</p>
          </div>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard label="全市平均價格" value={`${formatPrice(model.citySummary.price)} 萬/坪`} helper="目前整體市場大概價格" accent="blue" />
        <MetricCard label="最近有沒有變貴" value={<TrendBadge value={model.citySummary.yoy} />} helper="快速看漲跌方向" accent="amber" />
        <MetricCard label="成交筆數" value={`${model.citySummary.volume} 筆`} helper={model.latestDataDate ? `最新到 ${model.latestDataDate}` : '展示資料模式'} accent="slate" />
        <MetricCard label="最熱行政區" value={model.citySummary.hottest?.name ?? '-'} helper="目前價格最高的行政區" accent="green" />
        <MetricCard label="最親民行政區" value={model.citySummary.mostAffordable?.name ?? '-'} helper="目前價格相對低的行政區" accent="slate" />
      </div>

      <section className="dashboard-grid">
        <ChartCard title="台南全市價格走勢" subtitle="先看全市趨勢，知道市場現在是在往上、往下，還是盤整。">
          <div className="chart-wrap large">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={model.cityTrend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#1d4ed8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                <Bar yAxisId="left" dataKey="volume" name="成交筆數" fill="#efc27b" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" dataKey="price" name="平均價格" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <section className="panel simple-list-panel">
          <div className="panel-head">
            <div>
              <h3>行政區排行</h3>
              <p>先看哪些區目前價格高、資料多，最容易抓到整體市場位置。</p>
            </div>
          </div>
          <div className="simple-list">
            {topDistricts.map((district) => (
              <button
                key={district.name}
                type="button"
                className="simple-list-item"
                onClick={() => {
                  model.setSelectedDistrict(district.name)
                  onNavigate('district')
                }}
              >
                <div>
                  <strong>{district.name}</strong>
                  <p>{district.volume} 筆成交</p>
                </div>
                <span>{formatPrice(district.price)} 萬/坪</span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="dashboard-grid">
        <ChartCard title="全市成交筆數變化" subtitle="看成交筆數有沒有放大，能幫助判斷市場熱度。">
          <div className="chart-wrap large">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={model.cityVolumeTrend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                <Bar dataKey="volume" name="成交筆數" fill="#d4a15f" radius={[8, 8, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <section className="panel simple-list-panel">
          <div className="panel-head">
            <div>
              <h3>熱門社區排行</h3>
              <p>直接從成交最活躍的社區開始看，最適合拿來判斷行情。</p>
            </div>
          </div>
          <div className="simple-list">
            {hottestProjects.map((project) => (
              <button key={project.name} type="button" className="simple-list-item" onClick={() => onOpenProject(project.name)}>
                <div>
                  <strong>{project.name}</strong>
                  <p>{project.type} / {project.volume} 筆成交</p>
                </div>
                <span>{formatPrice(project.medianPrice)} 萬/坪</span>
              </button>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}

function DistrictPage({ model, onNavigate, onOpenProject }) {
  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">District Analysis</p>
          <h1>{model.selectedDistrict} 區行情分析</h1>
          <p className="site-hero-lead">
            先看指標，再看趨勢圖，最後看社區排行。這頁只做一件事：幫你快速判斷這一區的行情位置。
          </p>
        </div>
        <label className="district-picker">
          <span>換一個行政區</span>
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
            <h3>分析視角</h3>
            <p>切換首購或換屋，下面的價格與社區排行會一起更新。</p>
          </div>
        </div>
        <div className="chip-row">
          <button type="button" className={model.buyerScenario === 'all' ? 'chip active' : 'chip'} onClick={() => model.setBuyerScenario('all')}>
            我先看全部
          </button>
          <button type="button" className={model.buyerScenario === 'starter' ? 'chip active' : 'chip'} onClick={() => model.setBuyerScenario('starter')}>
            我是首購（看 1-2 房）
          </button>
          <button type="button" className={model.buyerScenario === 'upgrade' ? 'chip active' : 'chip'} onClick={() => model.setBuyerScenario('upgrade')}>
            我是換屋（看 3-4 房）
          </button>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard label="平均價格" value={`${formatPrice(model.scenarioDistrictOverview?.price)} 萬/坪`} helper="這區大概價格" accent="blue" />
        <MetricCard label="最近有沒有變貴" value={<TrendBadge value={model.scenarioDistrictOverview?.yoy} />} helper="快速看漲跌" accent="amber" />
        <MetricCard label="主流總價帶" value={model.districtTotalPriceBand.label} helper="大多數買方大概落在這個總價區間" accent="slate" />
        <MetricCard label="成交筆數" value={`${model.scenarioDistrictOverview?.volume ?? '-'} 筆`} helper="筆數越多，代表成交越熱" accent="slate" />
        <MetricCard label="一句話看法" value={model.insights.health} helper={`${model.insights.structure} / ${model.insights.momentum}`} accent="green" />
      </div>

      <section className="dashboard-grid">
        <ChartCard title="這一區的價格變化" subtitle="先看這一區最近是變貴、變便宜，還是差不多。">
          <div className="chart-wrap large">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={model.scenarioDistrictTrend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfce" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#7c6855' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8b6b36' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#1d4ed8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                <Bar yAxisId="left" dataKey="volume" name="成交筆數" fill="#efc27b" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" dataKey="price" name="平均價格" type="monotone" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="大家最常買什麼房子" subtitle="這張圖可以幫你看，這區主要是幾房和哪一種房子。">
          <div className="stacked-mini-grid">
            <div className="chart-wrap small">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={model.scenarioRoomMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={84} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {model.scenarioRoomMix.map((entry, index) => (
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
                  <Pie data={model.scenarioTypeMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={84} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {model.scenarioTypeMix.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[(index + 1) % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #eadfce', background: 'rgba(255,252,247,0.98)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartCard>
      </section>

      <section className="dashboard-grid">
        <section className="panel simple-list-panel">
          <div className="panel-head">
            <div>
              <h3>這一區熱門社區</h3>
              <p>先從成交最活躍的社區開始看，最容易抓到區域主流行情。</p>
            </div>
          </div>
          <div className="simple-list">
            {model.scenarioRankings.map((project) => (
              <button key={project.name} type="button" className="simple-list-item" onClick={() => onOpenProject(project.name)}>
                <div>
                  <strong>{project.name}</strong>
                  <p>{project.type} / 主流總價 {project.totalPriceBandLabel}</p>
                </div>
                <span>{formatPrice(project.medianPrice)} 萬/坪</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel simple-list-panel">
          <div className="panel-head">
            <div>
              <h3>高性價比社區</h3>
              <p>成交穩定、價格比本區平均更親切的社區，適合先拿來比較。</p>
            </div>
          </div>
          <div className="simple-list">
            {model.valueProjects.length > 0 ? (
              model.valueProjects.map((project) => (
                <button key={project.name} type="button" className="simple-list-item" onClick={() => onOpenProject(project.name)}>
                  <div>
                    <strong>{project.name}</strong>
                    <p>{project.volume} 筆成交 / 主流總價 {project.totalPriceBandLabel}</p>
                  </div>
                  <span>{formatPrice(project.medianPrice)} 萬/坪</span>
                </button>
              ))
            ) : (
              <div className="empty-state">目前這個條件下，還沒有特別明顯的高 CP 值社區。</div>
            )}
          </div>
        </section>
      </section>

      <section className="district-cta-row">
        <button type="button" className="cta-secondary" onClick={() => onNavigate('pro')}>
          看更多專業圖表
        </button>
      </section>
    </div>
  )
}

function AboutPage() {
  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">About The Data</p>
          <h1>這些資料怎麼來？</h1>
          <p className="site-hero-lead">
            這一頁專門說明資料來源、計算方式和排除規則，讓使用者知道這些數字是怎麼整理出來的。
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
              <h3>網站怎麼算價格</h3>
              <p>網站會先整理資料，再算出每一區和每個社區的平均價格、成交筆數和趨勢。</p>
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
              <h3>提醒你</h3>
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

export function TainanSite() {
  const model = useDashboardModel()
  const [route, setRoute] = useState({ page: 'home', projectName: null })
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [adminAuthError, setAdminAuthError] = useState('')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  useEffect(() => {
    const syncFromHash = () => {
      setRoute(readHash())
    }

    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsAdminAuthenticated(window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true')
  }, [])

  const projectDetail = useMemo(
    () => (route.page === 'project' ? model.getProjectDetail(route.projectName) : null),
    [model, route.page, route.projectName],
  )

  const navigate = (page, options = {}) => {
    const nextHash = buildHash(page, options.projectName)
    window.location.hash = nextHash
  }

  const openProject = (projectName) => {
    navigate('project', { projectName })
  }

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
      <SiteNav page={route.page} onNavigate={navigate} />

      <main className="site-main">
        {route.page === 'home' ? <HomePage model={model} onNavigate={navigate} onOpenProject={openProject} /> : null}
        {route.page === 'district' ? <DistrictPage model={model} onNavigate={navigate} onOpenProject={openProject} /> : null}
        {route.page === 'pro' ? (
          <Suspense fallback={<section className="panel"><p>正在載入專業分析頁...</p></section>}>
            <LazyDashboardView
              model={model}
              onSelectProject={openProject}
              canManageImports={isAdminAuthenticated}
              onLogoutImports={handleAdminLogout}
              loginCard={
                <AdminLoginCard
                  password={adminPasswordInput}
                  onPasswordChange={setAdminPasswordInput}
                  onSubmit={handleAdminLogin}
                  authError={adminAuthError}
                />
              }
            />
          </Suspense>
        ) : null}
        {route.page === 'about' ? <AboutPage /> : null}
        {route.page === 'project' && projectDetail ? (
          <Suspense fallback={<section className="panel"><p>正在載入社區資料...</p></section>}>
            <LazyProjectDetailView detail={projectDetail} onBack={() => navigate('district')} />
          </Suspense>
        ) : null}
      </main>
    </div>
  )
}
