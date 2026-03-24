# TainanSpot Single-File Reference

這是把目前主要頁面程式碼整理成單一檔案的閱讀版，方便一次查看。正式執行版本仍以 src/ 內的模組化檔案為主。

## src/App.jsx

```jsx
import './App.css'
import { TainanSite } from './components/TainanSite.jsx'

function App() {
  return <TainanSite />
}

export default App

```

## src/components/TainanSite.jsx

```jsx
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Building2,
  FileText,
  Home,
  LockKeyhole,
  MapPinned,
  LogOut,
  Search,
  ShieldCheck,
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
import { ProjectDetailView, TainanDashboardView } from './TainanDashboard.jsx'

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
          <p>只有輸入管理密碼後，才會顯示 CSV 累積匯入工具。</p>
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
  const topDistricts = model.realOverviews.slice(0, 6)

  return (
    <div className="page-stack">
      <section className="site-hero panel">
        <div className="site-hero-copy">
          <p className="eyebrow">Consumer First</p>
          <h1>先用白話看懂台南房價，再決定要不要深入研究。</h1>
          <p className="site-hero-lead">
            如果你是買房的人，先看這一區大概多少錢、最近有沒有變貴、哪幾個社區最熱門。
            如果你是房仲，再進專業分析頁看完整資料。
          </p>
          <div className="cta-row">
            <button type="button" className="cta-primary" onClick={() => onNavigate('district')}>
              先看行政區
              <ArrowRight size={16} />
            </button>
            <button type="button" className="cta-secondary" onClick={() => onNavigate('pro')}>
              進入專業分析
            </button>
          </div>
        </div>
        <div className="hero-summary-grid">
          <MetricCard label="台南平均價格" value={`${formatPrice(model.citySummary.price)} 萬/坪`} helper="整體市場大概價格" accent="blue" />
          <MetricCard label="最近有沒有變貴" value={<TrendBadge value={model.citySummary.yoy} />} helper="快速看漲跌" accent="amber" />
          <MetricCard label="成交筆數" value={`${model.citySummary.volume} 筆`} helper={model.latestDataDate ? `最新到 ${model.latestDataDate}` : '展示資料模式'} accent="slate" />
          <MetricCard label="最受注意的區" value={model.citySummary.hottest?.name ?? '-'} helper="目前價格最高的行政區" accent="green" />
        </div>
      </section>

      <section className="dashboard-grid">
        <ChartCard title="台南房價變化" subtitle="先看整體走勢，知道現在市場是在往上還是比較平。">
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
              <h3>先看熱門行政區</h3>
              <p>這些區最近資料比較多，也比較容易先看出市場感覺。</p>
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
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>這個網站怎麼用</h3>
              <p>先用最簡單的方式找資料，不用一開始就看一堆圖。</p>
            </div>
          </div>
          <div className="steps-grid">
            <article className="step-card">
              <span>1</span>
              <strong>先挑行政區</strong>
              <p>先看哪一區價格大概多少、最近有沒有變貴。</p>
            </article>
            <article className="step-card">
              <span>2</span>
              <strong>再看熱門社區</strong>
              <p>找出大家最常買、最常成交的社區。</p>
            </article>
            <article className="step-card">
              <span>3</span>
              <strong>最後看專業資料</strong>
              <p>如果你是房仲，再進專業分析頁看完整圖表。</p>
            </article>
          </div>
        </section>

        <section className="panel cta-panel">
          <div className="panel-head">
            <div>
              <h3>你是誰？</h3>
              <p>不同的人，適合看的頁面不一樣。</p>
            </div>
          </div>
          <div className="persona-grid">
            <button type="button" className="persona-card" onClick={() => onNavigate('district')}>
              <Search size={20} />
              <strong>我是買房的人</strong>
              <p>想先看哪一區比較適合我。</p>
            </button>
            <button type="button" className="persona-card" onClick={() => onNavigate('pro')}>
              <BarChart3 size={20} />
              <strong>我是房仲</strong>
              <p>我要更多篩選器、比較圖和 CSV 匯入。</p>
            </button>
            <button type="button" className="persona-card" onClick={() => onNavigate('about')}>
              <ShieldCheck size={20} />
              <strong>我想先看資料怎麼來</strong>
              <p>想知道這些數字怎麼算、哪些資料有排除。</p>
            </button>
          </div>
        </section>
      </section>

      <section className="panel simple-list-panel">
        <div className="panel-head">
          <div>
            <h3>熱門社區入口</h3>
            <p>從這裡直接進社區頁，先看最常被查的地方。</p>
          </div>
        </div>
        <div className="simple-chip-list">
          {model.rankings.slice(0, 8).map((project) => (
            <button key={project.name} type="button" className="chip" onClick={() => onOpenProject(project.name)}>
              {project.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function DistrictPage({ model, onNavigate, onOpenProject }) {
  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">District Page</p>
          <h1>{model.selectedDistrict} 這一區好不好看？</h1>
          <p className="site-hero-lead">
            先看這一區大概多少錢、最近有沒有變貴，再看哪些社區比較熱門。
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

      <div className="metric-grid">
        <MetricCard label="平均價格" value={`${formatPrice(model.selectedDistrictOverview?.price)} 萬/坪`} helper="這區大概價格" accent="blue" />
        <MetricCard label="最近有沒有變貴" value={<TrendBadge value={model.selectedDistrictOverview?.yoy} />} helper="快速看漲跌" accent="amber" />
        <MetricCard label="成交筆數" value={`${model.selectedDistrictOverview?.volume ?? '-'} 筆`} helper="筆數越多，代表成交越熱" accent="slate" />
        <MetricCard label="一句話看法" value={model.insights.health} helper={`${model.insights.structure} / ${model.insights.momentum}`} accent="green" />
      </div>

      <section className="dashboard-grid">
        <ChartCard title="這一區的價格變化" subtitle="先看這一區最近是變貴、變便宜，還是差不多。">
          <div className="chart-wrap large">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={model.districtTrend} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
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
                  <Pie data={model.roomMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={84} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {model.roomMix.map((entry, index) => (
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
                  <Pie data={model.typeMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={84} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {model.typeMix.map((entry, index) => (
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

      <section className="panel simple-list-panel">
        <div className="panel-head">
          <div>
            <h3>這一區熱門社區</h3>
            <p>先從大家最常成交的社區開始看，通常最容易抓到區域感覺。</p>
          </div>
        </div>
        <div className="simple-list">
          {model.rankings.map((project) => (
            <button key={project.name} type="button" className="simple-list-item" onClick={() => onOpenProject(project.name)}>
              <div>
                <strong>{project.name}</strong>
                <p>{project.type}</p>
              </div>
              <span>{formatPrice(project.medianPrice)} 萬/坪</span>
            </button>
          ))}
        </div>
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
              <p>目前以內政部實價登錄公開資料為主，也支援你自己匯入 CSV。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 可自動讀取 `public` 裡的房價資料檔。</p>
            <p>2. 也可以手動上傳 `CSV`。</p>
            <p>3. 匯入後會自動整理成行政區、社區和時間趨勢。</p>
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
          <TainanDashboardView
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
        ) : null}
        {route.page === 'about' ? <AboutPage /> : null}
        {route.page === 'project' && projectDetail ? <ProjectDetailView detail={projectDetail} onBack={() => navigate('district')} /> : null}
      </main>
    </div>
  )
}

```

