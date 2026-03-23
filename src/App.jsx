import './App.css'

const districtCards = [
  { name: '東區', price: '38.5', trend: '+12.5%', note: '核心生活圈，自住與換屋需求穩定。' },
  { name: '永康區', price: '35.2', trend: '+15.2%', note: '交易量大，適合觀察主流成交帶。' },
  { name: '善化區', price: '41.5', trend: '+18.5%', note: '科技題材強，價格彈性與熱度並存。' },
  { name: '安平區', price: '32.1', trend: '+8.2%', note: '海景與新案帶動，產品差異大。' },
]

const featureCards = [
  {
    title: '行政區熱區總覽',
    body: '快速比較台南熱門行政區的均價、漲幅與市場熱度，先抓大方向再看細節。',
  },
  {
    title: '建案與社區分析',
    body: '後續可串接實價登錄資料，追蹤社區歷史交易、價量走勢與樓層差異。',
  },
  {
    title: '多區價量對比',
    body: '把不同區域放在同一個視角，辨識價格轉強、量能擴張與買盤移動。',
  },
]

function App() {
  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">TainanSpot</p>
          <h1>台南房價洞察儀表板</h1>
          <p className="lead">
            這是從零建立的 GitHub 可部署版本。現在先提供一個乾淨可上線的首頁骨架，
            方便我們後續把完整的房價分析模組逐步接回來。
          </p>
          <div className="hero-actions">
            <a className="primary-btn" href="#districts">
              查看重點行政區
            </a>
            <a className="secondary-btn" href="#roadmap">
              部署內容
            </a>
          </div>
        </div>

        <aside className="hero-panel">
          <div className="metric">
            <span className="metric-label">品牌定位</span>
            <strong>台南房市資料入口</strong>
          </div>
          <div className="metric">
            <span className="metric-label">目前版本</span>
            <strong>GitHub Pages Ready</strong>
          </div>
          <div className="metric">
            <span className="metric-label">下一步</span>
            <strong>接回完整分析頁與圖表</strong>
          </div>
        </aside>
      </header>

      <main>
        <section className="section" id="districts">
          <div className="section-heading">
            <p className="section-kicker">District Snapshot</p>
            <h2>重點行政區示意</h2>
          </div>
          <div className="card-grid">
            {districtCards.map((card) => (
              <article key={card.name} className="card district-card">
                <div className="district-topline">
                  <h3>{card.name}</h3>
                  <span className="trend-chip">{card.trend}</span>
                </div>
                <p className="price-line">
                  {card.price}
                  <span> 萬/坪</span>
                </p>
                <p className="muted">{card.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="roadmap">
          <div className="section-heading">
            <p className="section-kicker">Roadmap</p>
            <h2>這個版本已經準備好部署</h2>
          </div>
          <div className="card-grid">
            {featureCards.map((card) => (
              <article key={card.title} className="card feature-card">
                <h3>{card.title}</h3>
                <p className="muted">{card.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
