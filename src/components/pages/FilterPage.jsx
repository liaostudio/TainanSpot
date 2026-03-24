import { formatPrice } from '../../utils/dashboard.js'
import { MetricCard } from '../MetricCard.jsx'
import { HintBadge } from '../HintBadge.jsx'
import { DataBreakdownCard, SampleStatusTag } from '../siteShared.jsx'
import { tradeTargetLabels } from '../siteLabels.js'
import { timeTabs } from '../../data/dashboardData.js'

export function FilterPage({ model, onJump, onOpenTransaction, activeRecordKey }) {
  const activeTradeTargets =
    model.tradeTargetFilter.includes('all') ? ['全部交易標的'] : model.tradeTargetFilter
  const resultRows = model.filterPageRecords.slice(0, 30)
  const specialSampleCount = model.filterPageRecords.filter((record) => record.isSpecialSample).length
  const filterTotalPriceItems = model.filterPageTotalPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))
  const filterUnitPriceItems = model.filterPageUnitPriceDistribution.map((item) => ({
    name: item.name,
    value: `${item.value} 筆`,
  }))

  return (
    <div className="page-stack">
      <section className="site-hero panel compact-hero dashboard-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">條件篩選</p>
          <h1>條件篩選</h1>
          <p className="site-hero-lead">
            用條件把成交資料縮小到比較接近需求的樣本，再看篩選後的成交件數、總價分布、單價分布與明細列表。
          </p>
        </div>
      </section>

      <section className="panel scenario-panel">
        <div className="panel-head compact">
          <div>
            <h3 className="panel-title-with-hint">
              <span>篩選條件</span>
              <HintBadge text="這一頁的目的，是讓你用區域、交易標的、產品類型、建物型態、房數、屋齡、樓層與車位條件，找出更接近需求的成交樣本。" />
            </h3>
          </div>
        </div>
        <div className="filter-groups">
          <div className="filter-group">
            <span className="filter-label">行政區</span>
            <label className="district-picker">
              <select value={model.filterDistrict} onChange={(event) => model.setFilterDistrict(event.target.value)}>
                <option value="all">全台南</option>
                {model.availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
          <div className="filter-group">
            <span className="filter-label">時間區間</span>
            <div className="time-tabs compact">
              {timeTabs.map((tab) => (
                <button key={tab.id} type="button" className={tab.id === model.districtActiveTab ? 'is-active' : ''} onClick={() => model.setDistrictActiveTab(tab.id)}>
                  {tab.label}
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
              <div className="filter-group">
                <span className="filter-label">房數</span>
                <div className="chip-row">
                  {[{ id: 'all', label: '全部' }, { id: '1', label: '1房' }, { id: '2', label: '2房' }, { id: '3', label: '3房' }, { id: '4+', label: '4房以上' }].map((option) => (
                    <button key={option.id} type="button" className={model.filterRoomCount === option.id ? 'chip active' : 'chip'} onClick={() => model.setFilterRoomCount(option.id)}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">屋齡區間</span>
                <div className="chip-row">
                  {[{ id: 'all', label: '全部' }, { id: '0-5', label: '0-5年' }, { id: '6-15', label: '6-15年' }, { id: '16-30', label: '16-30年' }, { id: '30+', label: '30年以上' }].map((option) => (
                    <button key={option.id} type="button" className={model.filterAgeRange === option.id ? 'chip active' : 'chip'} onClick={() => model.setFilterAgeRange(option.id)}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="info-list">
              <div>目前只看土地成交，因此不顯示產品類型、建物型態、房數與屋齡條件。</div>
            </div>
          )}
          <div className="filter-group">
            <span className="filter-label">坪數區間</span>
            <div className="range-input-row">
              <input type="number" min="0" inputMode="numeric" placeholder="最小坪數" value={model.filterPingMin} onChange={(event) => model.setFilterPingMin(event.target.value)} />
              <span>~</span>
              <input type="number" min="0" inputMode="numeric" placeholder="最大坪數" value={model.filterPingMax} onChange={(event) => model.setFilterPingMax(event.target.value)} />
            </div>
          </div>
          {!model.isLandOnlyMode && (
            <div className="filter-group">
              <span className="filter-label">車位有無</span>
              <div className="chip-row">
                {[{ id: 'all', label: '全部' }, { id: 'yes', label: '有車位' }, { id: 'no', label: '無車位' }].map((option) => (
                  <button key={option.id} type="button" className={model.filterParking === option.id ? 'chip active' : 'chip'} onClick={() => model.setFilterParking(option.id)}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="filter-group">
            <span className="filter-label">特殊樣本</span>
            <div className="chip-row">
              <button type="button" className={!model.includeSpecialSamples ? 'chip active' : 'chip'} onClick={() => model.setIncludeSpecialSamples(false)}>排除特殊交易</button>
              <button type="button" className={model.includeSpecialSamples ? 'chip active' : 'chip'} onClick={() => model.setIncludeSpecialSamples(true)}>納入特殊交易</button>
            </div>
          </div>
          {!model.isLandOnlyMode && (
            <div className="filter-group">
              <span className="filter-label">樓層條件</span>
              <div className="chip-row">
                {[{ id: 'all', label: '全部' }, { id: 'low', label: '低樓層' }, { id: 'mid', label: '中樓層' }, { id: 'high', label: '高樓層' }].map((option) => (
                  <button key={option.id} type="button" className={model.filterFloorType === option.id ? 'chip active' : 'chip'} onClick={() => model.setFilterFloorType(option.id)}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="panel-inline-hint">
          <HintBadge text={model.isLandOnlyMode ? `目前已套用交易標的：${activeTradeTargets.join(' / ')}。土地模式下不顯示產品類型、建物型態、房數、屋齡、車位與樓層條件。` : `目前已套用交易標的：${activeTradeTargets.join(' / ')}。`} />
        </div>
      </section>

      <section className={`panel compact-panel ${model.includeSpecialSamples ? 'special-sample-panel' : ''}`}>
        <div className="panel-head compact">
          <div>
            <h3>特殊樣本狀態</h3>
            <p>{model.includeSpecialSamples ? `目前結果已納入特殊樣本，共 ${specialSampleCount.toLocaleString()} 筆，列表會另外標示。` : '目前結果已排除特殊樣本，較適合作為一般市場比較基準。'}</p>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <DataBreakdownCard title={<><span>總價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看目前篩選結果主要落在哪些總價區間。" items={filterTotalPriceItems} emptyText="目前條件下沒有可顯示的總價分布。" />
        <DataBreakdownCard title={<><span>單價分布</span><SampleStatusTag includeSpecialSamples={model.includeSpecialSamples} /></>} subtitle="看目前篩選結果主要落在哪些單價區間。" items={filterUnitPriceItems} emptyText="目前條件下沒有可顯示的單價分布。" />
      </div>

      <div className="metric-grid">
        <MetricCard label="篩選後件數" value={`${model.filterPageSummary.volume.toLocaleString()} 筆`} helper="目前條件下的成交樣本數" accent="blue" showHint={false} />
        <MetricCard label="單價中位數" value={model.filterPageSummary.medianPrice > 0 ? `${formatPrice(model.filterPageSummary.medianPrice)} 萬/坪` : '-'} helper="目前條件下的成交單價中位數" accent="amber" showHint={false} />
        <MetricCard label="總價中位數" value={model.filterPageSummary.medianTotalPrice > 0 ? `${model.filterPageSummary.medianTotalPrice} 萬` : '-'} helper="目前條件下的成交總價中位數" accent="slate" showHint={false} />
        <MetricCard label={model.isLandOnlyMode ? '平均土地坪數' : '平均建坪'} value={model.filterPageSummary.avgPing > 0 ? `${model.filterPageSummary.avgPing} 坪` : '-'} helper={model.isLandOnlyMode ? '目前條件下樣本的平均土地坪數' : '目前條件下樣本的平均建坪'} accent="green" showHint={false} />
      </div>

      <section className="panel transactions-panel">
        <div className="panel-head">
          <div>
            <h3>篩選結果列表</h3>
            <p>先看篩選後的成交樣本，再從總價、單價、坪數、樓層和格局找到更接近需求的案例。</p>
          </div>
        </div>
        {resultRows.length > 0 ? (
          <div className="table-shell">
            <table className="records-table">
              <thead>
                <tr>
                  <th>交易年月</th>
                  <th>位置 / 社區</th>
                  <th>產品類型</th>
                  <th>建物型態</th>
                  <th>房數</th>
                  <th>{model.isLandOnlyMode ? '土地坪數' : '建坪'}</th>
                  <th>樓層</th>
                  <th>總價</th>
                  <th>單價</th>
                </tr>
              </thead>
              <tbody>
                {resultRows.map((record) => (
                  <tr key={record.key} id={`record-row-${record.key}`} className={activeRecordKey === record.key ? 'is-active-row' : ''}>
                    <td>{record.year} / {String(record.month).padStart(2, '0')}</td>
                    <td>
                      <button type="button" className="inline-link-button" onClick={() => onOpenTransaction(record.key)}>
                        {record.locationName || record.projectName || '-'}
                      </button>
                      {record.isSpecialSample ? <span className="sample-flag">特殊樣本</span> : null}
                    </td>
                    <td>{record.type === 'presale' ? '預售屋' : '中古屋'}</td>
                    <td>{record.buildType || '-'}</td>
                    <td>{model.isLandOnlyMode ? '-' : (record.roomCount > 0 ? `${record.roomCount} 房` : '-')}</td>
                    <td>{record.totalPing || record.landPing ? `${Number(record.totalPing || record.landPing).toFixed(1)} 坪` : '-'}</td>
                    <td>{model.isLandOnlyMode ? '-' : (record.level || '-')}</td>
                    <td>{record.totalPrice ? `${Math.round(record.totalPrice / 10000)} 萬` : '-'}</td>
                    <td>{record.unitPricePing ? `${formatPrice(record.unitPricePing)} 萬/坪` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state">目前條件下沒有符合的成交資料。</div>}
        <div className="cta-row">
          <button type="button" className="cta-secondary" onClick={() => onJump('community')}>
            往下看社區分析
          </button>
        </div>
      </section>
    </div>
  )
}
