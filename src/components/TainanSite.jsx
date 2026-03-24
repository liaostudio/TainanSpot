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
              <p>我要更多篩選器、比較圖和 GitHub 資料管理。</p>
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

      <section className="panel scenario-panel">
        <div className="panel-head compact">
          <div>
            <h3>我是哪一種買方</h3>
            <p>按一下就能快速切到適合你的房型與價格視角。</p>
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

      <section className="panel simple-list-panel">
        <div className="panel-head">
          <div>
            <h3>這一區熱門社區</h3>
            <p>先從大家最常成交的社區開始看，通常最容易抓到區域感覺。</p>
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
            <p>這些社區成交筆數穩定，而且價格比本區平均更親切，適合務實型買方先看。</p>
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
