/**
 * Keeps photos and AI redesigns on THIS device only, using the browser's
 * IndexedDB (a private, built-in store for files).
 * Originals and redesigns live in separate stores, so a redesign can never
 * overwrite an original photo.
 * Every function fails quietly and reports false/null, because some browsers
 * (private windows, strict settings) block storage.
 */
const DB_NAME = 'euphoric-vision'
const PHOTOS = 'photos'
const RESULTS = 'results'
type StoreName = typeof PHOTOS | typeof RESULTS

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'))
    const req = indexedDB.open(DB_NAME, 2)
    req.onupgradeneeded = () => {
      for (const s of [PHOTOS, RESULTS]) if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode)
      const req = fn(tx.objectStore(store))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

const put = async (store: StoreName, id: string, blob: Blob) => { try { await run(store, 'readwrite', (s) => s.put(blob, id)); return true } catch { return false } }
const get = async (store: StoreName, id: string) => { try { const v = await run<unknown>(store, 'readonly', (s) => s.get(id)); return v instanceof Blob ? v : null } catch { return null } }
const del = async (store: StoreName, id: string) => { try { await run(store, 'readwrite', (s) => s.delete(id)) } catch { /* nothing to delete */ } }
const keys = async (store: StoreName) => { try { return (await run<IDBValidKey[]>(store, 'readonly', (s) => s.getAllKeys())).map(String) } catch { return [] } }
const clear = async (store: StoreName) => { try { await run(store, 'readwrite', (s) => s.clear()) } catch { /* nothing to clear */ } }

export const savePhoto = (roomId: string, blob: Blob) => put(PHOTOS, roomId, blob)
export const loadPhoto = (roomId: string) => get(PHOTOS, roomId)
export const deletePhoto = (roomId: string) => del(PHOTOS, roomId)
export const listPhotoIds = () => keys(PHOTOS)
export const clearPhotos = () => clear(PHOTOS)

export const saveResult = (resultId: string, blob: Blob) => put(RESULTS, resultId, blob)
export const loadResult = (resultId: string) => get(RESULTS, resultId)
export const deleteResult = (resultId: string) => del(RESULTS, resultId)
export const listResultIds = () => keys(RESULTS)
export const clearResults = () => clear(RESULTS)
