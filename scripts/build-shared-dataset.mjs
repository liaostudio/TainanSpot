import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCSVText } from '../src/utils/csvParser.js'
import {
  buildAgeDistribution,
  buildComparisonSeries,
  buildDistrictOverviews,
  buildInsights,
  buildPopularLocations,
  buildPropertyTypeMix,
  buildRankings,
  buildRoomLayout,
  buildVolumeSeries,
  groupRecordsByDistrict,
  processTrendData,
  summarizeCity,
  withMovingAverage,
} from '../src/utils/dashboard.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const rawDataDir = path.join(projectRoot, 'data', 'raw')
const outputDir = path.join(projectRoot, 'public', 'data')
const districtsOutputDir = path.join(outputDir, 'districts')
const manifestFile = path.join(outputDir, 'manifest.json')

const TIME_TABS = ['1y', '3y', '5y', '10y']

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function walkCsvFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => [])
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkCsvFiles(fullPath)))
      continue
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.csv')) {
      files.push(fullPath)
    }
  }

  return files
}

function inferPropertyType(fileName) {
  const lowerName = fileName.toLowerCase()
  return lowerName.includes('presale') || lowerName.includes('_b') ? 'presale' : 'existing'
}

function buildStats(importedFiles) {
  return {
    totalRaw: importedFiles.reduce((sum, file) => sum + (file.totalProcessedRows || 0), 0),
    totalExcluded: importedFiles.reduce((sum, file) => sum + (file.excludedCount || 0), 0),
    duplicateCount: importedFiles.reduce((sum, file) => sum + (file.duplicateCount || 0), 0),
  }
}

function latestDataLabel(records) {
  let maxYear = 0
  let maxMonth = 0
  for (const record of records) {
    if (record.year > maxYear || (record.year === maxYear && record.month > maxMonth)) {
      maxYear = record.year
      maxMonth = record.month
    }
  }
  return maxYear ? `${maxYear} 年 ${maxMonth} 月` : null
}

function districtFileName(district) {
  return `${encodeURIComponent(district)}.json`
}

function slimRecord(record) {
  return {
    key: record.key,
    district: record.district,
    year: record.year,
    quarter: record.quarter,
    month: record.month,
    tradeTarget: record.tradeTarget,
    unitPricePing: record.unitPricePing,
    type: record.type,
    buildType: record.buildType,
    locationName: record.locationName,
    projectName: record.projectName,
    age: record.age,
    roomCount: record.roomCount,
    totalPing: record.totalPing,
    address: record.address,
    level: record.level,
    landPing: record.landPing,
    totalPrice: record.totalPrice,
    note: record.note,
    isSpecialSample: record.isSpecialSample,
    specialReason: record.specialReason,
    hasPark: record.hasPark,
    parkAreaPing: record.parkAreaPing,
    parkPrice: record.parkPrice,
    floorNum: record.floorNum,
  }
}

async function main() {
  await ensureDir(outputDir)
  await ensureDir(districtsOutputDir)

  const csvFiles = (await walkCsvFiles(rawDataDir)).sort((a, b) =>
    path.basename(a).localeCompare(path.basename(b), 'zh-Hant'),
  )

  const records = []
  const importedFiles = []
  const existingKeys = new Set()
  const importedAt = new Date().toISOString()

  for (const filePath of csvFiles) {
    const fileName = path.relative(rawDataDir, filePath).replaceAll(path.sep, '/')
    const propertyType = inferPropertyType(fileName)
    const text = await fs.readFile(filePath, 'utf8')
    const parsed = parseCSVText(text, propertyType, Array.from(existingKeys))

    parsed.records.forEach((record) => {
      existingKeys.add(record.key)
      records.push({
        ...record,
        sourceFileName: fileName,
      })
    })

    importedFiles.push({
      name: fileName,
      propertyType,
      importedAt,
      totalProcessedRows: parsed.totalProcessedRows,
      validRecords: parsed.records.length,
      duplicateCount: parsed.duplicateCount,
      excludedCount: parsed.filterCount,
    })
  }

  const recordsByDistrict = groupRecordsByDistrict(records)
  const realOverviews = buildDistrictOverviews(recordsByDistrict)
  const citySummary = summarizeCity(realOverviews)
  const cityTrendByTab = Object.fromEntries(
    TIME_TABS.map((tab) => [tab, withMovingAverage(processTrendData(records, tab))]),
  )
  const cityVolumeTrendByTab = Object.fromEntries(
    TIME_TABS.map((tab) => [tab, buildVolumeSeries(records, tab)]),
  )
  const comparisonSeriesByTab = Object.fromEntries(
    TIME_TABS.map((tab) => [
      tab,
      buildComparisonSeries(
        recordsByDistrict,
        realOverviews.map((item) => item.name).slice(0, 4),
        tab,
      ),
    ]),
  )

  const districtMetaByName = {}

  for (const [district, districtRecords] of recordsByDistrict.entries()) {
    const districtOverview = realOverviews.find((item) => item.name === district) || null
    const trends = Object.fromEntries(
      TIME_TABS.map((tab) => [tab, withMovingAverage(processTrendData(districtRecords, tab))]),
    )
    districtMetaByName[district] = {
      overview: districtOverview,
      trendByTab: trends,
      ageDistribution: buildAgeDistribution(districtRecords),
      rankings: buildRankings(districtRecords),
      aiReport: buildInsights(districtRecords),
      roomMix: buildRoomLayout(districtRecords),
      typeMix: buildPropertyTypeMix(districtRecords),
      popularLocations: buildPopularLocations(districtRecords),
      recordCount: districtRecords.length,
      fileName: districtFileName(district),
    }

    await fs.writeFile(
      path.join(districtsOutputDir, districtFileName(district)),
      JSON.stringify({
        district,
        savedAt: importedAt,
        records: districtRecords.map(slimRecord),
      }),
      'utf8',
    )
  }

  const manifest = {
    savedAt: importedAt,
    latestDataDate: latestDataLabel(records),
    uploadStats: buildStats(importedFiles),
    importedFiles,
    citySummary,
    realOverviews,
    cityTrendByTab,
    cityVolumeTrendByTab,
    comparisonSeriesByTab,
    districtMetaByName,
  }

  await fs.writeFile(manifestFile, JSON.stringify(manifest), 'utf8')

  console.log(
    `Built manifest with ${records.length} records from ${importedFiles.length} CSV files -> ${path.relative(projectRoot, manifestFile)}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
