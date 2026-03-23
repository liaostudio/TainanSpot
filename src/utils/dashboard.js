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