## src/components/TainanDashboard.jsx

```jsx
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

export function TainanDashboardView({ model, onSelectProject, canManageImports = false, onLogoutImports, loginCard = null }) {
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)
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
    persistedAt,
    loadFiles,
    clearImportedData,
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

      {canManageImports ? (
        <section className="panel upload-panel">
          <div className="panel-head compact">
            <div>
              <h3>CSV 累積匯入</h3>
              <p>可以一次匯入很多期 CSV，資料會累積存在這台電腦，下次打開會自動接續。</p>
            </div>
            <div className="upload-actions">
              <button type="button" className="upload-trigger secondary" onClick={() => folderInputRef.current?.click()}>
                {isProcessing ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
                匯入資料夾
              </button>
              <button type="button" className="upload-trigger" onClick={() => fileInputRef.current?.click()}>
                {isProcessing ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
                匯入多個 CSV
              </button>
              <button type="button" className="upload-trigger ghost" onClick={() => clearImportedData()}>
                清除累積資料
              </button>
              <button type="button" className="upload-trigger ghost" onClick={onLogoutImports}>
                登出管理
              </button>
            </div>
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
            <input
              ref={folderInputRef}
              type="file"
              accept=".csv"
              multiple
              webkitdirectory=""
              directory=""
              hidden
              onChange={(event) => {
                const files = Array.from(event.target.files || []).filter((file) => file.name.toLowerCase().endsWith('.csv'))
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
            <span className="upload-chip">{persistedAt ? `上次累積保存：${new Date(persistedAt).toLocaleString('zh-TW')}` : '目前還沒有保存過累積資料'}</span>
          </div>
          {importMessage ? <p className="import-feedback success">{importMessage}</p> : null}
          {importError ? <p className="import-feedback error">{importError}</p> : null}
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

```

## src/hooks/useDashboardModel.js

```jsx
import { useEffect, useMemo, useState } from 'react'
import {
  cityTrendByTab,
  comparisonSeries,
  districtOverviews,
  districtTrendMap,
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
  groupRecordsByDistrict,
  processTrendData,
  summarizeCity,
  withMovingAverage,
  checkBuildingMatch,
} from '../utils/dashboard.js'
import { useHousingData } from './useHousingData.js'

export function useDashboardModel() {
  const [activeTab, setActiveTab] = useState('1y')
  const [selectedDistrict, setSelectedDistrict] = useState('東區')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState(['existing', 'presale'])
  const [buildingFilter, setBuildingFilter] = useState(['elevator', 'apartment', 'house', 'store'])
  const {
    isProcessing,
    recordsByDistrict,
    uploadStats,
    latestDataDate,
    isRealMode,
    importMessage,
    importError,
    loadFiles,
  } = useHousingData()

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
    () =>
      isRealMode
        ? buildPopularLocations(districtBaseRecords)
        : (districtData.rankings || []).map((item) => item.name),
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
        isRealMode
          ? processTrendData(districtRecords, activeTab)
          : districtData.trend[activeTab] ?? districtData.trend['1y'],
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
    () =>
      isRealMode
        ? buildRoomLayout(districtRecords)
        : [
            { name: '2房', value: 45 },
            { name: '3房', value: 33 },
            { name: '1房', value: 12 },
            { name: '4房以上', value: 10 },
          ],
    [districtRecords, isRealMode],
  )

  const typeMix = useMemo(
    () =>
      isRealMode
        ? buildPropertyTypeMix(districtRecords)
        : [
            { name: '中古屋', value: 65 },
            { name: '預售屋', value: 35 },
          ],
    [districtRecords, isRealMode],
  )

  const comparisonData = useMemo(
    () =>
      isRealMode
        ? buildComparisonSeries(filteredRecordsByDistrict, availableDistricts.slice(0, 4), activeTab)
        : comparisonSeries,
    [activeTab, availableDistricts, filteredRecordsByDistrict, isRealMode],
  )

  const selectedDistrictOverview = useMemo(
    () => realOverviews.find((item) => item.name === selectedDistrict) ?? null,
    [realOverviews, selectedDistrict],
  )

  const minPrice = Math.min(...realOverviews.map((item) => item.price))
  const maxPrice = Math.max(...realOverviews.map((item) => item.price))

  useEffect(() => {
    if (availableDistricts.length > 0 && !availableDistricts.includes(selectedDistrict)) {
      setSelectedDistrict(availableDistricts[0])
    }
  }, [availableDistricts, selectedDistrict])

  useEffect(() => {
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

  const getProjectDetail = (projectName) => {
    if (!projectName) return null
    if (isRealMode) return buildProjectDetail(projectName, districtBaseRecords)

    const ranking = rankings.find((item) => item.name === projectName)
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
  }

  return {
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
    districtBaseRecords,
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
    getProjectDetail,
  }
}

```

