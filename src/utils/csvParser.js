function parseFloor(levelStr) {
  if (!levelStr) return -999
  let clean = levelStr.replace('層', '')
  let isBasement = false

  if (clean.includes('地下')) {
    isBasement = true
    clean = clean.replace('地下', '')
  }

  const numMap = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
    十一: 11,
    十二: 12,
    十三: 13,
    十四: 14,
    十五: 15,
    十六: 16,
    十七: 17,
    十八: 18,
    十九: 19,
    二十: 20,
    二十一: 21,
    二十二: 22,
    二十三: 23,
    二十四: 24,
    二十五: 25,
    二十六: 26,
    二十七: 27,
    二十八: 28,
    二十九: 29,
    三十: 30,
    三十一: 31,
    三十二: 32,
    三十三: 33,
    三十四: 34,
    三十五: 35,
    三十六: 36,
    三十七: 37,
    三十八: 38,
    三十九: 39,
    四十: 40,
  }

  let num = numMap[clean]
  if (num === undefined) num = Number.parseInt(clean, 10)
  if (Number.isNaN(num)) return -999
  return isBasement ? -num : num
}

function findIndex(cleanHeaders, exactMatches, partialMatches = []) {
  let idx = cleanHeaders.findIndex((header) => exactMatches.includes(header))
  if (idx !== -1) return idx
  return cleanHeaders.findIndex((header) => partialMatches.some((match) => header.includes(match)))
}

