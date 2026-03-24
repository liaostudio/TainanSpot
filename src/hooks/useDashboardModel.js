import { useEffect, useMemo, useState } from 'react'
import {
  cityTrendByTab,
  comparisonSeries,
  districtOverviews,
  districtTrendMap,
} from '../data/dashboardData.js'
import {
  buildAgeDistribution,
  buildComparisonSeries,
  buildInsights,
  buildPopularLocations,
  buildProjectDetail,
  buildPropertyTypeMix,
  buildRankings,
  buildRoomLayout,
  buildTotalPriceBand,
  buildValueProjects,
  buildVolumeSeries,
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
  const [activeTab, setActiveTab] = useState('1y')
  const [selectedDistrict, setSelectedDistrict] = useState('東區')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [buyerScenario, setBuyerScenario] = useState('all')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState(['existing', 'presale'])
  const [buildingFilter, setBuildingFilter] = useState(['elevator', 'apartment', 'house', 'store'])
  const [totalPriceRange, setTotalPriceRange] = useState({ min: '', max: '' })
  const [totalPingRange, setTotalPingRange] = useState({ min: '', max: '' })
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

  useEffect(() => {
    if (selectedDistrict) ensureDistrictLoaded(selectedDistrict)
  }, [ensureDistrictLoaded, selectedDistrict])

  useEffect(() => {
    comparisonDistricts.forEach((district) => {
      ensureDistrictLoaded(district)
    })
  }, [comparisonDistricts, ensureDistrictLoaded])

  const districtData = districtTrendMap[selectedDistrict] ?? districtTrendMap.東區
  const districtMeta = manifest.districtMetaByName?.[selectedDistrict] || null
  const loadedSelectedDistrictRecords = useMemo(
    () => recordsByDistrict.get(selectedDistrict) ?? [],
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
              checkBuildingMatch(record, buildingFilter) &&
              (totalPriceRange.min === '' || record.totalPrice / 10000 >= Number(totalPriceRange.min)) &&
              (totalPriceRange.max === '' || record.totalPrice / 10000 <= Number(totalPriceRange.max)) &&
              (totalPingRange.min === '' || record.totalPing >= Number(totalPingRange.min)) &&
              (totalPingRange.max === '' || record.totalPing <= Number(totalPingRange.max)),
          )
        : [],
    [
      buildingFilter,
      isRealMode,
      loadedSelectedDistrictRecords,
      propertyTypeFilter,
      totalPingRange,
      totalPriceRange,
    ],
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

  const selectedDistrictOverview = useMemo(
    () =>
      realOverviews.find((item) => item.name === selectedDistrict) ??
      districtMeta?.overview ??
      null,
    [districtMeta?.overview, realOverviews, selectedDistrict],
  )

  const popularLocations = useMemo(
    () =>
      districtBaseRecords.length > 0
        ? buildPopularLocations(districtBaseRecords)
        : districtMeta?.popularLocations || (districtData.rankings || []).map((item) => item.name),
    [districtBaseRecords, districtData.rankings, districtMeta?.popularLocations],
  )

  const citySummary = useMemo(
    () => (isRealMode ? manifest.citySummary : summarizeCity(realOverviews)),
    [isRealMode, manifest.citySummary, realOverviews],
  )

  const cityTrend = useMemo(
    () => (isRealMode ? manifest.cityTrendByTab?.[activeTab] || [] : cityTrendByTab[activeTab]),
    [activeTab, isRealMode, manifest.cityTrendByTab],
  )

  const cityVolumeTrend = useMemo(
    () =>
      isRealMode
        ? manifest.cityVolumeTrendByTab?.[activeTab] || []
        : cityTrendByTab[activeTab].map((item) => ({ period: item.period, volume: item.volume })),
    [activeTab, isRealMode, manifest.cityVolumeTrendByTab],
  )

  const districtTrend = useMemo(
    () =>
      districtRecords.length > 0
        ? withMovingAverage(processTrendData(districtRecords, activeTab))
        : districtMeta?.trendByTab?.[activeTab] || districtData.trend[activeTab] || districtData.trend['1y'],
    [activeTab, districtData, districtMeta?.trendByTab, districtRecords],
  )

  const scenarioDistrictTrend = useMemo(
    () =>
      scenarioDistrictRecords.length > 0
        ? withMovingAverage(processTrendData(scenarioDistrictRecords, activeTab))
        : districtMeta?.trendByTab?.[activeTab] || districtData.trend[activeTab] || districtData.trend['1y'],
    [activeTab, districtData, districtMeta?.trendByTab, scenarioDistrictRecords],
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
    () =>
      scenarioDistrictRecords.length > 0
        ? buildRankings(scenarioDistrictRecords)
        : districtMeta?.rankings || districtData.rankings,
    [districtData.rankings, districtMeta?.rankings, scenarioDistrictRecords],
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
    () =>
      scenarioDistrictRecords.length > 0
        ? buildRoomLayout(scenarioDistrictRecords)
        : districtMeta?.roomMix || [
            { name: '2房', value: 45 },
            { name: '3房', value: 33 },
            { name: '1房', value: 12 },
            { name: '4房以上', value: 10 },
          ],
    [districtMeta?.roomMix, scenarioDistrictRecords],
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
    () =>
      scenarioDistrictRecords.length > 0
        ? buildPropertyTypeMix(scenarioDistrictRecords)
        : districtMeta?.typeMix || [
            { name: '中古屋', value: 65 },
            { name: '預售屋', value: 35 },
          ],
    [districtMeta?.typeMix, scenarioDistrictRecords],
  )

  const comparisonData = useMemo(() => {
    if (!isRealMode) return comparisonSeries

    const loadedComparisonMap = new Map()
    comparisonDistricts.forEach((district) => {
      const records = recordsByDistrict.get(district) ?? []
      const filtered = records.filter(
        (record) =>
          propertyTypeFilter.includes(record.type) &&
          checkBuildingMatch(record, buildingFilter) &&
          (totalPriceRange.min === '' || record.totalPrice / 10000 >= Number(totalPriceRange.min)) &&
          (totalPriceRange.max === '' || record.totalPrice / 10000 <= Number(totalPriceRange.max)) &&
          (totalPingRange.min === '' || record.totalPing >= Number(totalPingRange.min)) &&
          (totalPingRange.max === '' || record.totalPing <= Number(totalPingRange.max)),
      )
      if (filtered.length > 0) loadedComparisonMap.set(district, filtered)
    })

    if (loadedComparisonMap.size === comparisonDistricts.length) {
      return buildComparisonSeries(loadedComparisonMap, comparisonDistricts, activeTab)
    }

    return manifest.comparisonSeriesByTab?.[activeTab] || []
  }, [
    activeTab,
    buildingFilter,
    comparisonDistricts,
    isRealMode,
    manifest.comparisonSeriesByTab,
    propertyTypeFilter,
    recordsByDistrict,
    totalPingRange,
    totalPriceRange,
  ])

  const scenarioDistrictOverview = useMemo(
    () =>
      scenarioDistrictRecords.length > 0
        ? summarizeDistrictRecords(scenarioDistrictRecords)
        : selectedDistrictOverview,
    [scenarioDistrictRecords, selectedDistrictOverview],
  )

  const scenarioResidentialRecords = useMemo(() => {
    const filtered = scenarioDistrictRecords.filter(
      (record) => !(record.buildType || '').match(/店面|店鋪|商辦|辦公商業大樓|廠辦|透天/),
    )
    return filtered.length > 0 ? filtered : scenarioDistrictRecords
  }, [scenarioDistrictRecords])

  const districtTotalPriceBand = useMemo(
    () => buildTotalPriceBand(scenarioResidentialRecords),
    [scenarioResidentialRecords],
  )

  const valueProjects = useMemo(
    () => buildValueProjects(scenarioDistrictRecords, scenarioDistrictOverview?.price || 0),
    [scenarioDistrictOverview?.price, scenarioDistrictRecords],
  )

  const minPrice = Math.min(...realOverviews.map((item) => item.price))
  const maxPrice = Math.max(...realOverviews.map((item) => item.price))

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

  return {
    activeTab,
    setActiveTab,
    selectedDistrict,
    setSelectedDistrict,
    selectedLocation,
    setSelectedLocation,
    buyerScenario,
    setBuyerScenario,
    propertyTypeFilter,
    buildingFilter,
    togglePropertyType,
    toggleBuildingType,
    totalPriceRange,
    setTotalPriceRange,
    totalPingRange,
    setTotalPingRange,
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
    realOverviews,
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
    valueProjects,
    minPrice,
    maxPrice,
    getProjectDetail,
  }
}