## src/hooks/useHousingData.js

```jsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { runCSVWorker } from '../utils/csvParser.js'
import { clearStoredDataset, loadStoredDataset, saveStoredDataset } from '../utils/importStore.js'

const AUTOLOAD_FILES = [
  { path: './data_existing.csv', type: 'existing' },
  { path: './data_presale.csv', type: 'presale' },
]

function groupByDistrict(records) {
  const map = new Map()
  records.forEach((record) => {
    if (!map.has(record.district)) map.set(record.district, [])
    map.get(record.district).push(record)
  })
  return map
}

export function useHousingData() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [rawTransactions, setRawTransactions] = useState([])
  const [importMessage, setImportMessage] = useState('')
  const [importError, setImportError] = useState('')
  const [persistedAt, setPersistedAt] = useState('')
  const [uploadStats, setUploadStats] = useState({
    totalRaw: 0,
    totalExcluded: 0,
    duplicateCount: 0,
  })

  const applyDataset = useCallback((records, stats) => {
    setRawTransactions(records)
    setUploadStats(stats)
  }, [])

  const persistDataset = useCallback(async (records, stats) => {
    const saved = await saveStoredDataset({ records, uploadStats: stats })
    if (saved?.savedAt) setPersistedAt(saved.savedAt)
  }, [])

  const ingestFiles = useCallback(async (files, existingRecords, currentStats) => {
    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))
    const nextRecords = []
    const existingKeys = existingRecords.map((record) => record.key)
    let totalRaw = currentStats.totalRaw
    let totalExcluded = currentStats.totalExcluded
    let duplicateCount = currentStats.duplicateCount
    let currentRaw = 0
    let currentExcluded = 0
    let currentDuplicate = 0

    for (const file of sortedFiles) {
      const text = 'text' in file ? await file.text() : ''
      const lowerName = file.name.toLowerCase()
      const propertyType =
        lowerName.includes('presale') || lowerName.includes('_b') ? 'presale' : 'existing'

      const parsed = await runCSVWorker(text, propertyType, existingKeys)
      nextRecords.push(...parsed.records)
      parsed.records.forEach((record) => existingKeys.push(record.key))
      totalRaw += parsed.totalProcessedRows
      totalExcluded += parsed.filterCount
      duplicateCount += parsed.duplicateCount
      currentRaw += parsed.totalProcessedRows
      currentExcluded += parsed.filterCount
      currentDuplicate += parsed.duplicateCount
    }

    return {
      mergedRecords: [...existingRecords, ...nextRecords],
      stats: { totalRaw, totalExcluded, duplicateCount },
      fileCount: sortedFiles.length,
      currentRaw,
      currentExcluded,
      currentDuplicate,
      nextRecordsCount: nextRecords.length,
    }
  }, [])

  const loadFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return
    setIsProcessing(true)
    setImportError('')
    setImportMessage(`正在整理 ${files.length} 個檔案，檔案很多時請稍等一下。`)

    try {
      const result = await ingestFiles(files, rawTransactions, uploadStats)
      applyDataset(result.mergedRecords, result.stats)
      await persistDataset(result.mergedRecords, result.stats)

      if (result.nextRecordsCount > 0) {
        setImportMessage(
          `已累積匯入 ${result.fileCount} 個檔案，新增 ${result.nextRecordsCount.toLocaleString()} 筆有效資料。處理 ${result.currentRaw.toLocaleString()} 筆，排除 ${result.currentExcluded.toLocaleString()} 筆，重複 ${result.currentDuplicate.toLocaleString()} 筆。資料已存到這台電腦，下次打開會自動接續。`,
        )
      } else {
        setImportMessage(
          `已讀取 ${result.fileCount} 個檔案，但沒有新增有效資料。共處理 ${result.currentRaw.toLocaleString()} 筆，排除 ${result.currentExcluded.toLocaleString()} 筆，重複 ${result.currentDuplicate.toLocaleString()} 筆。`,
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV 解析失敗'
      setImportError(`匯入失敗：${message}`)
    } finally {
      setIsProcessing(false)
    }
  }, [applyDataset, ingestFiles, persistDataset, rawTransactions, uploadStats])

  const clearImportedData = useCallback(async () => {
    setIsProcessing(true)
    setImportError('')

    try {
      await clearStoredDataset()
      applyDataset([], { totalRaw: 0, totalExcluded: 0, duplicateCount: 0 })
      setPersistedAt('')
      setImportMessage('已清除這台電腦累積的匯入資料。')
    } catch (error) {
      const message = error instanceof Error ? error.message : '清除資料失敗'
      setImportError(`清除失敗：${message}`)
    } finally {
      setIsProcessing(false)
    }
  }, [applyDataset])

  useEffect(() => {
    let cancelled = false

    async function hydrateData() {
      if (typeof window === 'undefined') return
      if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') return

      setIsProcessing(true)

      try {
        let baseRecords = []
        let baseStats = { totalRaw: 0, totalExcluded: 0, duplicateCount: 0 }

        const storedDataset = await loadStoredDataset()
        if (!cancelled && storedDataset?.records?.length) {
          baseRecords = storedDataset.records
          baseStats = storedDataset.uploadStats || baseStats
          applyDataset(baseRecords, baseStats)
          setPersistedAt(storedDataset.savedAt || '')
          setImportMessage(`已讀取這台電腦累積的資料，共 ${storedDataset.records.length.toLocaleString()} 筆有效資料。`)
        }

        let loadedAny = false
        const autoLoadFiles = []

        for (const file of AUTOLOAD_FILES) {
          const response = await fetch(file.path)
          if (!response.ok) continue
          loadedAny = true
          const text = await response.text()
          autoLoadFiles.push(
            new File([text], file.path.split('/').pop() || `${file.type}.csv`, {
              type: 'text/csv',
            }),
          )
        }

        if (!cancelled && loadedAny) {
          const result = await ingestFiles(autoLoadFiles, baseRecords, baseStats)
          applyDataset(result.mergedRecords, result.stats)
          await persistDataset(result.mergedRecords, result.stats)
          if (result.mergedRecords.length > 0 && !storedDataset?.records?.length) {
            setImportMessage(`已自動載入本地資料檔，共 ${result.mergedRecords.length.toLocaleString()} 筆有效資料。`)
          }
        }
      } catch {
        // Keep mock mode when no local CSVs are present.
      } finally {
        if (!cancelled) setIsProcessing(false)
      }
    }

    hydrateData()
    return () => {
      cancelled = true
    }
  }, [applyDataset, ingestFiles, persistDataset])

  const recordsByDistrict = useMemo(() => groupByDistrict(rawTransactions), [rawTransactions])

  const latestDataDate = useMemo(() => {
    if (rawTransactions.length === 0) return null
    let maxYear = 0
    let maxMonth = 0

    rawTransactions.forEach((record) => {
      if (record.year > maxYear || (record.year === maxYear && record.month > maxMonth)) {
        maxYear = record.year
        maxMonth = record.month
      }
    })

    return `${maxYear} 年 ${maxMonth} 月`
  }, [rawTransactions])

  return {
    isProcessing,
    rawTransactions,
    recordsByDistrict,
    uploadStats,
    latestDataDate,
    isRealMode: rawTransactions.length > 0,
    importMessage,
    importError,
    persistedAt,
    loadFiles,
    clearImportedData,
  }
}

```