export function parseCSVText(text, filePropertyType, existingKeysArray = []) {
  const existingKeys = new Set(existingKeysArray)
  const records = []
  let duplicateCount = 0
  let filterCount = 0
  let totalProcessedRows = 0

  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  if (lines.length < 2) {
    return { records, duplicateCount, filterCount, totalProcessedRows }
  }

  const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
  const cleanHeaders = headers.map((header) => header.replace(/["'\s]/g, ''))

  const distIdx = findIndex(cleanHeaders, ['鄉鎮市區'], ['鄉鎮市區'])
  const dateIdx = findIndex(cleanHeaders, ['交易年月日'], ['交易年月日'])
  const priceIdx = findIndex(cleanHeaders, ['單價元平方公尺', '單價元(平方公尺)'], ['單價'])
  const typeIdx = findIndex(cleanHeaders, ['交易標的'], ['交易標的'])
  const buildTypeIdx = findIndex(cleanHeaders, ['建物型態'], ['建物型態'])
  const addressIdx = findIndex(cleanHeaders, ['土地位置建物門牌'], ['門牌', '土地位置'])
  const projectIdx = findIndex(cleanHeaders, ['建案名稱'], ['建案名稱'])
  const buildDateIdx = findIndex(cleanHeaders, ['建築完成年月'], ['建築完成年月'])
  const serialIdx = findIndex(cleanHeaders, ['編號'], ['編號'])
  const noteIdx = findIndex(cleanHeaders, ['備註'], ['備註'])
  const levelIdx = findIndex(cleanHeaders, ['移轉層次'], ['移轉層次'])
  const totalPriceIdx = findIndex(cleanHeaders, ['總價元'], ['總價'])
  const parkPriceIdx = findIndex(cleanHeaders, ['車位總價元'], ['車位總價元'])
  const totalAreaIdx = findIndex(
    cleanHeaders,
    ['建物移轉總面積平方公尺', '建物移轉總面積(平方公尺)'],
    ['建物移轉總面積'],
  )
  const parkAreaIdx = findIndex(
    cleanHeaders,
    ['車位移轉總面積平方公尺', '車位移轉總面積(平方公尺)'],
    ['車位移轉總面積'],
  )
  const roomIdx = findIndex(cleanHeaders, ['建物現況格局-房'], ['格局-房'])
  const landAreaIdx = findIndex(
    cleanHeaders,
    ['土地移轉總面積平方公尺', '土地移轉總面積(平方公尺)'],
    ['土地移轉總面積'],
  )

  if (distIdx === -1 || dateIdx === -1) {
    return { records, duplicateCount, filterCount, totalProcessedRows }
  }

  for (let index = 1; index < lines.length; index += 1) {
    if (!lines[index].trim()) continue

    const row = lines[index].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    let district = row[distIdx]?.replace(/['"]/g, '').trim()

    if (!district || district.toLowerCase().includes('district') || /^[A-Za-z\s]+$/.test(district)) {
      continue
    }

    totalProcessedRows += 1

    const dateRaw = row[dateIdx]?.replace(/['"]/g, '')
    const typeRaw = typeIdx !== -1 ? row[typeIdx]?.replace(/['"]/g, '') : ''
    const buildTypeRaw = buildTypeIdx !== -1 ? row[buildTypeIdx]?.replace(/['"]/g, '') : ''
    const addressRaw = addressIdx !== -1 ? row[addressIdx]?.replace(/['"]/g, '') : ''
    const projectRaw = projectIdx !== -1 ? row[projectIdx]?.replace(/['"]/g, '') : ''
    const buildDateRaw = buildDateIdx !== -1 ? row[buildDateIdx]?.replace(/['"]/g, '') : ''
    const serialRaw = serialIdx !== -1 ? row[serialIdx]?.replace(/['"]/g, '') : ''
    const noteRaw = noteIdx !== -1 ? row[noteIdx]?.replace(/['"]/g, '') : ''
    const levelRaw = levelIdx !== -1 ? row[levelIdx]?.replace(/['"]/g, '') : ''

    if (typeRaw && !typeRaw.includes('建物') && !typeRaw.includes('房地') && !typeRaw.includes('土地')) continue

    const isStoreType =
      buildTypeRaw.includes('店面') || buildTypeRaw.includes('店鋪') || buildTypeRaw.includes('商辦')

    const specialMatch = noteRaw.match(/(親友|員工|特殊|毛胚|瑕疵|凶宅|增建|地上權|工業|關係人|協議|塔位)/)

    if (
      !isStoreType &&
      levelRaw &&
      (levelRaw.includes('一層') || levelRaw.includes('一樓') || levelRaw === '1層' || levelRaw === '1樓' || levelRaw.includes('地下'))
    ) {
      filterCount += 1
      continue
    }

    district = district.replace('臺南市', '').replace('台南市', '').trim()

    const recordKey = serialRaw || `${district}-${dateRaw}-${addressRaw}-${projectRaw}`
    if (existingKeys.has(recordKey)) {
      duplicateCount += 1
      continue
    }

    const dateStr = String(dateRaw || '')
    if (dateStr.length < 6) continue

    const txYearRoc = Number.parseInt(dateStr.slice(0, dateStr.length - 4), 10)
    const month = Number.parseInt(dateStr.slice(-4, -2), 10)
    if (Number.isNaN(txYearRoc) || Number.isNaN(month) || month < 1 || month > 12) continue

    const year = txYearRoc + 1911
    const quarter = Math.ceil(month / 3)
    const totalPrice = Number.parseFloat(totalPriceIdx !== -1 ? row[totalPriceIdx]?.replace(/['"]/g, '') : '0') || 0
    const parkPrice = Number.parseFloat(parkPriceIdx !== -1 ? row[parkPriceIdx]?.replace(/['"]/g, '') : '0') || 0
    const totalArea = Number.parseFloat(totalAreaIdx !== -1 ? row[totalAreaIdx]?.replace(/['"]/g, '') : '0') || 0
    const parkArea = Number.parseFloat(parkAreaIdx !== -1 ? row[parkAreaIdx]?.replace(/['"]/g, '') : '0') || 0
    const landArea = Number.parseFloat(landAreaIdx !== -1 ? row[landAreaIdx]?.replace(/['"]/g, '') : '0') || 0
    const priceRaw = priceIdx !== -1 ? row[priceIdx]?.replace(/['"]/g, '') : '0'

    const pureAreaSqm = totalArea - parkArea
    const purePrice = totalPrice - parkPrice
    const purePing = pureAreaSqm > 0 ? pureAreaSqm * 0.3025 : 0
    const landPing = landArea * 0.3025

    if (filePropertyType === 'existing') {
      if (!isStoreType && purePing < 15) {
        filterCount += 1
        continue
      }

      if (buildTypeRaw.includes('透天') && landPing > 0 && purePing > 0) {
        if (purePing > landPing * 7 || landPing > purePing * 7) {
          filterCount += 1
          continue
        }
      }
    }

    let unitPricePing = 0
    if (pureAreaSqm > 0 && purePrice > 0) {
      unitPricePing = purePrice / (pureAreaSqm * 0.3025) / 10000
    } else if (priceRaw && priceRaw !== '0') {
      unitPricePing = (Number.parseFloat(priceRaw) * 3.30579) / 10000
    } else {
      continue
    }

    let age = -1
    if (filePropertyType === 'existing' && buildDateRaw && buildDateRaw.length >= 3) {
      const buildYearRoc = Number.parseInt(buildDateRaw.slice(0, buildDateRaw.length - 4), 10)
      if (!Number.isNaN(buildYearRoc)) {
        age = txYearRoc - buildYearRoc
        if (age < 0) age = 0
      }
    }

    const projectName = projectRaw ? projectRaw.trim() : ''
    const roomRaw = roomIdx !== -1 ? row[roomIdx]?.replace(/['"]/g, '') : '0'
    const roomCount = Number.parseInt(roomRaw, 10) || 0
    const totalPing = totalArea > 0 ? totalArea * 0.3025 : 0
    const floorNum = parseFloor(levelRaw)

    let locationName = ''
    if (projectName) {
      locationName = projectName
    } else if (addressRaw) {
      let cleanAddr = addressRaw.replace(/^(臺南市|台南市)/, '')
      if (district) cleanAddr = cleanAddr.replace(new RegExp(`^${district}`), '')
      if (filePropertyType === 'presale' && cleanAddr.includes('地號')) {
        cleanAddr = cleanAddr.split('地號').pop().trim()
      }
      locationName = cleanAddr.trim() || '其他路段'
    } else {
      locationName = '其他路段'
    }

    const record = {
      key: recordKey,
      district,
      year,
      quarter,
      month,
      tradeTarget: typeRaw,
      unitPricePing: Number(unitPricePing.toFixed(2)),
      type: filePropertyType,
      buildType: buildTypeRaw,
      locationName,
      projectName,
      age,
      roomCount,
      totalPing: Number(totalPing.toFixed(2)),
      address: addressRaw,
      level: levelRaw,
      floorNum,
      totalPrice,
      note: noteRaw,
      isSpecialSample: Boolean(specialMatch),
      specialReason: specialMatch ? specialMatch[0] : '',
      landPing: Number(landPing.toFixed(2)),
      parkAreaPing: Number((parkArea * 0.3025).toFixed(2)),
      hasPark: parkArea > 0 || parkPrice > 0,
      parkPrice,
    }

    records.push(record)
    existingKeys.add(recordKey)
  }

  return { records, duplicateCount, filterCount, totalProcessedRows }
}

export function runCSVWorker(text, filePropertyType, existingKeysArray = []) {
  return Promise.resolve(parseCSVText(text, filePropertyType, existingKeysArray))
}
