const DB_NAME = 'tainanspot-imports'
const DB_VERSION = 1
const STORE_NAME = 'datasets'
const DATASET_KEY = 'housing-data-v1'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('無法開啟本地資料庫'))
  })
}

function withStore(mode, callback) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode)
        const store = transaction.objectStore(STORE_NAME)
        const request = callback(store)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error || new Error('本地資料庫操作失敗'))
        transaction.oncomplete = () => database.close()
        transaction.onerror = () => reject(transaction.error || new Error('本地資料庫交易失敗'))
      }),
  )
}

export function loadStoredDataset() {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null)
  return withStore('readonly', (store) => store.get(DATASET_KEY)).catch(() => null)
}

export function saveStoredDataset(dataset) {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve()
  const payload = {
    ...dataset,
    savedAt: new Date().toISOString(),
  }
  return withStore('readwrite', (store) => store.put(payload, DATASET_KEY)).then(() => payload)
}

export function clearStoredDataset() {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve()
  return withStore('readwrite', (store) => store.delete(DATASET_KEY))
}
