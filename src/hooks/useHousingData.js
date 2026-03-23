import { useCallback, useEffect, useMemo, useState } from 'react'
import { runCSVWorker } from '../utils/csvParser.js'

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
  const [uploadStats, setUploadStats] = useState({
    totalRaw: 0,
    totalExcluded: 0,
    duplicateCount: 0,
  })

  const loadFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return
    setIsProcessing(true)

    try {
      const nextRecords = []
      const existingKeys = rawTransactions.map((record) => record.key)
      let totalRaw = uploadStats.totalRaw
      let totalExcluded = uploadStats.totalExcluded
      let duplicateCount = uploadStats.duplicateCount

      for (const file of files) {
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
      }

      if (nextRecords.length > 0) {
        setRawTransactions((previous) => [...previous, ...nextRecords])
        setUploadStats({ totalRaw, totalExcluded, duplicateCount })
      }
    } finally {
      setIsProcessing(false)
    }
  }, [rawTransactions, uploadStats])

  useEffect(() => {
    let cancelled = false

    async function autoLoad() {
      if (typeof window === 'undefined') return
      if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') return

      setIsProcessing(true)

      try {
        const allRecords = []
        const existingKeys = []
        let totalRaw = 0
        let totalExcluded = 0
        let duplicateCount = 0
        let loadedAny = false

        for (const file of AUTOLOAD_FILES) {
          const response = await fetch(file.path)
          if (!response.ok) continue
          loadedAny = true
          const text = await response.text()
          const parsed = await runCSVWorker(text, file.type, existingKeys)
          allRecords.push(...parsed.records)
          parsed.records.forEach((record) => existingKeys.push(record.key))
          totalRaw += parsed.totalProcessedRows
          totalExcluded += parsed.filterCount
          duplicateCount += parsed.duplicateCount
        }

        if (!cancelled && loadedAny) {
          setRawTransactions(allRecords)
          setUploadStats({ totalRaw, totalExcluded, duplicateCount })
        }
      } catch {
        // Keep mock mode when no local CSVs are present.
      } finally {
        if (!cancelled) setIsProcessing(false)
      }
    }

    autoLoad()
    return () => {
      cancelled = true
    }
  }, [])

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
    loadFiles,
  }
}
