import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Building2,
  FileText,
  Layers3,
  MapPinned,
  SlidersHorizontal,
} from 'lucide-react'
import { useDashboardModel } from '../hooks/useDashboardModel.js'
import { DataBreakdownCard } from './siteShared.jsx'
const LazyProjectDetailView = lazy(() =>
  import('./TainanDashboard.jsx').then((module) => ({ default: module.ProjectDetailView })),
)

const RegionalOverviewPage = lazy(() =>
  import('./pages/RegionalOverviewPage.jsx').then((module) => ({ default: module.RegionalOverviewPage })),
)
const ProductAnalysisPage = lazy(() =>
  import('./pages/ProductAnalysisPage.jsx').then((module) => ({ default: module.ProductAnalysisPage })),
)
const FilterPage = lazy(() =>
  import('./pages/FilterPage.jsx').then((module) => ({ default: module.FilterPage })),
)
const TransactionDetailPage = lazy(() =>
  import('./pages/TransactionDetailPage.jsx').then((module) => ({ default: module.TransactionDetailPage })),
)
const AboutPage = lazy(() =>
  import('./pages/AboutPage.jsx').then((module) => ({ default: module.AboutPage })),
)
const ManagePage = lazy(() =>
  import('./pages/ManagePage.jsx').then((module) => ({ default: module.ManagePage })),
)

const sectionTabs = [
  { id: 'home', label: '首頁', icon: Building2 },
  { id: 'regional', label: '區域總覽', icon: MapPinned },
  { id: 'product', label: '產品類型分析', icon: Layers3 },
  { id: 'filters', label: '條件篩選', icon: SlidersHorizontal },
  { id: 'about', label: '資料說明', icon: FileText },
]

const ADMIN_SESSION_KEY = 'tainanspot-admin-auth'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '1234'

function normalizePassword(value) {
  return value.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 65248))
}

function scrollToSection(sectionId) {
  const target = document.getElementById(sectionId)
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function SiteNav() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button type="button" className="brand-mark" onClick={() => scrollToSection('home')}>
          <Building2 size={22} />
          <span>TainanSpot</span>
        </button>

        <nav className="site-nav">
          {sectionTabs.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className="site-nav-link"
                onClick={() => scrollToSection(item.id)}
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

function HomePage({ model, onJump, onOpenLandAnalysis }) {
  const quickDistricts = model.availableDistricts.slice(0, 8)

  return (
    <div className="page-stack">
      <section className="site-hero panel dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">首頁</p>
          <h1>看懂實價登錄成交資料，從條件比較開始</h1>
          <p className="site-hero-lead">
            用區域、坪數、屋齡、格局、樓層與車位條件，整理你真正看得懂的成交資訊。
          </p>
          <p className="site-hero-lead subtle">
            本網站分析內容僅依據已匯入的實價登錄成交資料欄位，不包含開價、生活機能或外部市場資訊。
          </p>
          <div className="hero-summary-bar">
            <div className="hero-summary-pill">區域比較</div>
            <div className="hero-summary-pill">土地交易分析</div>
            <div className="hero-summary-pill">產品分開分析</div>
            <div className="hero-summary-pill">條件交叉篩選</div>
            <div className="hero-summary-pill">成交明細判讀</div>
          </div>
          <div className="cta-row">
            <button type="button" className="cta-primary" onClick={() => onJump('filters')}>
              直接開始篩選
              <ArrowRight size={16} />
            </button>
            <button type="button" className="cta-secondary" onClick={() => onJump('regional')}>
              先看區域總覽
            </button>
          </div>
        </div>
        <div className="dashboard-hero-side">
          <div className="hero-highlight-card">
            <span>目前資料範圍</span>
            <strong>{model.latestDataDate || '-'}</strong>
            <p>{model.isRealMode ? '依已匯入成交資料分析' : '目前為展示資料模式'}</p>
          </div>
          <div className="hero-highlight-card">
            <span>分析核心</span>
            <strong>查詢 / 篩選 / 比較</strong>
            <p>先看分布，再看單一數值，避免把不同產品混在一起判讀</p>
          </div>
          <div className="hero-highlight-card">
            <span>可用欄位</span>
            <strong>區域 / 型態 / 坪數</strong>
            <p>也包含屋齡、格局、樓層、車位與備註欄位的條件分析</p>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>主要分析模組</h3>
              <p>先選你要用哪一種方式看成交資料。</p>
            </div>
          </div>
          <div className="simple-list">
            <button type="button" className="simple-list-item" onClick={() => onJump('regional')}>
              <div>
                <strong>區域總覽</strong>
                <p>看各行政區成交件數、總價分布、單價分布與建物型態概況</p>
              </div>
              <span>進入</span>
            </button>
            <button type="button" className="simple-list-item" onClick={() => onJump('product')}>
              <div>
                <strong>產品類型分析</strong>
                <p>先分開比較交易標的，再比較中古屋、預售屋與不同建物型態，不把不同產品混在一起看</p>
              </div>
              <span>進入</span>
            </button>
            <button type="button" className="simple-list-item" onClick={onOpenLandAnalysis}>
              <div>
                <strong>土地交易分析</strong>
                <p>直接進入土地成交主模組，先看土地成交件數、總價、單價、土地坪數與各區比較</p>
              </div>
              <span>進入</span>
            </button>
            <button type="button" className="simple-list-item" onClick={() => onJump('filters')}>
              <div>
                <strong>條件篩選</strong>
                <p>用區域、產品、房數、屋齡、樓層與車位條件，找出更接近需求的成交樣本</p>
              </div>
              <span>進入</span>
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>快速篩選入口</h3>
              <p>如果你已經有想先看的區域，可以從這裡直接開始。</p>
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
                  onJump('regional')
                }}
              >
                {district}
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="dashboard-grid">
        <DataBreakdownCard
          title="本網站可分析的資料範圍"
          subtitle="以下都直接來自已匯入的實價登錄欄位，不另外加入外部資料。"
          items={[
            { name: '區域', value: '行政區 / 鄉鎮市區' },
            { name: '分析欄位', value: '交易標的 / 產品類型 / 建物型態' },
            { name: '空間條件', value: '坪數 / 屋齡 / 格局 / 樓層 / 車位' },
            { name: '價格資料', value: '總價 / 單價 / 成交件數' },
            { name: '樣本提醒', value: '備註 / 特殊交易標示' },
          ]}
        />
        <DataBreakdownCard
          title="資料使用原則"
          subtitle="先講分布，再講單一數值；條件一致，才拿來比較。"
          items={[
            { name: '先看分布', value: '避免只看單一平均值' },
            { name: '同條件比較', value: '不同產品不直接混比' },
            { name: '特殊樣本提示', value: '備註異常樣本會另外提醒' },
            { name: '資料限制', value: '不含開價、生活機能與外部市場資訊' },
          ]}
        />
      </section>
    </div>
  )
}

