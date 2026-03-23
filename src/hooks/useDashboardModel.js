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
  buildDistrictOverviews,
  buildInsights,
  buildPopularLocations,
  buildProjectDetail,
  buildPropertyTypeMix,
  buildRankings,
  buildRoomLayout,
  buildVolumeSeries,
  groupRecordsByDistrict,
  processTrendData,
  summarizeCity,
  withMovingAverage,
  checkBuildingMatch,
} from '../utils/dashboard.js'
import { useHousingData } from './useHousingData.js'

export function useDashboardModel() {
  const [activeTab, setActiveTab] = useState('1y')
  const [selectedDistrict, setSelectedDistrict] = useState('東區')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState(['existing', 'presale'])
  const [buildingFilter, setBuildingFilter] = useState(['elevator', 'apartment', 'house', 'store'])
  const {
    isProcessing,
    recordsByDistrict,
    uploadStats,
    latestDataDate,
    isRealMode,
    importMessage,
    importError,
    loadFiles,
  } = useHousingData()

  const allRecords = useMemo(
    () => (isRealMode ? Array.from(recordsByDistrict.values()).flat() : []),
    [isRealMode, recordsByDistrict],
  )

  const filteredAllRecords = useMemo(
    () =>
      isRealMode
        ? allRecords.filter(
            (record) =>
              propertyTypeFilter.includes(record.type) && checkBuildingMatch(record, buildingFilter),
          )
        : [],
    [allRecords, buildingFilter, isRealMode, propertyTypeFilter],
  )

  const filteredRecordsByDistrict = useMemo(
    () => (isRealMode ? groupRecordsByDistrict(filteredAllRecords) : new Map()),
    [filteredAllRecords, isRealMode],
  )

  const realOverviews = useMemo(
    () => (isRealMode ? buildDistrictOverviews(filteredRecordsByDistrict) : districtOverviews),
    [filteredRecordsByDistrict, isRealMode],
  )

  const availableDistricts = useMemo(
    () => (isRealMode ? realOverviews.map((item) => item.name) : Object.keys(districtTrendMap)),
    [isRealMode, realOverviews],
  )

  const districtData = districtTrendMap[selectedDistrict] ?? districtTrendMap.東區

  const districtBaseRecords = useMemo(
    () => (isRealMode ? filteredRecordsByDistrict.get(selectedDistrict) ?? [] : []),
    [filteredRecordsByDistrict, isRealMode, selectedDistrict],
  )

  const popularLocations = useMemo(
    () =>
      isRealMode
        ? buildPopularLocations(districtBaseRecords)
        : (districtData.rankings || []).map((item) => item.name),
    [districtBaseRecords, districtData.rankings, isRealMode],
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

  const citySummary = useMemo(() => summarizeCity(realOverviews), [realOverviews])

  const cityTrend = useMemo(
    () =>
      withMovingAverage(
        isRealMode ? processTrendData(filteredAllRecords, activeTab) : cityTrendByTab[activeTab],
      ),
    [activeTab, filteredAllRecords, isRealMode],
  )

  const cityVolumeTrend = useMemo(
    () =>
      isRealMode
        ? buildVolumeSeries(filteredAllRecords, activeTab)
        : cityTrendByTab[activeTab].map((item) => ({ period: item.period, volume: item.volume })),
    [activeTab, filteredAllRecords, isRealMode],
  )

  const districtTrend = useMemo(
    () =>
      withMovingAverage(
        isRealMode
          ? processTrendData(districtRecords, activeTab)
          : districtData.trend[activeTab] ?? districtData.trend['1y'],
      ),
    [activeTab, districtData, districtRecords, isRealMode],
  )

  const ageDistribution = useMemo(
    () => (isRealMode ? buildAgeDistribution(districtRecords) : districtData.ageDistribution),
    [districtData.ageDistribution, districtRecords, isRealMode],
  )

  const rankings = useMemo(
    () => (isRealMode ? buildRankings(districtBaseRecords) : districtData.rankings),
    [districtBaseRecords, districtData.rankings, isRealMode],
  )

  const insights = useMemo(
    () => (isRealMode ? buildInsights(districtRecords) : districtData.aiReport),
    [districtData.aiReport, districtRecords, isRealMode],
  )

  const roomMix = useMemo(
    () =>
      isRealMode
        ? buildRoomLayout(districtRecords)
        : [
            { name: '2房', value: 45 },
            { name: '3房', value: 33 },
            { name: '1房', value: 12 },
            { name: '4房以上', value: 10 },
          ],
    [districtRecords, isRealMode],
  )

  const typeMix = useMemo(
    () =>
      isRealMode
        ? buildPropertyTypeMix(districtRecords)
        : [
            { name: '已經蓋好的房子', value: 65 },
            { name: '預售屋', value: 35 },
          ],
    [districtRecords, isRealMode],
  )

  const comparisonData = useMemo(
    () =>
      isRealMode
        ? buildComparisonSeries(filteredRecordsByDistrict, availableDistricts.slice(0, 4), activeTab)
        : comparisonSeries,
    [activeTab, availableDistricts, filteredRecordsByDistrict, isRealMode],
  )

  const selectedDistrictOverview = useMemo(
    () => realOverviews.find((item) => item.name === selectedDistrict) ?? null,
    [realOverviews, selectedDistrict],
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
    if (isRealMode) return buildProjectDetail(projectName, districtBaseRecords)

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
    propertyTypeFilter,
    buildingFilter,
    togglePropertyType,
    toggleBuildingType,
    isProcessing,
    uploadStats,
    latestDataDate,
    isRealMode,
    importMessage,
    importError,
    loadFiles,
    availableDistricts,
    citySummary,
    cityTrend,
    cityVolumeTrend,
    comparisonData,
    realOverviews,
    districtRecords,
    districtBaseRecords,
    districtTrend,
    ageDistribution,
    rankings,
    insights,
    roomMix,
    typeMix,
    popularLocations,
    selectedDistrictOverview,
    minPrice,
    maxPrice,
    getProjectDetail,
  }
}
