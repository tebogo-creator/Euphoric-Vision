/**
 * Talks to the app's own server (/api/...), never to OpenAI directly.
 * The browser never sees the OpenAI key.
 */
import type { OutputSize, Quality } from './aiPricing'
import { base64ToBlob } from './imagePrep'

export type ServiceStatus =
  | { state: 'checking' }
  | { state: 'unavailable' }
  | { state: 'not-configured'; hasKey: boolean; hasAccessCode: boolean; model: string }
  | { state: 'ready'; model: string; provider: string }

export async function fetchServiceStatus(timeoutMs = 6000): Promise<ServiceStatus> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('/api/status', { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) return { state: 'unavailable' }
    const d = await res.json()
    if (typeof d?.configured !== 'boolean') return { state: 'unavailable' }
    return d.configured
      ? { state: 'ready', model: String(d.model), provider: String(d.provider) }
      : { state: 'not-configured', hasKey: Boolean(d.hasKey), hasAccessCode: Boolean(d.hasAccessCode), model: String(d.model) }
  } catch {
    return { state: 'unavailable' }
  } finally {
    clearTimeout(t)
  }
}

export class GenerationError extends Error {
  constructor(public code: string, message: string) { super(message) }
}

export interface GeneratedImage {
  blob: Blob
  model: string
  size: OutputSize
  quality: Quality
  usage: unknown
}

export async function requestRedesign(args: {
  photo: Blob; prompt: string; level: 1 | 2 | 3; size: OutputSize; quality: Quality; accessCode: string; signal?: AbortSignal
}): Promise<GeneratedImage> {
  const body = new FormData()
  body.append('image', args.photo, 'room.jpg')
  body.append('prompt', args.prompt)
  body.append('level', String(args.level))
  body.append('size', args.size)
  body.append('quality', args.quality)
  let res: Response
  try {
    res = await fetch('/api/redesign', { method: 'POST', body, headers: { 'x-access-code': args.accessCode }, signal: args.signal })
  } catch {
    if (args.signal?.aborted) throw new GenerationError('cancelled', 'Generation was cancelled. If OpenAI had already started, it may still bill for it.')
    throw new GenerationError('network', 'Couldn’t reach the Euphoric Vision server. Check your internet connection and try again.')
  }
  let data: any = null
  try { data = await res.json() } catch { /* handled below */ }
  if (!res.ok) {
    if (res.status === 413) throw new GenerationError('too_large', 'The photo was too large to send. Try a smaller photo.')
    throw new GenerationError(data?.error ?? 'unknown', data?.message ?? `The server returned an error (${res.status}).`)
  }
  if (typeof data?.image !== 'string') throw new GenerationError('empty_result', 'The server replied without an image. Nothing was saved.')
  const blob = base64ToBlob(data.image, data.mimeType || 'image/jpeg')
  if (blob.size < 1000) throw new GenerationError('empty_result', 'The returned image looks damaged. Nothing was saved.')
  return { blob, model: String(data.model), size: data.size, quality: data.quality, usage: data.usage }
}