function DeferredSection({
  id,
  eager = false,
  fallbackTitle,
  fallbackText,
  children,
  className = 'single-page-section',
}) {
  const ref = useRef(null)
  const [shouldRender, setShouldRender] = useState(eager)

  useEffect(() => {
    if (eager) setShouldRender(true)
  }, [eager])

  useEffect(() => {
    if (shouldRender) return
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShouldRender(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldRender(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '320px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [shouldRender])

  return (
    <section id={id} ref={ref} className={className}>
      {shouldRender ? (
        children
      ) : (
        <section className="panel empty-state-panel deferred-panel">
          <div className="panel-head">
            <div>
              <h3>{fallbackTitle}</h3>
              <p>{fallbackText}</p>
            </div>
          </div>
        </section>
      )}
    </section>
  )
}

function SectionFallback({ title, text }) {
  return (
    <section className="panel empty-state-panel deferred-panel">
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      </div>
    </section>
  )
}

export function TainanSite() {
  const model = useDashboardModel()
  const [selectedProjectName, setSelectedProjectName] = useState(null)
  const [selectedRecordKey, setSelectedRecordKey] = useState(null)
  const [lastFilterRecordKey, setLastFilterRecordKey] = useState(null)
  const [productSubview, setProductSubview] = useState('land')
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [adminAuthError, setAdminAuthError] = useState('')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsAdminAuthenticated(window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true')
  }, [])

  const projectDetail = useMemo(
    () => (selectedProjectName ? model.getProjectDetail(selectedProjectName) : null),
    [model, selectedProjectName],
  )
  const transactionDetail = useMemo(
    () => (selectedRecordKey ? model.getTransactionDetail(selectedRecordKey) : null),
    [model, selectedRecordKey],
  )
  const currentFilterRecordIndex = useMemo(
    () => model.filterPageRecords.findIndex((record) => record.key === selectedRecordKey),
    [model.filterPageRecords, selectedRecordKey],
  )
  const prevFilterRecordKey =
    currentFilterRecordIndex > 0 ? model.filterPageRecords[currentFilterRecordIndex - 1]?.key : null
  const nextFilterRecordKey =
    currentFilterRecordIndex >= 0 && currentFilterRecordIndex < model.filterPageRecords.length - 1
      ? model.filterPageRecords[currentFilterRecordIndex + 1]?.key
      : null

  const openProject = (projectName) => {
    setSelectedProjectName(projectName)
    setTimeout(() => scrollToSection('community'), 0)
  }

  const openTransaction = (recordKey) => {
    setLastFilterRecordKey(recordKey)
    setSelectedRecordKey(recordKey)
    setTimeout(() => scrollToSection('detail'), 0)
  }

  const backToFilterResults = () => {
    scrollToSection('filters')
    if (!lastFilterRecordKey) return
    window.setTimeout(() => {
      const target = document.getElementById(`record-row-${lastFilterRecordKey}`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }

  const openLandAnalysis = () => {
    setProductSubview('land')
    setTimeout(() => scrollToSection('product'), 0)
  }

  useEffect(() => {
    const handleOpenProject = (event) => {
      if (!event.detail?.projectName) return
      openProject(event.detail.projectName)
    }
    window.addEventListener('tainanspot:open-project', handleOpenProject)
    return () => window.removeEventListener('tainanspot:open-project', handleOpenProject)
  }, [])

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
      <SiteNav />

      <main className="site-main">
        <section id="home">
          <HomePage model={model} onJump={scrollToSection} onOpenLandAnalysis={openLandAnalysis} />
        </section>

        <DeferredSection
          id="regional"
          eager
          fallbackTitle="區域總覽"
          fallbackText="正在載入區域比較資料…"
        >
          <Suspense fallback={<SectionFallback title="區域總覽" text="正在載入區域比較資料…" />}>
            <RegionalOverviewPage model={model} onJump={scrollToSection} />
          </Suspense>
        </DeferredSection>

        <DeferredSection
          id="product"
          fallbackTitle="產品類型分析"
          fallbackText="捲到這裡時，才會載入產品與土地分析內容。"
        >
          <Suspense fallback={<SectionFallback title="產品類型分析" text="正在載入產品分析內容…" />}>
            <ProductAnalysisPage
              model={model}
              productSubview={productSubview}
              setProductSubview={setProductSubview}
            />
          </Suspense>
        </DeferredSection>

        <DeferredSection
          id="filters"
          fallbackTitle="條件篩選"
          fallbackText="捲到這裡時，才會載入篩選工具與結果列表。"
        >
          <Suspense fallback={<SectionFallback title="條件篩選" text="正在載入條件篩選工具…" />}>
            <FilterPage
              model={model}
              onJump={scrollToSection}
              onOpenTransaction={openTransaction}
              activeRecordKey={selectedRecordKey}
            />
          </Suspense>
        </DeferredSection>

        <DeferredSection
          id="detail"
          eager={Boolean(transactionDetail)}
          fallbackTitle="成交明細頁"
          fallbackText="請先從條件篩選結果列表點一筆成交，這裡才會顯示單筆詳細資料。"
        >
          {transactionDetail ? (
            <Suspense fallback={<SectionFallback title="成交明細頁" text="正在載入單筆成交資料…" />}>
              <TransactionDetailPage
                record={transactionDetail}
                onBack={backToFilterResults}
                onPrev={() => prevFilterRecordKey && openTransaction(prevFilterRecordKey)}
                onNext={() => nextFilterRecordKey && openTransaction(nextFilterRecordKey)}
                hasPrev={Boolean(prevFilterRecordKey)}
                hasNext={Boolean(nextFilterRecordKey)}
                onOpenCommunity={() => {
                  openProject(transactionDetail.locationName || transactionDetail.projectName)
                }}
              />
            </Suspense>
          ) : (
            <SectionFallback
              title="成交明細頁"
              text="請先從條件篩選結果列表點一筆成交，這裡才會顯示單筆詳細資料。"
            />
          )}
        </DeferredSection>

        <DeferredSection
          id="community"
          eager={Boolean(projectDetail)}
          fallbackTitle="成交明細與社區分析"
          fallbackText="從區域總覽或條件篩選點進社區後，這裡會顯示社區價格趨勢、樓層差異與交易明細。"
        >
          {projectDetail ? (
            <Suspense fallback={<SectionFallback title="成交明細與社區分析" text="正在載入社區資料…" />}>
              <LazyProjectDetailView detail={projectDetail} onBack={() => scrollToSection('regional')} />
            </Suspense>
          ) : (
            <SectionFallback
              title="成交明細與社區分析"
              text="從區域總覽或條件篩選點進社區後，這裡會顯示社區價格趨勢、樓層差異與交易明細。"
            />
          )}
        </DeferredSection>

        <DeferredSection
          id="about"
          fallbackTitle="資料說明"
          fallbackText="捲到這裡時，才會載入資料來源與清理原則說明。"
        >
          <Suspense fallback={<SectionFallback title="資料說明" text="正在載入資料說明…" />}>
            <AboutPage />
          </Suspense>
        </DeferredSection>

        <DeferredSection
          id="manage"
          fallbackTitle="資料管理"
          fallbackText="捲到這裡時，才會載入資料管理內容。"
        >
          <Suspense fallback={<SectionFallback title="資料管理" text="正在載入資料管理內容…" />}>
            <ManagePage
              model={model}
              isAdminAuthenticated={isAdminAuthenticated}
              adminPasswordInput={adminPasswordInput}
              setAdminPasswordInput={setAdminPasswordInput}
              adminAuthError={adminAuthError}
              handleAdminLogin={handleAdminLogin}
              handleAdminLogout={handleAdminLogout}
            />
          </Suspense>
        </DeferredSection>
      </main>
    </div>
  )
}
