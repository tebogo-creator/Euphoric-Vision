import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useProject } from './ProjectContext'
import { checkFile, isSmall, readDimensions } from '../lib/imageCheck'
import { clearPhotos, deletePhoto, listPhotoIds, loadPhoto, savePhoto } from '../lib/photoStore'

/**
 * Holds each room's photo while the app is open, so moving between sections
 * never loses it. If "Remember photos on this device" is on, a copy is also
 * kept in this browser (IndexedDB) so it survives a refresh.
 */
export type PhotoStatus = 'none' | 'loading' | 'ready' | 'missing'

interface Loaded { url: string; blob: Blob }

export interface UploadOutcome {
  ok: boolean
  message: string
  warning?: string
}

interface Ctx {
  status: (roomId: string) => PhotoStatus
  url: (roomId: string) => string | null
  /** The original photo file, for sending to the AI service. */
  blob: (roomId: string) => Blob | null
  upload: (roomId: string, file: File) => Promise<UploadOutcome>
  remove: (roomId: string) => Promise<void>
  setRemember: (remember: boolean) => Promise<void>
  storageWorks: boolean
}

const PhotoCtx = createContext<Ctx | null>(null)

export function PhotoProvider({ children }: { children: ReactNode }) {
  const { project, dispatch } = useProject()
  const [photos, setPhotos] = useState<Record<string, Loaded>>({})
  const [restoring, setRestoring] = useState<Record<string, boolean>>({})
  const [storageWorks, setStorageWorks] = useState(true)
  const photosRef = useRef(photos)
  photosRef.current = photos
  const restoredOnce = useRef(false)

  // On first open, bring back photos kept on this device.
  useEffect(() => {
    if (restoredOnce.current) return
    restoredOnce.current = true
    const wanted = project.rooms.filter((r) => r.photo?.remembered)
    if (!wanted.length) return
    setRestoring(Object.fromEntries(wanted.map((r) => [r.id, true])))
    Promise.all(wanted.map(async (r) => [r.id, await loadPhoto(r.id)] as const)).then((pairs) => {
      const found: Record<string, Loaded> = {}
      for (const [id, blob] of pairs) if (blob) found[id] = { blob, url: URL.createObjectURL(blob) }
      setPhotos((p) => ({ ...p, ...found }))
      setRestoring({})
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tidy up photos for rooms that no longer exist (room removed or project cleared).
  const roomIds = project.rooms.map((r) => r.id).join('|')
  useEffect(() => {
    const ids = new Set(project.rooms.map((r) => r.id))
    const orphans = Object.keys(photosRef.current).filter((id) => !ids.has(id))
    if (orphans.length) {
      orphans.forEach((id) => URL.revokeObjectURL(photosRef.current[id].url))
      setPhotos((p) => Object.fromEntries(Object.entries(p).filter(([id]) => ids.has(id))))
    }
    if (ids.size === 0) { clearPhotos(); return }
    listPhotoIds().then((stored) => stored.filter((id) => !ids.has(id)).forEach((id) => deletePhoto(id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIds])

  const status = useCallback((roomId: string): PhotoStatus => {
    if (photos[roomId]) return 'ready'
    if (restoring[roomId]) return 'loading'
    const room = project.rooms.find((r) => r.id === roomId)
    return room?.photo ? 'missing' : 'none'
  }, [photos, restoring, project.rooms])

  const url = useCallback((roomId: string) => photos[roomId]?.url ?? null, [photos])
  const blob = useCallback((roomId: string) => photos[roomId]?.blob ?? null, [photos])

  const upload = useCallback(async (roomId: string, file: File): Promise<UploadOutcome> => {
    const check = checkFile(file)
    if (!check.ok) return { ok: false, message: check.message }
    let dims: { width: number; height: number }
    try {
      dims = await readDimensions(file)
    } catch {
      return { ok: false, message: `“${file.name}” couldn’t be opened as a picture. It may be damaged or in an unusual format. Try exporting it again as a JPEG.` }
    }
    let remembered = false
    if (project.rememberPhotos) {
      remembered = await savePhoto(roomId, file)
      setStorageWorks(remembered)
    }
    const old = photosRef.current[roomId]
    if (old) URL.revokeObjectURL(old.url)
    setPhotos((p) => ({ ...p, [roomId]: { blob: file, url: URL.createObjectURL(file) } }))
    dispatch({
      type: 'setPhoto', roomId,
      photo: { name: file.name, type: file.type || 'image/jpeg', size: file.size, ...dims, addedAt: new Date().toISOString(), remembered },
    })
    const warnings: string[] = []
    if (isSmall(dims.width, dims.height)) warnings.push(`This photo is quite small (${dims.width} × ${dims.height} pixels), so redesigns may look soft. A larger original will give better results.`)
    if (project.rememberPhotos && !remembered) warnings.push('This browser wouldn’t let us keep a copy, so the photo will disappear if you refresh the page.')
    return { ok: true, message: 'Photo added.', warning: warnings.join(' ') || undefined }
  }, [dispatch, project.rememberPhotos])

  const remove = useCallback(async (roomId: string) => {
    const old = photosRef.current[roomId]
    if (old) URL.revokeObjectURL(old.url)
    setPhotos((p) => { const n = { ...p }; delete n[roomId]; return n })
    await deletePhoto(roomId)
    dispatch({ type: 'setPhoto', roomId, photo: null })
  }, [dispatch])

  const setRemember = useCallback(async (remember: boolean) => {
    dispatch({ type: 'setRememberPhotos', remember })
    if (!remember) {
      await clearPhotos()
      dispatch({ type: 'markPhotosRemembered', remembered: false })
      return
    }
    const entries = Object.entries(photosRef.current)
    const results = await Promise.all(entries.map(([id, p]) => savePhoto(id, p.blob)))
    const saved = entries.filter((_, i) => results[i]).map(([id]) => id)
    setStorageWorks(saved.length === entries.length)
    if (saved.length) dispatch({ type: 'markPhotosRemembered', remembered: true, roomIds: saved })
  }, [dispatch])

  const value = useMemo(() => ({ status, url, blob, upload, remove, setRemember, storageWorks }), [status, url, blob, upload, remove, setRemember, storageWorks])
  return <PhotoCtx.Provider value={value}>{children}</PhotoCtx.Provider>
}

export function usePhotos(): Ctx {
  const ctx = useContext(PhotoCtx)
  if (!ctx) throw new Error('usePhotos must be used inside PhotoProvider')
  return ctx
}