## src/utils/importStore.js

```jsx
const DB_NAME = 'tainanspot-imports'
const DB_VERSION = 1
const STORE_NAME = 'datasets'
const DATASET_KEY = 'housing-data-v1'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('無法開啟本地資料庫'))
  })
}

function withStore(mode, callback) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode)
        const store = transaction.objectStore(STORE_NAME)
        const request = callback(store)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error || new Error('本地資料庫操作失敗'))
        transaction.oncomplete = () => database.close()
        transaction.onerror = () => reject(transaction.error || new Error('本地資料庫交易失敗'))
      }),
  )
}

export function loadStoredDataset() {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null)
  return withStore('readonly', (store) => store.get(DATASET_KEY)).catch(() => null)
}

export function saveStoredDataset(dataset) {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve()
  const payload = {
    ...dataset,
    savedAt: new Date().toISOString(),
  }
  return withStore('readwrite', (store) => store.put(payload, DATASET_KEY)).then(() => payload)
}

export function clearStoredDataset() {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve()
  return withStore('readwrite', (store) => store.delete(DATASET_KEY))
}

```

## src/utils/dashboard.js

```jsx
export function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toFixed(1)
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  const numeric = Number(value)
  return `${numeric > 0 ? '+' : ''}${numeric.toFixed(1)}%`
}

export function withMovingAverage(data) {
  return data.map((item, index, arr) => {
    const slice = arr.slice(Math.max(0, index - 3), index + 1)
    const average = slice.reduce((sum, entry) => sum + entry.price, 0) / slice.length
    return { ...item, maPrice: Number(average.toFixed(2)) }
  })
}

function getMedian(numbers) {
  if (!numbers || numbers.length === 0) return 0
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 !== 0) return sorted[middle]
  return (sorted[middle - 1] + sorted[middle]) / 2
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0)
}

export function groupRecordsByDistrict(records) {
  const map = new Map()
  records.forEach((record) => {
    if (!map.has(record.district)) map.set(record.district, [])
    map.get(record.district).push(record)
  })
  return map
}

export function checkBuildingMatch(record, buildingFilter) {
  if (!buildingFilter || buildingFilter.length === 0) return false
  if (buildingFilter.length >= 4) return true

  const buildType = record.buildType || ''
  const isElevator = buildType.includes('大樓') || buildType.includes('華廈')
  const isApartment = buildType.includes('公寓')
  const isHouse = buildType.includes('透天')
  const isStore = buildType.includes('店面') || buildType.includes('店鋪') || buildType.includes('商辦')

  if (buildingFilter.includes('elevator') && isElevator) return true
  if (buildingFilter.includes('apartment') && isApartment) return true
  if (buildingFilter.includes('house') && isHouse) return true
  if (buildingFilter.includes('store') && isStore) return true
  return false
}

export function summarizeCity(overviews) {
  const totalVolume = overviews.reduce((sum, item) => sum + item.volume, 0)
  const medianLike =
    overviews.reduce((sum, item) => sum + item.price * item.volume, 0) / totalVolume
  const avgYoY = overviews.reduce((sum, item) => sum + item.yoy, 0) / overviews.length

  const sorted = [...overviews].sort((a, b) => b.price - a.price)

  return {
    price: Number(medianLike.toFixed(1)),
    yoy: Number(avgYoY.toFixed(1)),
    volume: totalVolume,
    hottest: sorted[0],
    mostAffordable: sorted[sorted.length - 1],
  }
}

export function heatColor(price, minPrice, maxPrice) {
  if (!price) return 'heat-empty'
  const ratio = maxPrice === minPrice ? 0.5 : (price - minPrice) / (maxPrice - minPrice)
  if (ratio < 0.2) return 'heat-level-1'
  if (ratio < 0.4) return 'heat-level-2'
  if (ratio < 0.6) return 'heat-level-3'
  if (ratio < 0.8) return 'heat-level-4'
  return 'heat-level-5'
}

export function processTrendData(records, timeFrame) {
  if (!records || records.length === 0) return []
  const grouped = {}

  records.forEach((record) => {
    let period = ''
    if (timeFrame === '1y') period = `${record.year}-${String(record.month).padStart(2, '0')}`
    else if (timeFrame === '3y' || timeFrame === '5y') period = `${record.year}-Q${record.quarter}`
    else period = `${record.year}`

    if (!grouped[period]) grouped[period] = []
    grouped[period].push(record)
  })

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, entries]) => ({
      period,
      price: Number(getMedian(entries.map((entry) => entry.unitPricePing)).toFixed(2)),
      volume: entries.length,
    }))
}

export function buildDistrictOverviews(recordsByDistrict) {
  return Array.from(recordsByDistrict.entries())
    .map(([district, records]) => {
      const current = records.filter((record) => record.year >= 2025)
      const previous = records.filter((record) => record.year === 2024)
      const currentMedian = getMedian(current.map((record) => record.unitPricePing))
      const previousMedian = getMedian(previous.map((record) => record.unitPricePing))
      const yoy = previousMedian > 0 ? ((currentMedian - previousMedian) / previousMedian) * 100 : 0

      return {
        city: '台南市',
        name: district,
        price: Number(currentMedian.toFixed(2)),
        yoy: Number(yoy.toFixed(1)),
        volume: current.length || records.length,
      }
    })
    .filter((item) => item.price > 0)
    .sort((a, b) => b.volume - a.volume)
}

export function buildAgeDistribution(records) {
  const buckets = {
    '0-5年': [],
    '6-10年': [],
    '11-20年': [],
    '21-30年': [],
    '30年以上': [],
  }

  records.forEach((record) => {
    if (record.age < 0) return
    if (record.age <= 5) buckets['0-5年'].push(record.unitPricePing)
    else if (record.age <= 10) buckets['6-10年'].push(record.unitPricePing)
    else if (record.age <= 20) buckets['11-20年'].push(record.unitPricePing)
    else if (record.age <= 30) buckets['21-30年'].push(record.unitPricePing)
    else buckets['30年以上'].push(record.unitPricePing)
  })

  return Object.entries(buckets)
    .map(([ageGroup, prices]) => ({
      ageGroup,
      price: Number(getMedian(prices).toFixed(2)),
      volume: prices.length,
    }))
    .filter((item) => item.volume > 0)
}

export function buildRankings(records) {
  const groups = {}
  records.forEach((record) => {
    const key = record.locationName || '其他路段'
    if (!groups[key]) groups[key] = []
    groups[key].push(record)
  })

  return Object.entries(groups)
    .map(([name, entries]) => ({
      name,
      medianPrice: Number(getMedian(entries.map((entry) => entry.unitPricePing)).toFixed(2)),
      volume: entries.length,
      type: entries.some((entry) => entry.type === 'presale')
        ? entries.some((entry) => entry.type === 'existing')
          ? '新舊都有'
          : '預售屋'
        : '中古屋社區',
    }))
    .filter((item) => item.medianPrice > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 8)
}

export function buildInsights(records) {
  const presaleCount = records.filter((record) => record.type === 'presale').length
  const existingCount = records.filter((record) => record.type === 'existing').length
  const current = records.filter((record) => record.year >= 2025)
  const currentMedian = getMedian(current.map((record) => record.unitPricePing))
  const fullMedian = getMedian(records.map((record) => record.unitPricePing))
  const volatilityBase = current.length > 1 ? current.map((record) => record.unitPricePing) : []
  const mean = volatilityBase.length
    ? volatilityBase.reduce((sum, price) => sum + price, 0) / volatilityBase.length
    : 0
  const variance = volatilityBase.length
    ? volatilityBase.reduce((sum, price) => sum + (price - mean) ** 2, 0) / volatilityBase.length
    : 0
  const cv = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0

  return {
    structure: presaleCount > existingCount ? '預售屋比較多' : '中古屋比較多',
    health: currentMedian >= fullMedian ? '穩健走升' : '盤整觀望',
    volatility: cv > 10 ? '波動偏高' : cv > 6 ? '波動中等' : '波動中低',
    liquidity: current.length > 80 ? '去化很快' : current.length > 30 ? '去化穩定' : '去化偏慢',
    momentum: current.length > records.length * 0.35 ? '大幅擴量' : '動能平穩',
  }
}

export function buildRoomLayout(records) {
  const rooms = { '1房': 0, '2房': 0, '3房': 0, '4房以上': 0, '未標示': 0 }

  records.forEach((record) => {
    if (record.roomCount === 1) rooms['1房'] += 1
    else if (record.roomCount === 2) rooms['2房'] += 1
    else if (record.roomCount === 3) rooms['3房'] += 1
    else if (record.roomCount >= 4) rooms['4房以上'] += 1
    else rooms['未標示'] += 1
  })

  return Object.entries(rooms)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
}

export function buildPropertyTypeMix(records) {
  const counts = { 中古屋: 0, 預售屋: 0 }

  records.forEach((record) => {
    if (record.type === 'presale') counts['預售屋'] += 1
    else counts['中古屋'] += 1
  })

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
}

export function buildVolumeSeries(records, timeFrame) {
  return processTrendData(records, timeFrame).map((item) => ({
    period: item.period,
    volume: item.volume,
  }))
}

export function buildComparisonSeries(recordsByDistrict, districtNames, timeFrame) {
  const periods = new Map()

  districtNames.forEach((district) => {
    const records = recordsByDistrict.get(district) ?? []
    processTrendData(records, timeFrame).forEach((entry) => {
      if (!periods.has(entry.period)) periods.set(entry.period, { period: entry.period })
      periods.get(entry.period)[district] = entry.price
    })
  })

  return Array.from(periods.values()).sort((a, b) => a.period.localeCompare(b.period))
}

export function buildPopularLocations(records, limit = 8) {
  const counts = {}
  records.forEach((record) => {
    const key = record.locationName || '其他路段'
    if (key === '其他路段') return
    counts[key] = (counts[key] || 0) + 1
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name)
}

export function buildProjectDetail(projectName, records) {
  const projectRecords = records
    .filter((record) => (record.locationName || record.projectName) === projectName)
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })

  if (projectRecords.length === 0) return null

  const prices = projectRecords.map((record) => record.unitPricePing).filter((price) => price > 0)
  const totalPrices = projectRecords.map((record) => record.totalPrice).filter((price) => price > 0)
  const pings = projectRecords.map((record) => record.totalPing).filter((ping) => ping > 0)
  const projectMedian = getMedian(prices)
  const maxRecord = [...projectRecords].sort((a, b) => b.unitPricePing - a.unitPricePing)[0]
  const minRecord = [...projectRecords].sort((a, b) => a.unitPricePing - b.unitPricePing)[0]

  const groupedFloors = {}
  projectRecords.forEach((record) => {
    const levelKey = record.level || '未標示樓層'
    if (!groupedFloors[levelKey]) groupedFloors[levelKey] = []
    groupedFloors[levelKey].push(record)
  })

  const floorStats = Object.entries(groupedFloors)
    .map(([level, items]) => ({
      level,
      volume: items.length,
      avgPrice: Number((sum(items.map((item) => item.unitPricePing)) / items.length).toFixed(2)),
      avgPing: Number((sum(items.map((item) => item.totalPing || 0)) / items.length).toFixed(1)),
      maxPrice: Number(Math.max(...items.map((item) => item.unitPricePing)).toFixed(2)),
      minPrice: Number(Math.min(...items.map((item) => item.unitPricePing)).toFixed(2)),
    }))
    .sort((a, b) => b.volume - a.volume)

  const trend = withMovingAverage(processTrendData(projectRecords, '1y'))
  const roomMix = buildRoomLayout(projectRecords)
  const typeMix = buildPropertyTypeMix(projectRecords)

  return {
    projectName,
    records: [...projectRecords].reverse(),
    trend,
    roomMix,
    typeMix,
    floorStats,
    stats: {
      medianPrice: Number(projectMedian.toFixed(2)),
      avgTotalPrice: totalPrices.length ? Math.round(sum(totalPrices) / totalPrices.length / 10000) : 0,
      avgPing: pings.length ? Number((sum(pings) / pings.length).toFixed(1)) : 0,
      volume: projectRecords.length,
      maxRecord,
      minRecord,
    },
  }
}

```

