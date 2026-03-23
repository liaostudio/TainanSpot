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
          ? '預售+成屋'
          : '預售建案'
        : '成屋社區',
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
    structure: presaleCount > existingCount ? '預售屋帶動' : '中古屋熱銷',
    health: currentMedian >= fullMedian ? '穩健走升' : '盤整觀望',
    volatility: cv > 10 ? '波動偏高' : cv > 6 ? '波動中等' : '波動中低',
    liquidity: current.length > 80 ? '去化很快' : current.length > 30 ? '去化穩定' : '去化偏慢',
    momentum: current.length > records.length * 0.35 ? '大幅擴量' : '動能平穩',
  }
}
