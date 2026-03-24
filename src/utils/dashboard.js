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

export function sampleSeries(data, maxPoints = 24) {
  if (!Array.isArray(data) || data.length <= maxPoints) return data

  const result = []
  const lastIndex = data.length - 1

  for (let index = 0; index < maxPoints; index += 1) {
    const mappedIndex = Math.round((index / (maxPoints - 1)) * lastIndex)
    const item = data[mappedIndex]
    if (!item) continue
    if (result[result.length - 1]?.period === item.period) continue
    result.push(item)
  }

  if (result[0]?.period !== data[0]?.period) result.unshift(data[0])
  if (result[result.length - 1]?.period !== data[lastIndex]?.period) result.push(data[lastIndex])

  return result
}

export function filterSeriesFromYear(data, minYear = 2012) {
  if (!Array.isArray(data)) return []

  return data.filter((item) => {
    const period = String(item?.period || '')
    const yearMatch = period.match(/^(\d{4})/)
    if (!yearMatch) return true
    return Number(yearMatch[1]) >= minYear
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

function getPercentile(numbers, percentile) {
  if (!numbers || numbers.length === 0) return 0
  const sorted = [...numbers].sort((a, b) => a - b)
  const index = (sorted.length - 1) * percentile
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
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

export function normalizeTradeTarget(rawTarget = '') {
  const target = String(rawTarget || '')
  if (target.includes('土地')) return '土地'
  if (target.includes('房地') && target.includes('車位')) return '房地+車位'
  if (target.includes('房地')) return '房地'
  if (target.includes('建物')) return '建物'
  return target || '其他'
}

export function matchesTradeTarget(record, tradeTargetFilter) {
  if (!tradeTargetFilter || tradeTargetFilter.length === 0) return false
  if (tradeTargetFilter.includes('all')) return true
  return tradeTargetFilter.includes(normalizeTradeTarget(record.tradeTarget))
}

export function recordMatchesBuildingFilter(record, buildingFilter) {
  if (normalizeTradeTarget(record.tradeTarget) === '土地') return true
  return checkBuildingMatch(record, buildingFilter)
}

export function summarizeCity(overviews) {
  if (!overviews || overviews.length === 0) {
    return {
      price: 0,
      yoy: 0,
      volume: 0,
      hottest: { name: '-' },
      mostAffordable: { name: '-' },
    }
  }

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
  const latestRecord = records.reduce((latest, record) => {
    const currentValue = (record.year || 0) * 100 + (record.month || 0)
    const latestValue = (latest.year || 0) * 100 + (latest.month || 0)
    return currentValue > latestValue ? record : latest
  }, records[0])

  const latestMonthIndex = (latestRecord.year || 0) * 12 + ((latestRecord.month || 1) - 1)
  const monthWindow =
    timeFrame === '1y' ? 12 : timeFrame === '3y' ? 36 : timeFrame === '5y' ? 60 : timeFrame === '10y' ? 120 : null

  const scopedRecords = monthWindow
    ? records.filter((record) => {
        const monthIndex = (record.year || 0) * 12 + ((record.month || 1) - 1)
        const diff = latestMonthIndex - monthIndex
        return diff >= 0 && diff < monthWindow
      })
    : records

  if (scopedRecords.length === 0) return []

  const grouped = {}

  scopedRecords.forEach((record) => {
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

export function buildTotalPriceDistribution(records) {
  const buckets = [
    { name: '500萬以下', min: 0, max: 500 },
    { name: '500-1000萬', min: 500, max: 1000 },
    { name: '1000-1500萬', min: 1000, max: 1500 },
    { name: '1500-2000萬', min: 1500, max: 2000 },
    { name: '2000萬以上', min: 2000, max: Infinity },
  ]

  const counts = new Map(buckets.map((bucket) => [bucket.name, 0]))
  records.forEach((record) => {
    const totalPrice = record.totalPrice > 0 ? record.totalPrice / 10000 : 0
    if (totalPrice <= 0) return
    const bucket = buckets.find((item) => totalPrice >= item.min && totalPrice < item.max)
    if (!bucket) return
    counts.set(bucket.name, (counts.get(bucket.name) || 0) + 1)
  })

  return buckets
    .map((bucket) => ({ name: bucket.name, value: counts.get(bucket.name) || 0 }))
    .filter((item) => item.value > 0)
}

export function buildUnitPriceDistribution(records) {
  const buckets = [
    { name: '20萬以下', min: 0, max: 20 },
    { name: '20-30萬', min: 20, max: 30 },
    { name: '30-40萬', min: 30, max: 40 },
    { name: '40-50萬', min: 40, max: 50 },
    { name: '50萬以上', min: 50, max: Infinity },
  ]

  const counts = new Map(buckets.map((bucket) => [bucket.name, 0]))
  records.forEach((record) => {
    const unitPrice = Number(record.unitPricePing || 0)
    if (unitPrice <= 0) return
    const bucket = buckets.find((item) => unitPrice >= item.min && unitPrice < item.max)
    if (!bucket) return
    counts.set(bucket.name, (counts.get(bucket.name) || 0) + 1)
  })

  return buckets
    .map((bucket) => ({ name: bucket.name, value: counts.get(bucket.name) || 0 }))
    .filter((item) => item.value > 0)
}

export function buildBuildingTypeMix(records) {
  const buckets = {
    '大樓 / 華廈': 0,
    公寓: 0,
    透天: 0,
    '店面 / 商辦': 0,
    其他: 0,
  }

  records.forEach((record) => {
    const buildType = record.buildType || ''
    if (buildType.includes('大樓') || buildType.includes('華廈')) buckets['大樓 / 華廈'] += 1
    else if (buildType.includes('公寓')) buckets['公寓'] += 1
    else if (buildType.includes('透天')) buckets['透天'] += 1
    else if (buildType.includes('店面') || buildType.includes('店鋪') || buildType.includes('商辦')) buckets['店面 / 商辦'] += 1
    else buckets.其他 += 1
  })

  return Object.entries(buckets)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
}

export function buildTradeTargetAnalysis(records) {
  const buckets = {
    土地: [],
    建物: [],
    房地: [],
    '房地+車位': [],
    其他: [],
  }

  records.forEach((record) => {
    const key = normalizeTradeTarget(record.tradeTarget)
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(record)
  })

  return Object.entries(buckets)
    .map(([name, items]) => ({
      name,
      ...summarizeAnalysisGroup(items),
    }))
    .filter((item) => item.volume > 0)
}

export function buildLandDistrictAnalysis(records) {
  const groups = new Map()

  records.forEach((record) => {
    if (normalizeTradeTarget(record.tradeTarget) !== '土地') return
    if (!groups.has(record.district)) groups.set(record.district, [])
    groups.get(record.district).push(record)
  })

  return Array.from(groups.entries())
    .map(([district, items]) => ({
      district,
      ...summarizeAnalysisGroup(items),
    }))
    .filter((item) => item.volume > 0)
    .sort((a, b) => b.volume - a.volume)
}

function getBuildingCategory(buildType = '') {
  if (buildType.includes('大樓') || buildType.includes('華廈')) return '大樓 / 華廈'
  if (buildType.includes('公寓')) return '公寓'
  if (buildType.includes('透天')) return '透天'
  if (buildType.includes('店面') || buildType.includes('店鋪') || buildType.includes('商辦')) {
    return '店面 / 商辦'
  }
  return '其他'
}

function summarizeAnalysisGroup(records) {
  const totalPrices = records
    .map((record) => (record.totalPrice > 0 ? record.totalPrice / 10000 : 0))
    .filter((price) => price > 0)
  const unitPrices = records
    .map((record) => Number(record.unitPricePing || 0))
    .filter((price) => price > 0)
  const pings = records
    .map((record) => Number(record.totalPing || record.landPing || 0))
    .filter((ping) => ping > 0)

  return {
    volume: records.length,
    medianTotalPrice: totalPrices.length ? Number(getMedian(totalPrices).toFixed(0)) : 0,
    medianUnitPrice: unitPrices.length ? Number(getMedian(unitPrices).toFixed(2)) : 0,
    avgPing: pings.length ? Number((sum(pings) / pings.length).toFixed(1)) : 0,
  }
}

export function buildProductTypeAnalysis(records) {
  const buckets = {
    中古屋: [],
    預售屋: [],
  }

  records.forEach((record) => {
    const key = record.type === 'presale' ? '預售屋' : '中古屋'
    buckets[key].push(record)
  })

  return Object.entries(buckets)
    .map(([name, items]) => ({
      name,
      ...summarizeAnalysisGroup(items),
    }))
    .filter((item) => item.volume > 0)
}

export function buildBuildingTypeAnalysis(records) {
  const buckets = {
    '大樓 / 華廈': [],
    公寓: [],
    透天: [],
    '店面 / 商辦': [],
    其他: [],
  }

  records.forEach((record) => {
    buckets[getBuildingCategory(record.buildType || '')].push(record)
  })

  return Object.entries(buckets)
    .map(([name, items]) => ({
      name,
      ...summarizeAnalysisGroup(items),
    }))
    .filter((item) => item.volume > 0)
}

export function buildPingDistribution(records) {
  const buckets = [
    { name: '20坪以下', min: 0, max: 20 },
    { name: '20-30坪', min: 20, max: 30 },
    { name: '30-40坪', min: 30, max: 40 },
    { name: '40-50坪', min: 40, max: 50 },
    { name: '50坪以上', min: 50, max: Infinity },
  ]

  const counts = new Map(buckets.map((bucket) => [bucket.name, 0]))
  records.forEach((record) => {
    const ping = Number(record.totalPing || record.landPing || 0)
    if (ping <= 0) return
    const bucket = buckets.find((item) => ping >= item.min && ping < item.max)
    if (!bucket) return
    counts.set(bucket.name, (counts.get(bucket.name) || 0) + 1)
  })

  return buckets
    .map((bucket) => ({ name: bucket.name, value: counts.get(bucket.name) || 0 }))
    .filter((item) => item.value > 0)
}

export function buildRankings(records) {
  const groups = {}
  records.forEach((record) => {
    const key = record.locationName || '其他路段'
    if (!groups[key]) groups[key] = []
    groups[key].push(record)
  })

  return Object.entries(groups)
    .map(([name, entries]) => {
      const totalPrices = entries
        .map((entry) => (entry.totalPrice > 0 ? entry.totalPrice / 10000 : 0))
        .filter((price) => price > 0)
      const lowTotal = getPercentile(totalPrices, 0.25)
      const highTotal = getPercentile(totalPrices, 0.75)
      const maxYear = Math.max(...entries.map((entry) => entry.year || 0))

      return {
        name,
        medianPrice: Number(getMedian(entries.map((entry) => entry.unitPricePing)).toFixed(2)),
        volume: entries.length,
        medianTotalPrice: Number(getMedian(totalPrices).toFixed(0)),
        totalPriceBand: {
          low: Number(lowTotal.toFixed(0)),
          high: Number(highTotal.toFixed(0)),
        },
        totalPriceBandLabel:
          totalPrices.length > 0 ? `${Math.round(lowTotal)} - ${Math.round(highTotal)} 萬` : '-',
        latestYear: maxYear,
        type: entries.some((entry) => entry.type === 'presale')
          ? entries.some((entry) => entry.type === 'existing')
            ? '新舊都有'
            : '預售屋'
          : '中古屋社區',
      }
    })
    .filter((item) => item.medianPrice > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 8)
}

export function buildTotalPriceBand(records, referenceDate = null) {
  if (!records || records.length === 0) {
    return {
      median: 0,
      low: 0,
      high: 0,
      average: 0,
      label: '-',
    }
  }

  const latestMonthIndex = referenceDate
    ? referenceDate.year * 12 + (referenceDate.month - 1)
    : (() => {
        const latestRecord = records.reduce((latest, record) => {
          const currentValue = (record.year || 0) * 100 + (record.month || 0)
          const latestValue = (latest.year || 0) * 100 + (latest.month || 0)
          return currentValue > latestValue ? record : latest
        }, records[0])
        return (latestRecord.year || 0) * 12 + ((latestRecord.month || 1) - 1)
      })()

  const recentYearRecords = records.filter((record) => {
    const monthIndex = (record.year || 0) * 12 + ((record.month || 1) - 1)
    const diff = latestMonthIndex - monthIndex
    return diff >= 0 && diff < 12
  })

  const totalPrices = recentYearRecords
    .map((record) => (record.totalPrice > 0 ? record.totalPrice / 10000 : 0))
    .filter((price) => price > 0)

  if (totalPrices.length === 0) {
    return {
      median: 0,
      low: 0,
      high: 0,
      average: 0,
      label: '-',
    }
  }

  const low = getPercentile(totalPrices, 0.25)
  const high = getPercentile(totalPrices, 0.75)
  const median = getMedian(totalPrices)
  const average = sum(totalPrices) / totalPrices.length

  return {
    median: Number(median.toFixed(0)),
    low: Number(low.toFixed(0)),
    high: Number(high.toFixed(0)),
    average: Number(average.toFixed(0)),
    label: `${Math.round(average)} 萬`,
  }
}

export function filterRecordsByScenario(records, scenario) {
  if (scenario === 'starter') {
    return records.filter((record) => record.roomCount === 1 || record.roomCount === 2)
  }

  if (scenario === 'upgrade') {
    return records.filter((record) => record.roomCount === 3 || record.roomCount >= 4)
  }

  return records
}

export function summarizeDistrictRecords(records) {
  if (!records || records.length === 0) {
    return {
      price: 0,
      medianTotalPrice: 0,
      yoy: 0,
      volume: 0,
    }
  }

  const maxYear = Math.max(...records.map((record) => record.year || 0))
  const current = records.filter((record) => record.year === maxYear)
  const previous = records.filter((record) => record.year === maxYear - 1)
  const currentMedian = getMedian(current.map((record) => record.unitPricePing))
  const previousMedian = getMedian(previous.map((record) => record.unitPricePing))
  const totalPrices = current
    .map((record) => (record.totalPrice > 0 ? record.totalPrice / 10000 : 0))
    .filter((price) => price > 0)
  const yoy = previousMedian > 0 ? ((currentMedian - previousMedian) / previousMedian) * 100 : 0

  return {
    price: Number(currentMedian.toFixed(2)),
    medianTotalPrice: totalPrices.length ? Number(getMedian(totalPrices).toFixed(0)) : 0,
    yoy: Number(yoy.toFixed(1)),
    volume: current.length || records.length,
  }
}

export function buildValueProjects(records, districtAveragePrice) {
  if (!records || records.length === 0 || !districtAveragePrice) return []

  return buildRankings(records)
    .filter((project) => project.volume >= 5)
    .filter((project) => project.medianPrice < districtAveragePrice)
    .filter((project) => project.latestYear >= 2025)
    .sort((a, b) => {
      const scoreA = (districtAveragePrice - a.medianPrice) * a.volume
      const scoreB = (districtAveragePrice - b.medianPrice) * b.volume
      return scoreB - scoreA
    })
    .slice(0, 6)
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

  const residentialRecords = projectRecords.filter(
    (record) => !(record.buildType || '').match(/店面|店鋪|商辦/),
  )
  const analysisRecords = residentialRecords.length > 0 ? residentialRecords : projectRecords

  const prices = analysisRecords.map((record) => record.unitPricePing).filter((price) => price > 0)
  const totalPrices = analysisRecords.map((record) => record.totalPrice).filter((price) => price > 0)
  const pings = analysisRecords.map((record) => record.totalPing).filter((ping) => ping > 0)
  const projectMedian = getMedian(prices)
  const maxRecord = [...analysisRecords].sort((a, b) => b.unitPricePing - a.unitPricePing)[0]
  const minRecord = [...analysisRecords].sort((a, b) => a.unitPricePing - b.unitPricePing)[0]

  const groupedFloors = {}
  analysisRecords.forEach((record) => {
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

  const trend = withMovingAverage(processTrendData(analysisRecords, '1y'))
  const roomMix = buildRoomLayout(analysisRecords)
  const typeMix = buildPropertyTypeMix(analysisRecords)

  return {
    projectName,
    records: [...analysisRecords].reverse(),
    trend,
    roomMix,
    typeMix,
    floorStats,
    stats: {
      medianPrice: Number(projectMedian.toFixed(2)),
      avgTotalPrice: totalPrices.length ? Math.round(sum(totalPrices) / totalPrices.length / 10000) : 0,
      avgPing: pings.length ? Number((sum(pings) / pings.length).toFixed(1)) : 0,
      volume: analysisRecords.length,
      maxRecord,
      minRecord,
    },
  }
}
