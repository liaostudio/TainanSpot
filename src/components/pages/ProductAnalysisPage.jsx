import { MetricCard } from '../MetricCard.jsx'
import { HintBadge } from '../HintBadge.jsx'
import { DataBreakdownCard, SampleStatusTag } from '../siteShared.jsx'
import { tradeTargetLabels } from '../siteLabels.js'
import { formatPrice } from '../../utils/dashboard.js'

export function ProductAnalysisPage({ model, productSubview, setProductSubview }) {
  const activeTradeTargets =
    model.tradeTargetFilter.includes('all') ? ['全部交易標的'] : model.tradeTargetFilter
  const landPriceDistributionItems = model.landPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const landUnitPriceDistributionItems = model.landUnitPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const landPingDistributionItems = model.landPingDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const productPingDistributionItems = model.productPingDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const productTotalPriceDistributionItems = model.productTotalPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const productUnitPriceDistributionItems = model.productUnitPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const productSpecialHint = model.includeSpecialSamples
    ? '目前分布與比較已納入特殊樣本，判讀時請留意備註異常樣本可能影響價格位置。'
    : '目前分布與比較已排除特殊樣本，較適合作為一般市場比較基準。'

  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">產品分析</p>
          <h1>產品類型分析</h1>
          <p className="site-hero-lead">
            先把成交資料按交易標的、產品類型和建物型態分開，再比較成交件數、總價中位數、單價中位數與坪數分布，避免把不同產品混在一起判讀。
          </p>
        </div>
      </section>

      <section className="panel compact-panel">
        <div className="panel-head compact">
          <div>
            <h3>分析次模組入口</h3>
            <p>先選你要看的分析主題，再進入對應的比較與分布內容。</p>
          </div>
        </div>
        <div className="analysis-subnav">
          <button
            type="button"
            className={productSubview === 'land' ? 'analysis-subnav-button is-active' : 'analysis-subnav-button'}
            onClick={() => setProductSubview('land')}
          >
            <strong>土地交易分析</strong>
            <span>專看土地成交件數、總價、單價與土地坪數。</span>
          </button>
          <button
            type="button"
            className={productSubview === 'building' ? 'analysis-subnav-button is-active' : 'analysis-subnav-button'}
            onClick={() => setProductSubview('building')}
          >
            <strong>建物 / 房地分析</strong>
            <span>專看交易標的、產品類型、建物型態與價格分布。</span>
          </button>
        </div>
      </section>

      <section className="panel scenario-panel">
        <div className="panel-head compact">
          <div>
            <h3 className="panel-title-with-hint">
              <span>產品分析條件</span>
              <HintBadge text="這一頁先看交易標的，再看產品類型與建物型態。所有比較都依目前勾選條件重新統計。" />
            </h3>
          </div>
        </div>
        <div className="filter-groups">
          <div className="filter-group">
            <span className="filter-label">交易標的</span>
            <div className="chip-row">
              <button type="button" className={model.tradeTargetFilter.includes('all') ? 'chip active' : 'chip'} onClick={() => model.toggleTradeTarget('all')}>全部</button>
              {Object.entries(tradeTargetLabels).map(([value, label]) => (
                <button key={value} type="button" className={model.tradeTargetFilter.includes(value) ? 'chip active' : 'chip'} onClick={() => model.toggleTradeTarget(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {!model.isLandOnlyMode ? (
            <>
              <div className="filter-group">
                <span className="filter-label">產品類型</span>
                <div className="chip-row">
                  <button type="button" className={model.propertyTypeFilter.includes('existing') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('existing')}>中古屋</button>
                  <button type="button" className={model.propertyTypeFilter.includes('presale') ? 'chip active' : 'chip'} onClick={() => model.togglePropertyType('presale')}>預售屋</button>
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">建物型態</span>
                <div className="chip-row">
                  <button type="button" className={model.buildingFilter.includes('elevator') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('elevator')}>大樓 / 華廈</button>
                  <button type="button" className={model.buildingFilter.includes('apartment') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('apartment')}>公寓</button>
                  <button type="button" className={model.buildingFilter.includes('house') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('house')}>透天</button>
                  <button type="button" className={model.buildingFilter.includes('store') ? 'chip active' : 'chip'} onClick={() => model.toggleBuildingType('store')}>店面 / 商辦</button>
                </div>
              </div>
            </>
          ) : (
            <div className="info-list">
              <div>目前只看土地成交，因此不顯示產品類型與建物型態條件。</div>
            </div>
          )}
        </div>
        <div className="panel-inline-hint">
          <HintBadge text={`目前已套用交易標的：${activeTradeTargets.join(' / ')}。`} />
        </div>
      </section>

      <section id="land-analysis" className="panel">
        <div className="panel-head">
          <div>
            <h3 className="panel-title-with-hint">
              <span>土地交易分析主模組</span>
              <HintBadge text="這一段專門看土地成交，先看土地樣本件數與價格位置，再看各行政區土地比較與土地坪數分布。" />
            </h3>
            <p>土地樣本完全獨立統計，不和建物、房地產品混在一起比較。</p>
          </div>
        </div>

        {productSubview === 'land' ? (
          <>
            <div className="dashboard-grid">
              <DataBreakdownCard title={<><span>土地總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看土地成交主要落在哪些總價區間。" items={landPriceDistributionItems} emptyText="目前條件下沒有可顯示的土地總價分布。" />
              <DataBreakdownCard title={<><span>土地單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看土地成交主要落在哪些單價區間。" items={landUnitPriceDistributionItems} emptyText="目前條件下沒有可顯示的土地單價分布。" />
              <DataBreakdownCard title={<><span>土地面積分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看土地成交主要落在哪些坪數帶。" items={landPingDistributionItems} emptyText="目前條件下沒有可顯示的土地面積分布。" />
            </div>
            <div className="panel-inline-hint">
              <HintBadge text={productSpecialHint} />
            </div>

            <div className="metric-grid">
              <MetricCard label="土地成交件數" value={`${model.landAnalysisSummary.volume.toLocaleString()} 筆`} helper="目前條件下屬於土地交易的樣本數" accent="blue" showHint={false} />
              <MetricCard label="土地總價中位數" value={model.landAnalysisSummary.medianTotalPrice > 0 ? `${model.landAnalysisSummary.medianTotalPrice} 萬` : '-'} helper="目前條件下土地成交總價中位數" accent="amber" showHint={false} />
              <MetricCard label="土地單價中位數" value={model.landAnalysisSummary.medianUnitPrice > 0 ? `${formatPrice(model.landAnalysisSummary.medianUnitPrice)} 萬/坪` : '-'} helper="目前條件下土地成交單價中位數" accent="slate" showHint={false} />
              <MetricCard label="平均土地坪數" value={model.landAnalysisSummary.avgPing > 0 ? `${model.landAnalysisSummary.avgPing} 坪` : '-'} helper="目前條件下土地成交的平均坪數" accent="green" showHint={false} />
            </div>

            <div className="panel-inline-hint">
              <HintBadge text="上面先看土地分布與主要數值，下面再看各行政區的土地比較表。" />
            </div>

            {model.landDistrictRows.length > 0 ? (
              <div className="table-shell">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>行政區</th>
                      <th>成交件數</th>
                      <th>總價中位數</th>
                      <th>單價中位數</th>
                      <th>平均土地坪數</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.landDistrictRows.map((row) => (
                      <tr key={row.district}>
                        <td>{row.district}</td>
                        <td>{row.volume.toLocaleString()} 筆</td>
                        <td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice} 萬` : '-'}</td>
                        <td>{row.medianUnitPrice > 0 ? `${formatPrice(row.medianUnitPrice)} 萬/坪` : '-'}</td>
                        <td>{row.avgPing > 0 ? `${row.avgPing} 坪` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">目前條件下沒有可顯示的土地交易資料。</div>
            )}
          </>
        ) : (
          <div className="empty-state compact-empty-state">已切換到建物 / 房地分析。土地交易主模組內容已暫時收合。</div>
        )}
      </section>

      {productSubview === 'building' ? (
        <>
          <div className="dashboard-grid">
            <DataBreakdownCard title={<><span>坪數分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看目前產品樣本主要落在哪些坪數帶。" items={productPingDistributionItems} emptyText="目前條件下沒有可顯示的坪數分布。" />
            <DataBreakdownCard title={<><span>總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看目前產品樣本主要落在哪些總價區間。" items={productTotalPriceDistributionItems} emptyText="目前條件下沒有可顯示的總價分布。" />
            <DataBreakdownCard title={<><span>單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看目前產品樣本主要落在哪些單價區間。" items={productUnitPriceDistributionItems} emptyText="目前條件下沒有可顯示的單價分布。" />
          </div>
          <div className="panel-inline-hint">
            <HintBadge text={productSpecialHint} />
          </div>

          <div className="metric-grid">
            <MetricCard label="樣本件數" value={`${model.productAnalysisSummary.volume.toLocaleString()} 筆`} helper="目前產品分析納入的成交樣本數" accent="blue" showHint={false} />
            <MetricCard label="總價中位數" value={model.productAnalysisSummary.medianTotalPrice > 0 ? `${model.productAnalysisSummary.medianTotalPrice} 萬` : '-'} helper="用目前條件下的成交總價中位數統計" accent="amber" showHint={false} />
            <MetricCard label="單價中位數" value={model.productAnalysisSummary.medianUnitPrice > 0 ? `${formatPrice(model.productAnalysisSummary.medianUnitPrice)} 萬/坪` : '-'} helper="用目前條件下的成交單價中位數統計" accent="slate" showHint={false} />
            <MetricCard label={model.isLandOnlyMode ? '平均土地坪數' : '平均建坪'} value={model.productAnalysisSummary.avgPing > 0 ? `${model.productAnalysisSummary.avgPing} 坪` : '-'} helper={model.isLandOnlyMode ? '目前樣本的平均土地坪數' : '目前樣本的平均建物坪數'} accent="green" showHint={false} />
          </div>

          <section className="panel compact-panel">
            <div className="panel-head compact">
              <div>
                <h3>第二層比較表</h3>
                <p>如果你已經先看過分布與摘要，再用下面的表格做更細的產品比較。</p>
              </div>
            </div>
          </section>

          <section id="building-analysis" className="panel data-breakdown-card">
            <div className="panel-head">
              <div>
                <h3 className="panel-title-with-hint">
                  <span>交易標的比較</span>
                  <HintBadge text="先把土地、建物、房地、房地加車位分開看，再比較成交件數、總價中位數、單價中位數與平均坪數。" />
                </h3>
              </div>
            </div>
            {model.tradeTargetAnalysisRows.length > 0 ? (
              <div className="table-shell">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>交易標的</th>
                      <th>成交件數</th>
                      <th>總價中位數</th>
                      <th>單價中位數</th>
                      <th>平均面積</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.tradeTargetAnalysisRows.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td>{row.volume.toLocaleString()} 筆</td>
                        <td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice} 萬` : '-'}</td>
                        <td>{row.medianUnitPrice > 0 ? `${formatPrice(row.medianUnitPrice)} 萬/坪` : '-'}</td>
                        <td>{row.avgPing > 0 ? `${row.avgPing} 坪` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="empty-state">目前條件下沒有可顯示的交易標的比較資料。</div>}
          </section>

          <section className="panel data-breakdown-card">
            <div className="panel-head">
              <div>
                <h3 className="panel-title-with-hint">
                  <span>產品類型比較</span>
                  <HintBadge text="先看中古屋與預售屋的成交件數、總價中位數、單價中位數與平均建坪。" />
                </h3>
              </div>
            </div>
            {model.productTypeAnalysisRows.length > 0 ? (
              <div className="table-shell">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>產品類型</th>
                      <th>成交件數</th>
                      <th>總價中位數</th>
                      <th>單價中位數</th>
                      <th>平均建坪</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.productTypeAnalysisRows.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td>{row.volume.toLocaleString()} 筆</td>
                        <td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice} 萬` : '-'}</td>
                        <td>{row.medianUnitPrice > 0 ? `${formatPrice(row.medianUnitPrice)} 萬/坪` : '-'}</td>
                        <td>{row.avgPing > 0 ? `${row.avgPing} 坪` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="empty-state">目前條件下沒有可顯示的產品類型比較資料。</div>}
          </section>

          <section className="panel data-breakdown-card">
            <div className="panel-head">
              <div>
                <h3 className="panel-title-with-hint">
                  <span>建物型態比較</span>
                  <HintBadge text="再看大樓、華廈、公寓、透天與店面商辦的成交件數、總價中位數、單價中位數與平均建坪。" />
                </h3>
              </div>
            </div>
            {model.buildingTypeAnalysisRows.length > 0 ? (
              <div className="table-shell">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>建物型態</th>
                      <th>成交件數</th>
                      <th>總價中位數</th>
                      <th>單價中位數</th>
                      <th>平均建坪</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.buildingTypeAnalysisRows.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td>{row.volume.toLocaleString()} 筆</td>
                        <td>{row.medianTotalPrice > 0 ? `${row.medianTotalPrice} 萬` : '-'}</td>
                        <td>{row.medianUnitPrice > 0 ? `${formatPrice(row.medianUnitPrice)} 萬/坪` : '-'}</td>
                        <td>{row.avgPing > 0 ? `${row.avgPing} 坪` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="empty-state">目前條件下沒有可顯示的建物型態比較資料。</div>}
          </section>
        </>
      ) : null}
    </div>
  )
}
