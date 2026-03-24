export function AboutPage() {
  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">資料說明</p>
          <h1>資料方法說明</h1>
          <p className="site-hero-lead">
            這一段只說明資料從哪裡來、可以分析哪些欄位、哪些內容不在範圍內，以及資料清理與分析呈現原則。
          </p>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>資料來源</h3>
              <p>本網站分析內容，僅依據已匯入的實價登錄 CSV 檔案欄位整理，不另外加入外部資料來源。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 主要資料來自已匯入的實價登錄成交 CSV。</p>
            <p>2. 網站會把這些欄位整理成區域、產品、條件與明細分析畫面。</p>
            <p>3. 所有分析結果都只建立在目前已匯入的成交資料內容上。</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>可分析欄位</h3>
              <p>本階段可直接用來分析的內容，只限目前 CSV 已提供的欄位。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 鄉鎮市區、交易標的、建物型態、門牌 / 位置、交易年月日。</p>
            <p>2. 建築完成年月、坪數、格局、樓層、總價、單價。</p>
            <p>3. 車位類別、車位面積、車位總價元、備註、建案名稱等欄位。</p>
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>不納入範圍</h3>
              <p>以下資訊不屬於本網站這一階段的分析範圍。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 學區、商圈、交通、重大建設等生活機能資料。</p>
            <p>2. 開價、議價率、待售物件資訊與即時市場監控資料。</p>
            <p>3. 外部社區履歷、推薦系統、AI 預測結果與外部市場資訊。</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>資料清理原則</h3>
              <p>為了讓分析結果更穩定，網站會先做基本資料整理與樣本清理。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 排除表頭重複列，統一欄位格式、面積單位與單價換算方式。</p>
            <p>2. 樓層格式與屋齡計算會先標準化，車位金額會獨立呈現。</p>
            <p>3. 可疑特殊交易、親友交易或不適合直接比較的樣本，會標示或排除。</p>
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>分析呈現原則</h3>
              <p>網站不是要提供更多資訊，而是把原本看得到但不容易理解的成交資料整理得更好讀。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 先講分布，再講單一數值，避免只看平均造成誤解。</p>
            <p>2. 條件一致才比較，同產品、同坪數帶、同屋齡帶的資料才適合放在一起看。</p>
            <p>3. 圖表都要能回到原始欄位與統計方式，讓使用者知道這個結果怎麼來。</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>使用提醒</h3>
              <p>這個網站適合拿來快速了解成交資料，但不能代替實際看屋與專業判斷。</p>
            </div>
          </div>
          <div className="info-list">
            <p>1. 數據會隨匯入資料時間不同而更新。</p>
            <p>2. 單一物件仍要看樓層、位置、屋況、裝潢與個別條件。</p>
            <p>3. 真正出價或判斷前，仍建議搭配專業房仲或估價判讀。</p>
          </div>
        </section>
      </div>
    </div>
  )
}
