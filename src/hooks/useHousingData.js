import { useCallback, useEffect, useMemo, useState } from 'react'
import { runCSVWorker } from '../utils/csvParser.js'
import { clearStoredDataset, loadStoredDataset, saveStoredDataset } from '../utils/importStore.js'

const AUTOLOAD_FILES = [
  { path: './data_existing.csv', type: 'existing' },
  { path: './data_presale.csv', type: 'presale' },
]

function groupByDistrict(records) {
  const map = new Map()
  records.forEach((record) => {
    if (!map.has(record.district)) map.set(record.district, [])
    map.get(record.district).push(record)
  })
  return map
}

export function useHousingData() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [rawTransactions, setRawTransactions] = useState([])
  const [importMessage, setImportMessage] = useState('')
  const [importError, setImportError] = useState('')
  const [persistedAt, setPersistedAt] = useState('')
  const [uploadStats, setUploadStats] = useState({
    totalRaw: 0,
    totalExcluded: 0,
    duplicateCount: 0,
  })

  const applyDataset = useCallback((records, stats) => {
    setRawTransactions(records)
    setUploadStats(stats)
  }, [])

  const persistDataset = useCallback(async (records, stats) => {
    const saved = await saveStoredDataset({ records, uploadStats: stats })
    if (saved?.savedAt) setPersistedAt(saved.savedAt)
  }, [])

  const ingestFiles = useCallback(async (files, existingRecords, currentStats) => {
    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))
    const nextRecords = []
    const existingKeys = existingRecords.map((record) => record.key)
    let totalRaw = currentStats.totalRaw
    let totalExcluded = currentStats.totalExcluded
    let duplicateCount = currentStats.duplicateCount
    let currentRaw = 0
    let currentExcluded = 0
    let currentDuplicate = 0

    for (const file of sortedFiles) {
      const text = 'text' in file ? await file.text() : ''
      const lowerName = file.name.toLowerCase()
      const propertyType =
        lowerName.includes('presale') || lowerName.includes('_b') ? 'presale' : 'existing'

      const parsed = await runCSVWorker(text, propertyType, existingKeys)
      nextRecords.push(...parsed.records)
      parsed.records.forEach((record) => existingKeys.push(record.key))
      totalRaw += parsed.totalProcessedRows
      totalExcluded += parsed.filterCount
      duplicateCount += parsed.duplicateCount
      currentRaw += parsed.totalProcessedRows
      currentExcluded += parsed.filterCount
      currentDuplicate += parsed.duplicateCount
    }

    return {
      mergedRecords: [...existingRecords, ...nextRecords],
      stats: { totalRaw, totalExcluded, duplicateCount },
      fileCount: sortedFiles.length,
      currentRaw,
      currentExcluded,
      currentDuplicate,
      nextRecordsCount: nextRecords.length,
    }
  }, [])

  const loadFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return
    setIsProcessing(true)
    setImportError('')
    setImportMessage(`正在整理 ${files.length} 個檔案，檔案很多時請稍等一下。`)

    try {
      const result = await ingestFiles(files, rawTransactions, uploadStats)
      applyDataset(result.mergedRecords, result.stats)
      await persistDataset(result.mergedRecords, result.stats)

      if (result.nextRecordsCount > 0) {
        setImportMessage(
          `已累積匯入 ${result.fileCount} 個檔案，新增 ${result.nextRecordsCount.toLocaleString()} 筆有效資料。處理 ${result.currentRaw.toLocaleString()} 筆，排除 ${result.currentExcluded.toLocaleString()} 筆，重複 ${result.currentDuplicate.toLocaleString()} 筆。資料已存到這台電腦，下次打開會自動接續。`,
        )
      } else {
        setImportMessage(
          `已讀取 ${result.fileCount} 個檔案，但沒有新增有效資料。共處理 ${result.currentRaw.toLocaleString()} 筆，排除 ${result.currentExcluded.toLocaleString()} 筆，重複 ${result.currentDuplicate.toLocaleString()} 筆。`,
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV 解析失敗'
      setImportError(`匯入失敗：${message}`)
    } finally {
      setIsProcessing(false)
    }
  }, [applyDataset, ingestFiles, persistDataset, rawTransactions, uploadStats])

  const clearImportedData = useCallback(async () => {
    setIsProcessing(true)
    setImportError('')

    try {
      await clearStoredDataset()
      applyDataset([], { totalRaw: 0, totalExcluded: 0, duplicateCount: 0 })
      setPersistedAt('')
      setImportMessage('已清除這台電腦累積的匯入資料。')
    } catch (error) {
      const message = error instanceof Error ? error.message : '清除資料失敗'
      setImportError(`清除失敗：${message}`)
    } finally {
      setIsProcessing(false)
    }
  }, [applyDataset])

  useEffect(() => {
    let cancelled = false

    async function hydrateData() {
      if (typeof window === 'undefined') return
      if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') return

      setIsProcessing(true)

      try {
        let baseRecords = []
        let baseStats = { totalRaw: 0, totalExcluded: 0, duplicateCount: 0 }

        const storedDataset = await loadStoredDataset()
        if (!cancelled && storedDataset?.records?.length) {
          baseRecords = storedDataset.records
          baseStats = storedDataset.uploadStats || baseStats
          applyDataset(baseRecords, baseStats)
          setPersistedAt(storedDataset.savedAt || '')
          setImportMessage(`已讀取這台電腦累積的資料，共 ${storedDataset.records.length.toLocaleString()} 筆有效資料。`)
        }

        let loadedAny = false
        const autoLoadFiles = []

        for (const file of AUTOLOAD_FILES) {
          const response = await fetch(file.path)
          if (!response.ok) continue
          loadedAny = true
          const text = await response.text()
          autoLoadFiles.push(
            new File([text], file.path.split('/').pop() || `${file.type}.csv`, {
              type: 'text/csv',
            }),
          )
        }

        if (!cancelled && loadedAny) {
          const result = await ingestFiles(autoLoadFiles, baseRecords, baseStats)
          applyDataset(result.mergedRecords, result.stats)
          await persistDataset(result.mergedRecords, result.stats)
          if (result.mergedRecords.length > 0 && !storedDataset?.records?.length) {
            setImportMessage(`已自動載入本地資料檔，共 ${result.mergedRecords.length.toLocaleString()} 筆有效資料。`)
          }
        }
      } catch {
        // Keep mock mode when no local CSVs are present.
      } finally {
        if (!cancelled) setIsProcessing(false)
      }
    }

    hydrateData()
    return () => {
      cancelled = true
    }
  }, [applyDataset, ingestFiles, persistDataset])

  const recordsByDistrict = useMemo(() => groupByDistrict(rawTransactions), [rawTransactions])

  const latestDataDate = useMemo(() => {
    if (rawTransactions.length === 0) return null
    let maxYear = 0
    let maxMonth = 0

    rawTransactions.forEach((record) => {
      if (record.year > maxYear || (record.year === maxYear && record.month > maxMonth)) {
        maxYear = record.year
        maxMonth = record.month
      }
    })

    return `${maxYear} 年 ${maxMonth} 月`
  }, [rawTransactions])

  return {
    isProcessing,
    rawTransactions,
    recordsByDistrict,
    uploadStats,
    latestDataDate,
    isRealMode: rawTransactions.length > 0,
    importMessage,
    importError,
    persistedAt,
    loadFiles,
    clearImportedData,
  }
}
