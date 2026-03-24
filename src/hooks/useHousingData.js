import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MANIFEST_PATH = './data/manifest.json'
const DISTRICT_PATH = './data/districts'
const INITIAL_DISTRICTS = ['東區', '永康區', '善化區', '安平區']

function buildEmptyManifest() {
  return {
    savedAt: '',
    latestDataDate: null,
    uploadStats: { totalRaw: 0, totalExcluded: 0, duplicateCount: 0 },
    importedFiles: [],
    citySummary: {
      price: 0,
      yoy: 0,
      volume: 0,
      hottest: { name: '-' },
      mostAffordable: { name: '-' },
    },
    realOverviews: [],
    cityTrendByTab: { '1y': [], '3y': [], '5y': [], '10y': [] },
    cityVolumeTrendByTab: { '1y': [], '3y': [], '5y': [], '10y': [] },
    comparisonSeriesByTab: { '1y': [], '3y': [], '5y': [], '10y': [] },
    districtMetaByName: {},
  }
}

export function useHousingData() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [manifest, setManifest] = useState(buildEmptyManifest())
  const [districtRecordsMap, setDistrictRecordsMap] = useState(new Map())
  const [importMessage, setImportMessage] = useState('')
  const [importError, setImportError] = useState('')
  const loadingDistrictsRef = useRef(new Set())

  const loadDistrictRecords = useCallback(async (district, fileNameOverride = null) => {
    if (!district) return []
    if (districtRecordsMap.has(district)) return districtRecordsMap.get(district) || []
    if (loadingDistrictsRef.current.has(district)) return []

    const fileName =
      fileNameOverride || manifest.districtMetaByName?.[district]?.fileName || `${encodeURIComponent(district)}.json`

    loadingDistrictsRef.current.add(district)

    try {
      const response = await fetch(`${DISTRICT_PATH}/${fileName}`, { cache: 'force-cache' })
      if (!response.ok) throw new Error(`找不到 ${district} 的明細資料`)
      const payload = await response.json()
      const records = payload.records || []
      setDistrictRecordsMap((previous) => {
        const next = new Map(previous)
        next.set(district, records)
        return next
      })
      return records
    } finally {
      loadingDistrictsRef.current.delete(district)
    }
  }, [districtRecordsMap, manifest.districtMetaByName])

  useEffect(() => {
    let cancelled = false

    async function hydrateData() {
      if (typeof window === 'undefined') return

      setIsProcessing(true)
      setImportError('')

      try {
        const response = await fetch(MANIFEST_PATH, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('找不到 manifest.json，請先執行資料整理流程。')
        }

        const nextManifest = await response.json()
        if (cancelled) return

        setManifest(nextManifest)

        const initialDistricts = INITIAL_DISTRICTS.filter((district) => nextManifest.districtMetaByName?.[district])
        await Promise.all(initialDistricts.map((district) => loadDistrictRecords(district, nextManifest.districtMetaByName[district]?.fileName)))

        if (cancelled) return

        if ((nextManifest.realOverviews || []).length > 0) {
          setImportMessage(
            `目前顯示 GitHub 共用資料，已整理 ${(nextManifest.importedFiles || []).length} 期 CSV，最新資料到 ${nextManifest.latestDataDate || '-' }。`,
          )
        } else {
          setImportMessage('目前 GitHub 共用資料檔是空的，請先把 CSV 放進 data/raw 後重新建置。')
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : '讀取共用資料失敗'
          setImportError(`讀取失敗：${message}`)
          setImportMessage('目前還沒有共用資料檔，網站先顯示靜態展示畫面。')
        }
      } finally {
        if (!cancelled) setIsProcessing(false)
      }
    }

    hydrateData()
    return () => {
      cancelled = true
    }
  }, [loadDistrictRecords])

  const recordsByDistrict = useMemo(() => districtRecordsMap, [districtRecordsMap])

  return {
    isProcessing,
    manifest,
    rawTransactions: [],
    importedFiles: manifest.importedFiles || [],
    recordsByDistrict,
    uploadStats: manifest.uploadStats || { totalRaw: 0, totalExcluded: 0, duplicateCount: 0 },
    latestDataDate: manifest.latestDataDate,
    isRealMode: (manifest.realOverviews || []).length > 0,
    importMessage,
    importError,
    persistedAt: manifest.savedAt || '',
    storageMode: 'github-manifest',
    isSharedMode: true,
    ensureDistrictLoaded: loadDistrictRecords,
    loadFiles: () => {},
    clearImportedData: () => {},
    removeImportedFile: () => {},
  }
}