## src/utils/csvParser.js

```jsx
function parseFloor(levelStr) {
  if (!levelStr) return -999
  let clean = levelStr.replace('層', '')
  let isBasement = false

  if (clean.includes('地下')) {
    isBasement = true
    clean = clean.replace('地下', '')
  }

  const numMap = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
    十一: 11,
    十二: 12,
    十三: 13,
    十四: 14,
    十五: 15,
    十六: 16,
    十七: 17,
    十八: 18,
    十九: 19,
    二十: 20,
    二十一: 21,
    二十二: 22,
    二十三: 23,
    二十四: 24,
    二十五: 25,
    二十六: 26,
    二十七: 27,
    二十八: 28,
    二十九: 29,
    三十: 30,
    三十一: 31,
    三十二: 32,
    三十三: 33,
    三十四: 34,
    三十五: 35,
    三十六: 36,
    三十七: 37,
    三十八: 38,
    三十九: 39,
    四十: 40,
  }

  let num = numMap[clean]
  if (num === undefined) num = Number.parseInt(clean, 10)
  if (Number.isNaN(num)) return -999
  return isBasement ? -num : num
}

function findIndex(cleanHeaders, exactMatches, partialMatches = []) {
  let idx = cleanHeaders.findIndex((header) => exactMatches.includes(header))
  if (idx !== -1) return idx
  return cleanHeaders.findIndex((header) => partialMatches.some((match) => header.includes(match)))
}

export function parseCSVText(text, filePropertyType, existingKeysArray = []) {
  const existingKeys = new Set(existingKeysArray)
  const records = []
  let duplicateCount = 0
  let filterCount = 0
  let totalProcessedRows = 0

  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  if (lines.length < 2) {
    return { records, duplicateCount, filterCount, totalProcessedRows }
  }

  const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
  const cleanHeaders = headers.map((header) => header.replace(/["'\s]/g, ''))

  const distIdx = findIndex(cleanHeaders, ['鄉鎮市區'], ['鄉鎮市區'])
  const dateIdx = findIndex(cleanHeaders, ['交易年月日'], ['交易年月日'])
  const priceIdx = findIndex(cleanHeaders, ['單價元平方公尺', '單價元(平方公尺)'], ['單價'])
  const typeIdx = findIndex(cleanHeaders, ['交易標的'], ['交易標的'])
  const buildTypeIdx = findIndex(cleanHeaders, ['建物型態'], ['建物型態'])
  const addressIdx = findIndex(cleanHeaders, ['土地位置建物門牌'], ['門牌', '土地位置'])
  const projectIdx = findIndex(cleanHeaders, ['建案名稱'], ['建案名稱'])
  const buildDateIdx = findIndex(cleanHeaders, ['建築完成年月'], ['建築完成年月'])
  const serialIdx = findIndex(cleanHeaders, ['編號'], ['編號'])
  const noteIdx = findIndex(cleanHeaders, ['備註'], ['備註'])
  const levelIdx = findIndex(cleanHeaders, ['移轉層次'], ['移轉層次'])
  const totalPriceIdx = findIndex(cleanHeaders, ['總價元'], ['總價'])
  const parkPriceIdx = findIndex(cleanHeaders, ['車位總價元'], ['車位總價元'])
  const totalAreaIdx = findIndex(
    cleanHeaders,
    ['建物移轉總面積平方公尺', '建物移轉總面積(平方公尺)'],
    ['建物移轉總面積'],
  )
  const parkAreaIdx = findIndex(
    cleanHeaders,
    ['車位移轉總面積平方公尺', '車位移轉總面積(平方公尺)'],
    ['車位移轉總面積'],
  )
  const roomIdx = findIndex(cleanHeaders, ['建物現況格局-房'], ['格局-房'])
  const landAreaIdx = findIndex(
    cleanHeaders,
    ['土地移轉總面積平方公尺', '土地移轉總面積(平方公尺)'],
    ['土地移轉總面積'],
  )

  if (distIdx === -1 || dateIdx === -1) {
    return { records, duplicateCount, filterCount, totalProcessedRows }
  }

  for (let index = 1; index < lines.length; index += 1) {
    if (!lines[index].trim()) continue

    const row = lines[index].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    let district = row[distIdx]?.replace(/['"]/g, '').trim()

    if (!district || district.toLowerCase().includes('district') || /^[A-Za-z\s]+$/.test(district)) {
      continue
    }

    totalProcessedRows += 1

    const dateRaw = row[dateIdx]?.replace(/['"]/g, '')
    const typeRaw = typeIdx !== -1 ? row[typeIdx]?.replace(/['"]/g, '') : ''
    const buildTypeRaw = buildTypeIdx !== -1 ? row[buildTypeIdx]?.replace(/['"]/g, '') : ''
    const addressRaw = addressIdx !== -1 ? row[addressIdx]?.replace(/['"]/g, '') : ''
    const projectRaw = projectIdx !== -1 ? row[projectIdx]?.replace(/['"]/g, '') : ''
    const buildDateRaw = buildDateIdx !== -1 ? row[buildDateIdx]?.replace(/['"]/g, '') : ''
    const serialRaw = serialIdx !== -1 ? row[serialIdx]?.replace(/['"]/g, '') : ''
    const noteRaw = noteIdx !== -1 ? row[noteIdx]?.replace(/['"]/g, '') : ''
    const levelRaw = levelIdx !== -1 ? row[levelIdx]?.replace(/['"]/g, '') : ''

    if (typeRaw && !typeRaw.includes('建物') && !typeRaw.includes('房地')) continue

    const isStoreType =
      buildTypeRaw.includes('店面') || buildTypeRaw.includes('店鋪') || buildTypeRaw.includes('商辦')

    if (noteRaw && noteRaw.match(/(親友|員工|特殊|毛胚|瑕疵|凶宅|增建|地上權|工業|關係人|協議|塔位)/)) {
      filterCount += 1
      continue
    }

    if (
      !isStoreType &&
      levelRaw &&
      (levelRaw.includes('一層') || levelRaw.includes('一樓') || levelRaw === '1層' || levelRaw === '1樓' || levelRaw.includes('地下'))
    ) {
      filterCount += 1
      continue
    }

    district = district.replace('臺南市', '').replace('台南市', '').trim()

    const recordKey = serialRaw || `${district}-${dateRaw}-${addressRaw}-${projectRaw}`
    if (existingKeys.has(recordKey)) {
      duplicateCount += 1
      continue
    }

    const dateStr = String(dateRaw || '')
    if (dateStr.length < 6) continue

    const txYearRoc = Number.parseInt(dateStr.slice(0, dateStr.length - 4), 10)
    const month = Number.parseInt(dateStr.slice(-4, -2), 10)
    if (Number.isNaN(txYearRoc) || Number.isNaN(month) || month < 1 || month > 12) continue

    const year = txYearRoc + 1911
    const quarter = Math.ceil(month / 3)
    const totalPrice = Number.parseFloat(totalPriceIdx !== -1 ? row[totalPriceIdx]?.replace(/['"]/g, '') : '0') || 0
    const parkPrice = Number.parseFloat(parkPriceIdx !== -1 ? row[parkPriceIdx]?.replace(/['"]/g, '') : '0') || 0
    const totalArea = Number.parseFloat(totalAreaIdx !== -1 ? row[totalAreaIdx]?.replace(/['"]/g, '') : '0') || 0
    const parkArea = Number.parseFloat(parkAreaIdx !== -1 ? row[parkAreaIdx]?.replace(/['"]/g, '') : '0') || 0
    const landArea = Number.parseFloat(landAreaIdx !== -1 ? row[landAreaIdx]?.replace(/['"]/g, '') : '0') || 0
    const priceRaw = priceIdx !== -1 ? row[priceIdx]?.replace(/['"]/g, '') : '0'

    const pureAreaSqm = totalArea - parkArea
    const purePrice = totalPrice - parkPrice
    const purePing = pureAreaSqm > 0 ? pureAreaSqm * 0.3025 : 0
    const landPing = landArea * 0.3025

    if (filePropertyType === 'existing') {
      if (!isStoreType && purePing < 15) {
        filterCount += 1
        continue
      }

      if (buildTypeRaw.includes('透天') && landPing > 0 && purePing > 0) {
        if (purePing > landPing * 7 || landPing > purePing * 7) {
          filterCount += 1
          continue
        }
      }
    }

    let unitPricePing = 0
    if (pureAreaSqm > 0 && purePrice > 0) {
      unitPricePing = purePrice / (pureAreaSqm * 0.3025) / 10000
    } else if (priceRaw && priceRaw !== '0') {
      unitPricePing = (Number.parseFloat(priceRaw) * 3.30579) / 10000
    } else {
      continue
    }

    let age = -1
    if (filePropertyType === 'existing' && buildDateRaw && buildDateRaw.length >= 3) {
      const buildYearRoc = Number.parseInt(buildDateRaw.slice(0, buildDateRaw.length - 4), 10)
      if (!Number.isNaN(buildYearRoc)) {
        age = txYearRoc - buildYearRoc
        if (age < 0) age = 0
      }
    }

    const projectName = projectRaw ? projectRaw.trim() : ''
    const roomRaw = roomIdx !== -1 ? row[roomIdx]?.replace(/['"]/g, '') : '0'
    const roomCount = Number.parseInt(roomRaw, 10) || 0
    const totalPing = totalArea > 0 ? totalArea * 0.3025 : 0
    const floorNum = parseFloor(levelRaw)

    let locationName = ''
    if (projectName) {
      locationName = projectName
    } else if (addressRaw) {
      let cleanAddr = addressRaw.replace(/^(臺南市|台南市)/, '')
      if (district) cleanAddr = cleanAddr.replace(new RegExp(`^${district}`), '')
      if (filePropertyType === 'presale' && cleanAddr.includes('地號')) {
        cleanAddr = cleanAddr.split('地號').pop().trim()
      }
      locationName = cleanAddr.trim() || '其他路段'
    } else {
      locationName = '其他路段'
    }

    const record = {
      key: recordKey,
      district,
      year,
      quarter,
      month,
      unitPricePing: Number(unitPricePing.toFixed(2)),
      type: filePropertyType,
      buildType: buildTypeRaw,
      locationName,
      projectName,
      age,
      roomCount,
      totalPing: Number(totalPing.toFixed(2)),
      address: addressRaw,
      level: levelRaw,
      floorNum,
      totalPrice,
      landPing: Number(landPing.toFixed(2)),
      parkAreaPing: Number((parkArea * 0.3025).toFixed(2)),
      hasPark: parkArea > 0 || parkPrice > 0,
      parkPrice,
    }

    records.push(record)
    existingKeys.add(recordKey)
  }

  return { records, duplicateCount, filterCount, totalProcessedRows }
}

export function runCSVWorker(text, filePropertyType, existingKeysArray = []) {
  return Promise.resolve(parseCSVText(text, filePropertyType, existingKeysArray))
}

```
