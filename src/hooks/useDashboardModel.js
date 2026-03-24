import { useEffect, useMemo, useState } from 'react'
import {
  cityTrendByTab,
  comparisonSeries,
  districtOverviews,
  districtTrendMap,
} from '../data/dashboardData.js'
import {
  buildAgeDistribution,
  buildBuildingTypeMix,
  buildBuildingTypeAnalysis,
  buildComparisonSeries,
  buildInsights,
  buildPingDistribution,
  buildPopularLocations,
  buildProjectDetail,
  buildProductTypeAnalysis,
  buildPropertyTypeMix,
  buildRankings,
  buildRoomLayout,
  buildTotalPriceDistribution,
  buildTotalPriceBand,
  buildUnitPriceDistribution,
  buildValueProjects,
  buildVolumeSeries,
  filterSeriesFromYear,
  filterRecordsByScenario,
  groupRecordsByDistrict,
  processTrendData,
  summarizeDistrictRecords,
  summarizeCity,
  withMovingAverage,
  checkBuildingMatch,
} from '../utils/dashboard.js'
import { useHousingData } from './useHousingData.js'

export function useDashboardModel() {
  const [cityActiveTab, setCityActiveTab] = useState('1y')
  const [districtActiveTab, setDistrictActiveTab] = useState('1y')
  const [selectedDistrict, setSelectedDistrict] = useState('東區')
  const [filterDistrict, setFilterDistrict] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [buyerScenario, setBuyerScenario] = useState('all')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState(['existing', 'presale'])
  const [buildingFilter, setBuildingFilter] = useState(['elevator', 'apartment', 'house', 'store'])
  const [filterRoomCount, setFilterRoomCount] = useState('all')
  const [filterAgeRange, setFilterAgeRange] = useState('all')
  const [filterParking, setFilterParking] = useState('all')
  const [filterFloorType, setFilterFloorType] = useState('all')
  const [filterPingMin, setFilterPingMin] = useState('')
  const [filterPingMax, setFilterPingMax] = useState('')
  const [includeSpecialSamples, setIncludeSpecialSamples] = useState(false)
  const {
    isProcessing,
    manifest,
    recordsByDistrict,
    uploadStats,
    latestDataDate,
    isRealMode,
    importMessage,
    importError,
    persistedAt,
    storageMode,
    isSharedMode,
    importedFiles,
    ensureDistrictLoaded,
    loadFiles,
    clearImportedData,
    removeImportedFile,
  } = useHousingData()

  const availableDistricts = useMemo(
    () =>
      isRealMode
        ? manifest.realOverviews.map((item) => item.name)
        : Object.keys(districtTrendMap),
    [isRealMode, manifest.realOverviews],
  )

  const comparisonDistricts = useMemo(
    () => (isRealMode ? availableDistricts.slice(0, 4) : ['東區', '永康區', '善化區', '安平區']),
    [availableDistricts, isRealMode],
  )

  const allLoadedRecords = useMemo(
    () => Array.from(recordsByDistrict.values()).flat(),
    [recordsByDistrict],
  )

  useEffect(() => {
    if (selectedDistrict) ensureDistrictLoaded(selectedDistrict)
  }, [ensureDistrictLoaded, selectedDistrict])

  useEffect(() => {
    comparisonDistricts.forEach((district) => {
      ensureDistrictLoaded(district)
    })
  }, [comparisonDistricts, ensureDistrictLoaded])

  useEffect(() => {
    if (!isRealMode) return
    availableDistricts.forEach((district) => {
      ensureDistrictLoaded(district)
    })
  }, [availableDistricts, ensureDistrictLoaded, isRealMode])

  const districtData = districtTrendMap[selectedDistrict] ?? districtTrendMap.東區
  const districtMeta = manifest.districtMetaByName?.[selectedDistrict] || null
  const loadedSelectedDistrictRecords = useMemo(
    () => recordsByDistrict.get(selectedDistrict) ?? [],
    [recordsByDistrict, selectedDistrict],
  )
  const isSelectedDistrictLoaded = useMemo(
    () => recordsByDistrict.has(selectedDistrict),
    [recordsByDistrict, selectedDistrict],
  )

  const districtAllRecords = useMemo(
    () => (isRealMode ? loadedSelectedDistrictRecords : []),
    [isRealMode, loadedSelectedDistrictRecords],
  )

  const districtBaseRecords = useMemo(
    () =>
      isRealMode
        ? loadedSelectedDistrictRecords.filter(
            (record) =>
              propertyTypeFilter.includes(record.type) &&
              checkBuildingMatch(record, buildingFilter),
          )
        : [],
    [buildingFilter, isRealMode, loadedSelectedDistrictRecords, propertyTypeFilter],
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

  const scenarioDistrictRecords = useMemo(
    () => (isRealMode ? filterRecordsByScenario(districtBaseRecords, buyerScenario) : districtRecords),
    [buyerScenario, districtBaseRecords, districtRecords, isRealMode],
  )

  const realOverviews = useMemo(
    () => (isRealMode ? manifest.realOverviews : districtOverviews),
    [isRealMode, manifest.realOverviews],
  )

  const filteredRealOverviews = useMemo(() => {
    if (!isRealMode) return realOverviews

    const allLoaded = availableDistricts.every((district) => recordsByDistrict.has(district))
    if (!allLoaded) return realOverviews

    return availableDistricts
      .map((district) => {
        const records = recordsByDistrict.get(district) ?? []
        const filtered = records.filter(
          (record) =>
            propertyTypeFilter.includes(record.type) &&
            checkBuildingMatch(record, buildingFilter),
        )

        if (filtered.length === 0) return null

        return {
          city: '台南市',
          name: district,
          ...summarizeDistrictRecords(filtered),
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.volume - a.volume)
  }, [availableDistricts, buildingFilter, isRealMode, propertyTypeFilter, realOverviews, recordsByDistrict])

  const selectedDistrictOverview = useMemo(
    () =>
      filteredRealOverviews.find((item) => item.name === selectedDistrict) ??
      districtMeta?.overview ??
      null,
    [districtMeta?.overview, filteredRealOverviews, selectedDistrict],
  )

  const popularLocations = useMemo(
    () =>
      districtBaseRecords.length > 0
        ? buildPopularLocations(districtBaseRecords)
        : districtMeta?.popularLocations || (districtData.rankings || []).map((item) => item.name),
    [districtBaseRecords, districtData.rankings, districtMeta?.popularLocations],
  )

  const citySummary = useMemo(
    () => (isRealMode ? summarizeCity(filteredRealOverviews) : summarizeCity(realOverviews)),
    [filteredRealOverviews, isRealMode, realOverviews],
  )

  const cityTrend = useMemo(
    () =>
      filterSeriesFromYear(
        isRealMode ? manifest.cityTrendByTab?.[cityActiveTab] || [] : cityTrendByTab[cityActiveTab],
        2012,
      ),
    [cityActiveTab, isRealMode, manifest.cityTrendByTab],
  )

  const cityVolumeTrend = useMemo(
    () =>
      filterSeriesFromYear(
        isRealMode
          ? manifest.cityVolumeTrendByTab?.[cityActiveTab] || []
          : cityTrendByTab[cityActiveTab].map((item) => ({ period: item.period, volume: item.volume })),
        2012,
      ),
    [cityActiveTab, isRealMode, manifest.cityVolumeTrendByTab],
  )

  const districtTrend = useMemo(
    () =>
      districtRecords.length > 0
        ? withMovingAverage(processTrendData(districtRecords, districtActiveTab))
        : districtMeta?.trendByTab?.[districtActiveTab] || districtData.trend[districtActiveTab] || districtData.trend['1y'],
    [districtActiveTab, districtData, districtMeta?.trendByTab, districtRecords],
  )

  const scenarioDistrictTrend = useMemo(
    () => {
      if (scenarioDistrictRecords.length > 0) {
        return withMovingAverage(processTrendData(scenarioDistrictRecords, districtActiveTab))
      }

      if (isRealMode && isSelectedDistrictLoaded) return []

      return (
        districtMeta?.trendByTab?.[districtActiveTab] ||
        districtData.trend[districtActiveTab] ||
        districtData.trend['1y']
      )
    },
    [districtActiveTab, districtData, districtMeta?.trendByTab, isRealMode, isSelectedDistrictLoaded, scenarioDistrictRecords],
  )

  const ageDistribution = useMemo(
    () =>
      districtRecords.length > 0
        ? buildAgeDistribution(districtRecords)
        : districtMeta?.ageDistribution || districtData.ageDistribution,
    [districtData.ageDistribution, districtMeta?.ageDistribution, districtRecords],
  )

  const rankings = useMemo(
    () =>
      districtBaseRecords.length > 0
        ? buildRankings(districtBaseRecords)
        : districtMeta?.rankings || districtData.rankings,
    [districtBaseRecords, districtData.rankings, districtMeta?.rankings],
  )

  const scenarioRankings = useMemo(
    () => {
      if (scenarioDistrictRecords.length > 0) return buildRankings(scenarioDistrictRecords)
      if (isRealMode && isSelectedDistrictLoaded) return []
      return districtMeta?.rankings || districtData.rankings
    },
    [districtData.rankings, districtMeta?.rankings, isRealMode, isSelectedDistrictLoaded, scenarioDistrictRecords],
  )

  const insights = useMemo(
    () =>
      districtRecords.length > 0
        ? buildInsights(districtRecords)
        : districtMeta?.aiReport || districtData.aiReport,
    [districtData.aiReport, districtMeta?.aiReport, districtRecords],
  )

  const roomMix = useMemo(
    () =>
      districtRecords.length > 0
        ? buildRoomLayout(districtRecords)
        : districtMeta?.roomMix || [
            { name: '2房', value: 45 },
            { name: '3房', value: 33 },
            { name: '1房', value: 12 },
            { name: '4房以上', value: 10 },
          ],
    [districtMeta?.roomMix, districtRecords],
  )

  const scenarioRoomMix = useMemo(
    () => {
      if (scenarioDistrictRecords.length > 0) return buildRoomLayout(scenarioDistrictRecords)
      if (isRealMode && isSelectedDistrictLoaded) return []
      return districtMeta?.roomMix || [
        { name: '2房', value: 45 },
        { name: '3房', value: 33 },
        { name: '1房', value: 12 },
        { name: '4房以上', value: 10 },
      ]
    },
    [districtMeta?.roomMix, isRealMode, isSelectedDistrictLoaded, scenarioDistrictRecords],
  )

  const typeMix = useMemo(
    () =>
      districtRecords.length > 0
        ? buildPropertyTypeMix(districtRecords)
        : districtMeta?.typeMix || [
            { name: '中古屋', value: 65 },
            { name: '預售屋', value: 35 },
          ],
    [districtMeta?.typeMix, districtRecords],
  )

  const scenarioTypeMix = useMemo(
    () => {
      if (scenarioDistrictRecords.length > 0) return buildPropertyTypeMix(scenarioDistrictRecords)
      if (isRealMode && isSelectedDistrictLoaded) return []
      return districtMeta?.typeMix || [
        { name: '中古屋', value: 65 },
        { name: '預售屋', value: 35 },
      ]
    },
    [districtMeta?.typeMix, isRealMode, isSelectedDistrictLoaded, scenarioDistrictRecords],
  )

  const comparisonData = useMemo(() => {
    if (!isRealMode) return comparisonSeries

    const loadedComparisonMap = new Map()
    comparisonDistricts.forEach((district) => {
      const records = recordsByDistrict.get(district) ?? []
      const filtered = records.filter(
        (record) =>
          propertyTypeFilter.includes(record.type) &&
          checkBuildingMatch(record, buildingFilter),
      )
      if (filtered.length > 0) loadedComparisonMap.set(district, filtered)
    })

    if (loadedComparisonMap.size === comparisonDistricts.length) {
      return buildComparisonSeries(loadedComparisonMap, comparisonDistricts, districtActiveTab)
    }

    return manifest.comparisonSeriesByTab?.[districtActiveTab] || []
  }, [buildingFilter, comparisonDistricts, districtActiveTab, isRealMode, manifest.comparisonSeriesByTab, propertyTypeFilter, recordsByDistrict])

  const scenarioDistrictOverview = useMemo(
    () => {
      if (scenarioDistrictRecords.length > 0) {
        return summarizeDistrictRecords(scenarioDistrictRecords)
      }

      if (isRealMode && isSelectedDistrictLoaded) {
        return {
          price: 0,
          yoy: 0,
          volume: 0,
        }
      }

      return selectedDistrictOverview
    },
    [isRealMode, isSelectedDistrictLoaded, scenarioDistrictRecords, selectedDistrictOverview],
  )

  const scenarioResidentialRecords = useMemo(() => {
    const filtered = scenarioDistrictRecords.filter(
      (record) => !(record.buildType || '').match(/店面|店鋪|商辦|辦公商業大樓|廠辦|透天/),
    )
    return filtered.length > 0 ? filtered : scenarioDistrictRecords
  }, [scenarioDistrictRecords])

  const latestReferenceDate = useMemo(() => {
    if (!latestDataDate) return null
    const match = latestDataDate.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/)
    if (!match) return null
    return {
      year: Number(match[1]),
      month: Number(match[2]),
    }
  }, [latestDataDate])

  const districtTotalPriceBand = useMemo(
    () => buildTotalPriceBand(scenarioResidentialRecords, latestReferenceDate),
    [latestReferenceDate, scenarioResidentialRecords],
  )

  const districtTotalPriceDistribution = useMemo(
    () => buildTotalPriceDistribution(scenarioDistrictRecords),
    [scenarioDistrictRecords],
  )

  const districtUnitPriceDistribution = useMemo(
    () => buildUnitPriceDistribution(scenarioDistrictRecords),
    [scenarioDistrictRecords],
  )

  const districtBuildingTypeMix = useMemo(
    () => buildBuildingTypeMix(scenarioDistrictRecords),
    [scenarioDistrictRecords],
  )

  const productAnalysisRecords = useMemo(() => {
    if (!isRealMode) return districtBaseRecords

    const source = allLoadedRecords.length > 0 ? allLoadedRecords : districtBaseRecords
    return source.filter(
      (record) =>
        propertyTypeFilter.includes(record.type) &&
        checkBuildingMatch(record, buildingFilter),
    )
  }, [allLoadedRecords, buildingFilter, districtBaseRecords, isRealMode, propertyTypeFilter])

  const productTypeAnalysisRows = useMemo(
    () => buildProductTypeAnalysis(productAnalysisRecords),
    [productAnalysisRecords],
  )

  const buildingTypeAnalysisRows = useMemo(
    () => buildBuildingTypeAnalysis(productAnalysisRecords),
    [productAnalysisRecords],
  )

  const productPingDistribution = useMemo(
    () => buildPingDistribution(productAnalysisRecords),
    [productAnalysisRecords],
  )

  const productTotalPriceDistribution = useMemo(
    () => buildTotalPriceDistribution(productAnalysisRecords),
    [productAnalysisRecords],
  )

  const productUnitPriceDistribution = useMemo(
    () => buildUnitPriceDistribution(productAnalysisRecords),
    [productAnalysisRecords],
  )

  const productAnalysisSummary = useMemo(() => {
    if (productAnalysisRecords.length === 0) {
      return {
        volume: 0,
        medianTotalPrice: 0,
        medianUnitPrice: 0,
        avgPing: 0,
      }
    }

    const totalPrices = productAnalysisRecords
      .map((record) => (record.totalPrice > 0 ? record.totalPrice / 10000 : 0))
      .filter((price) => price > 0)
    const unitPrices = productAnalysisRecords
      .map((record) => Number(record.unitPricePing || 0))
      .filter((price) => price > 0)
    const pings = productAnalysisRecords
      .map((record) => Number(record.totalPing || 0))
      .filter((ping) => ping > 0)

    return {
      volume: productAnalysisRecords.length,
      medianTotalPrice: totalPrices.length ? Math.round(totalPrices.sort((a, b) => a - b)[Math.floor(totalPrices.length / 2)]) : 0,
      medianUnitPrice: unitPrices.length ? Number(unitPrices.sort((a, b) => a - b)[Math.floor(unitPrices.length / 2)].toFixed(2)) : 0,
      avgPing: pings.length ? Number((pings.reduce((sum, ping) => sum + ping, 0) / pings.length).toFixed(1)) : 0,
    }
  }, [productAnalysisRecords])

  const regionalOverviewRows = useMemo(() => {
    if (filteredRealOverviews.length === 0) return []

    return filteredRealOverviews
      .map((item) => ({
        district: item.name,
        volume: item.volume,
        price: item.price,
        yoy: item.yoy,
      }))
      .sort((a, b) => b.volume - a.volume)
  }, [filteredRealOverviews])

  const valueProjects = useMemo(
    () => buildValueProjects(scenarioDistrictRecords, scenarioDistrictOverview?.price || 0),
    [scenarioDistrictOverview?.price, scenarioDistrictRecords],
  )

  const minPrice =
    filteredRealOverviews.length > 0 ? Math.min(...filteredRealOverviews.map((item) => item.price)) : 0
  const maxPrice =
    filteredRealOverviews.length > 0 ? Math.max(...filteredRealOverviews.map((item) => item.price)) : 0

  useEffect(() => {
    if (availableDistricts.length > 0 && !availableDistricts.includes(selectedDistrict)) {
      setSelectedDistrict(availableDistricts[0])
    }
  }, [availableDistricts, selectedDistrict])

  useEffect(() => {
    setSelectedLocation('all')
    setBuyerScenario('all')
  }, [selectedDistrict])

  useEffect(() => {
    if (selectedLocation !== 'all' && !popularLocations.includes(selectedLocation)) {
      setSelectedLocation('all')
    }
  }, [popularLocations, selectedLocation])

  const filterPageBaseRecords = useMemo(() => {
    if (isRealMode) {
      const source = allLoadedRecords.length > 0 ? allLoadedRecords : districtAllRecords
      return source.filter(
        (record) =>
          propertyTypeFilter.includes(record.type) &&
          checkBuildingMatch(record, buildingFilter) &&
          (filterDistrict === 'all' ? true : record.district === filterDistrict),
      )
    }

    return districtRecords
  }, [
    allLoadedRecords,
    buildingFilter,
    districtAllRecords,
    districtRecords,
    filterDistrict,
    isRealMode,
    propertyTypeFilter,
  ])

  const filterPageRecords = useMemo(() => {
    return filterPageBaseRecords.filter((record) => {
      const matchesRoom =
        filterRoomCount === 'all'
          ? true
          : filterRoomCount === '4+'
            ? record.roomCount >= 4
            : record.roomCount === Number(filterRoomCount)

      const matchesAge =
        filterAgeRange === 'all'
          ? true
          : filterAgeRange === '0-5'
            ? record.age >= 0 && record.age <= 5
            : filterAgeRange === '6-15'
              ? record.age >= 6 && record.age <= 15
              : filterAgeRange === '16-30'
                ? record.age >= 16 && record.age <= 30
                : record.age > 30

      const matchesParking =
        filterParking === 'all'
          ? true
          : filterParking === 'yes'
            ? record.hasPark
            : !record.hasPark

      const pingValue = Number(record.totalPing || 0)
      const minPing = filterPingMin === '' ? null : Number(filterPingMin)
      const maxPing = filterPingMax === '' ? null : Number(filterPingMax)
      const matchesPing =
        (minPing == null || pingValue >= minPing) &&
        (maxPing == null || pingValue <= maxPing)

      const floorNum = Number(record.floorNum || -999)
      const matchesFloor =
        filterFloorType === 'all'
          ? true
          : filterFloorType === 'low'
            ? floorNum >= 0 && floorNum <= 5
            : filterFloorType === 'mid'
              ? floorNum >= 6 && floorNum <= 14
              : floorNum >= 15

      const matchesSpecial = includeSpecialSamples ? true : !record.isSpecialSample

      return matchesRoom && matchesAge && matchesParking && matchesPing && matchesFloor && matchesSpecial
    })
  }, [
    filterAgeRange,
    filterFloorType,
    filterPageBaseRecords,
    filterParking,
    filterPingMax,
    filterPingMin,
    filterRoomCount,
    includeSpecialSamples,
  ])

  const filterPageSummary = useMemo(() => {
    if (filterPageRecords.length === 0) {
      return {
        volume: 0,
        medianPrice: 0,
        medianTotalPrice: 0,
        avgPing: 0,
      }
    }

    const priceValues = filterPageRecords
      .map((record) => Number(record.unitPricePing || 0))
      .filter((price) => price > 0)
    const totalPrices = filterPageRecords
      .map((record) => (record.totalPrice > 0 ? record.totalPrice / 10000 : 0))
      .filter((price) => price > 0)
    const pingValues = filterPageRecords
      .map((record) => Number(record.totalPing || 0))
      .filter((ping) => ping > 0)

    const median = (values) => {
      if (values.length === 0) return 0
      const sorted = [...values].sort((a, b) => a - b)
      const middle = Math.floor(sorted.length / 2)
      return sorted.length % 2 !== 0
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2
    }

    return {
      volume: filterPageRecords.length,
      medianPrice: Number(median(priceValues).toFixed(2)),
      medianTotalPrice: totalPrices.length ? Math.round(median(totalPrices)) : 0,
      avgPing: pingValues.length
        ? Number((pingValues.reduce((sum, value) => sum + value, 0) / pingValues.length).toFixed(1))
        : 0,
    }
  }, [filterPageRecords])

  const filterPageTotalPriceDistribution = useMemo(
    () => buildTotalPriceDistribution(filterPageRecords),
    [filterPageRecords],
  )

  const filterPageUnitPriceDistribution = useMemo(
    () => buildUnitPriceDistribution(filterPageRecords),
    [filterPageRecords],
  )

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
    if (districtAllRecords.length > 0) return buildProjectDetail(projectName, districtAllRecords)

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

  const getTransactionDetail = (recordKey) => {
    if (!recordKey) return null

    const source = allLoadedRecords.length > 0 ? allLoadedRecords : [
      ...filterPageRecords,
      ...districtAllRecords,
    ]

    return source.find((record) => record.key === recordKey) || null
  }

  return {
    cityActiveTab,
    setCityActiveTab,
    districtActiveTab,
    setDistrictActiveTab,
    selectedDistrict,
    setSelectedDistrict,
    filterDistrict,
    setFilterDistrict,
    selectedLocation,
    setSelectedLocation,
    buyerScenario,
    setBuyerScenario,
    propertyTypeFilter,
    buildingFilter,
    filterRoomCount,
    setFilterRoomCount,
    filterAgeRange,
    setFilterAgeRange,
    filterParking,
    setFilterParking,
    filterFloorType,
    setFilterFloorType,
    filterPingMin,
    setFilterPingMin,
    filterPingMax,
    setFilterPingMax,
    includeSpecialSamples,
    setIncludeSpecialSamples,
    togglePropertyType,
    toggleBuildingType,
    isProcessing,
    uploadStats,
    latestDataDate,
    isRealMode,
    importMessage,
    importError,
    persistedAt,
    storageMode,
    isSharedMode,
    importedFiles,
    loadFiles,
    clearImportedData,
    removeImportedFile,
    availableDistricts,
    citySummary,
    cityTrend,
    cityVolumeTrend,
    comparisonData,
    realOverviews: filteredRealOverviews,
    rawOverviews: realOverviews,
    districtRecords,
    districtBaseRecords,
    districtAllRecords,
    districtTrend,
    scenarioDistrictTrend,
    ageDistribution,
    rankings,
    scenarioRankings,
    insights,
    roomMix,
    scenarioRoomMix,
    typeMix,
    scenarioTypeMix,
    popularLocations,
    selectedDistrictOverview,
    scenarioDistrictOverview,
    districtTotalPriceBand,
    districtTotalPriceDistribution,
    districtUnitPriceDistribution,
    districtBuildingTypeMix,
    productAnalysisSummary,
    productTypeAnalysisRows,
    buildingTypeAnalysisRows,
    productPingDistribution,
    productTotalPriceDistribution,
    productUnitPriceDistribution,
    filterPageRecords,
    filterPageSummary,
    filterPageTotalPriceDistribution,
    filterPageUnitPriceDistribution,
    regionalOverviewRows,
    valueProjects,
    minPrice,
    maxPrice,
    getProjectDetail,
    getTransactionDetail,
  }
}
