import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useProject } from './ProjectContext'
import { usePhotos } from './PhotoContext'
import { makeId, type RedesignResult, type Room } from './project'
import type { LevelId } from '../lib/config'
import { fetchServiceStatus, GenerationError, requestRedesign, type ServiceStatus } from '../lib/generationApi'
import { chooseOutputSize, prepareForUpload } from '../lib/imagePrep'
import { costFromUsage, estimateCostUsd, type Quality } from '../lib/aiPricing'
import { clearResults, deleteResult, listResultIds, loadResult, saveResult } from '../lib/photoStore'

/**
 * AI redesign state: whether the service is connected, the generated images
 * held in memory (and optionally on this device), and running one generation.
 * Generation only ever starts from an explicit owner action.
 */
export interface Job { roomId: string; level: LevelId; startedAt: number }

interface Ctx {
  service: ServiceStatus
  recheck: () => void
  resultUrl: (resultId: string) => string | null
  job: Job | null
  generate: (room: Room, level: LevelId, prompt: string, quality: Quality) => Promise<{ ok: true; result: RedesignResult } | { ok: false; code: string; message: string }>
  cancel: () => void
  removeResult: (roomId: string, resultId: string) => Promise<void>
  accessCode: string
  setAccessCode: (code: string) => void
}

const AiCtx = createContext<Ctx | null>(null)
const CODE_KEY = 'euphoric-vision:access-code'
const readCode = () => { try { return window.localStorage.getItem(CODE_KEY) ?? '' } catch { return '' } }

export function AiProvider({ children }: { children: ReactNode }) {
  const { project, dispatch } = useProject()
  const photos = usePhotos()
  const [service, setService] = useState<ServiceStatus>({ state: 'checking' })
  const [urls, setUrls] = useState<Record<string, { url: string; blob: Blob }>>({})
  const urlsRef = useRef(urls)
  urlsRef.current = urls
  const [job, setJob] = useState<Job | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [accessCode, setCode] = useState(readCode)

  const recheck = useCallback(() => {
    setService({ state: 'checking' })
    fetchServiceStatus().then(setService)
  }, [])
  useEffect(() => { recheck() }, [recheck])

  // Bring back redesigns kept on this device.
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const wanted = project.rooms.flatMap((r) => r.results.filter((x) => x.remembered))
    Promise.all(wanted.map(async (x) => [x.id, await loadResult(x.id)] as const)).then((pairs) => {
      const found: Record<string, { url: string; blob: Blob }> = {}
      for (const [id, b] of pairs) if (b) found[id] = { blob: b, url: URL.createObjectURL(b) }
      setUrls((u) => ({ ...u, ...found }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Remove images for results that no longer exist (deleted, room removed, project cleared).
  const ids = project.rooms.flatMap((r) => r.results.map((x) => x.id)).join('|')
  useEffect(() => {
    const keep = new Set(project.rooms.flatMap((r) => r.results.map((x) => x.id)))
    const orphans = Object.keys(urlsRef.current).filter((id) => !keep.has(id))
    if (orphans.length) {
      orphans.forEach((id) => URL.revokeObjectURL(urlsRef.current[id].url))
      setUrls((u) => Object.fromEntries(Object.entries(u).filter(([id]) => keep.has(id))))
    }
    if (keep.size === 0) { clearResults(); return }
    listResultIds().then((stored) => stored.filter((id) => !keep.has(id)).forEach((id) => deleteResult(id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids])

  // Follow the "Remember photos and redesigns on this device" switch.
  const lastRemember = useRef(project.rememberPhotos)
  useEffect(() => {
    if (lastRemember.current === project.rememberPhotos) return
    lastRemember.current = project.rememberPhotos
    if (!project.rememberPhotos) {
      clearResults().then(() => dispatch({ type: 'markResultsRemembered', remembered: false }))
    } else {
      const entries = Object.entries(urlsRef.current)
      Promise.all(entries.map(([id, v]) => saveResult(id, v.blob))).then((ok) => {
        const saved = entries.filter((_, i) => ok[i]).map(([id]) => id)
        if (saved.length) dispatch({ type: 'markResultsRemembered', remembered: true, resultIds: saved })
      })
    }
  }, [project.rememberPhotos, dispatch])

  const resultUrl = useCallback((id: string) => urls[id]?.url ?? null, [urls])

  const generate = useCallback<Ctx['generate']>(async (room, level, prompt, quality) => {
    if (job) return { ok: false, code: 'busy', message: 'A redesign is already being generated. Please wait for it to finish.' }
    const original = photos.blob(room.id)
    if (!original || !room.photo) return { ok: false, code: 'no_photo', message: `Add a photo of ${room.name} first.` }
    const size = chooseOutputSize(room.photo.width || 4, room.photo.height || 3)
    const controller = new AbortController()
    abortRef.current = controller
    setJob({ roomId: room.id, level, startedAt: Date.now() })
    try {
      const prepared = await prepareForUpload(original)
      const out = await requestRedesign({ photo: prepared, prompt, level, size, quality, accessCode, signal: controller.signal })
      const id = makeId()
      const actual = costFromUsage(out.usage)
      let remembered = false
      if (project.rememberPhotos) remembered = await saveResult(id, out.blob)
      setUrls((u) => ({ ...u, [id]: { blob: out.blob, url: URL.createObjectURL(out.blob) } }))
      const result: RedesignResult = {
        id, level, createdAt: new Date().toISOString(), model: out.model, quality, size: out.size || size,
        promptText: prompt,
        costUsd: actual ?? estimateCostUsd(size, quality),
        costIsEstimate: actual === null,
        remembered,
      }
      dispatch({ type: 'addResult', roomId: room.id, result })
      return { ok: true, result }
    } catch (e) {
      if (e instanceof GenerationError) {
        if (e.code === 'access_code') { setCode(''); try { window.localStorage.removeItem(CODE_KEY) } catch { /* ignore */ } }
        if (e.code === 'not_configured') recheck()
        return { ok: false, code: e.code, message: e.message }
      }
      return { ok: false, code: 'prepare', message: 'Your photo couldn’t be prepared for sending. Try re-adding it.' }
    } finally {
      abortRef.current = null
      setJob(null)
    }
  }, [job, photos, accessCode, project.rememberPhotos, dispatch, recheck])

  const cancel = useCallback(() => abortRef.current?.abort(), [])

  const removeResult = useCallback(async (roomId: string, resultId: string) => {
    dispatch({ type: 'removeResult', roomId, resultId })
    await deleteResult(resultId)
  }, [dispatch])

  const setAccessCode = useCallback((code: string) => {
    setCode(code)
    try { window.localStorage.setItem(CODE_KEY, code) } catch { /* kept in memory only */ }
  }, [])

  const value = useMemo(() => ({ service, recheck, resultUrl, job, generate, cancel, removeResult, accessCode, setAccessCode }),
    [service, recheck, resultUrl, job, generate, cancel, removeResult, accessCode, setAccessCode])
  return <AiCtx.Provider value={value}>{children}</AiCtx.Provider>
}

export function useAi(): Ctx {
  const ctx = useContext(AiCtx)
  if (!ctx) throw new Error('useAi must be used inside AiProvider')
  return ctx
}
