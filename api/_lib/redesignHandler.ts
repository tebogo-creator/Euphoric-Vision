/**
 * Server-side image redesign. Runs on Vercel, never in the browser, so the
 * OpenAI key stays secret. Files in api/_lib are helpers, not web addresses.
 *
 * Flow: check access code -> check limits -> validate the photo and settings
 * -> send the photo + instructions to OpenAI's image edit endpoint -> return
 * the edited image. Nothing is stored on the server.
 */
export interface ServerEnv {
  OPENAI_API_KEY?: string
  APP_ACCESS_CODE?: string
  OPENAI_IMAGE_MODEL?: string
  /** Only for automated tests against a stand-in service. */
  OPENAI_BASE_URL?: string
}

export const DEFAULT_MODEL = 'gpt-image-2.5-sunburst'
const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const SIZES = ['1536x1024', '1024x1536', '1024x1024'] as const
export const QUALITIES = ['low', 'medium', 'high'] as const
const PROVIDER_TIMEOUT_MS = 110_000

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

const fail = (status: number, error: string, message: string) => json(status, { error, message })

/** Compares two strings without revealing how much of the code was right. */
export function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  return diff === 0
}

/** Best-effort limit per visitor, per server instance: a safety net, not a billing control. */
export function makeLimiter(max = 12, windowMs = 10 * 60 * 1000) {
  const hits = new Map<string, number[]>()
  return {
    allow(key: string, now = Date.now()): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
      if (recent.length >= max) { hits.set(key, recent); return false }
      recent.push(now); hits.set(key, recent); return true
    },
  }
}
const sharedLimiter = makeLimiter()

export function statusBody(env: ServerEnv) {
  return {
    provider: 'OpenAI',
    model: env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL,
    hasKey: Boolean(env.OPENAI_API_KEY),
    hasAccessCode: Boolean(env.APP_ACCESS_CODE),
    configured: Boolean(env.OPENAI_API_KEY && env.APP_ACCESS_CODE),
  }
}

function providerError(status: number, data: any): Response {
  const code: string = data?.error?.code ?? ''
  const raw: string = typeof data?.error?.message === 'string' ? data.error.message : ''
  const detail = raw.slice(0, 300)
  if (status === 401) return fail(502, 'provider_auth', 'OpenAI rejected the API key. Check OPENAI_API_KEY in your Vercel settings, then redeploy.')
  if (status === 403) return fail(502, 'provider_forbidden', 'OpenAI refused access to this image model. Your OpenAI organisation may need to complete verification (platform.openai.com > Settings > Organization > General).')
  if (status === 429 && (code === 'insufficient_quota' || /quota|billing/i.test(raw)))
    return fail(402, 'quota', 'Your OpenAI account has no credit left or reached its spending limit. Add credit or raise the limit at platform.openai.com > Billing.')
  if (status === 429) return fail(429, 'provider_rate_limit', 'OpenAI is limiting requests right now. Wait a minute and try again.')
  if (status === 400 && (code === 'moderation_blocked' || /safety|moderation/i.test(raw)))
    return fail(422, 'safety', 'OpenAI’s safety system declined this request. Try a different photo, or simpler instructions.')
  if (status >= 400 && status < 500) return fail(422, 'provider_bad_request', `OpenAI couldn’t process this request.${detail ? ` It said: ${detail}` : ''}`)
  return fail(503, 'provider_unavailable', 'The image service is having problems. Nothing was charged for a failed request as far as we can tell; try again in a few minutes.')
}

export async function handleRedesign(req: Request, env: ServerEnv, fetchImpl: FetchLike = fetch, limiter = sharedLimiter): Promise<Response> {
  if (req.method !== 'POST') return fail(405, 'method', 'Use POST.')
  if (!env.OPENAI_API_KEY) return fail(503, 'not_configured', 'AI redesign isn’t set up yet: OPENAI_API_KEY is missing from the server settings.')
  if (!env.APP_ACCESS_CODE) return fail(503, 'not_configured', 'AI redesign isn’t set up yet: APP_ACCESS_CODE is missing from the server settings.')
  if (!safeEqual(req.headers.get('x-access-code') ?? '', env.APP_ACCESS_CODE)) return fail(401, 'access_code', 'The access code is missing or incorrect.')

  const visitor = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  if (!limiter.allow(visitor)) return fail(429, 'local_rate_limit', 'That’s a lot of redesigns in a short time. Please wait a few minutes before generating again.')

  let form: FormData
  try { form = await req.formData() } catch { return fail(400, 'bad_request', 'The request couldn’t be read. Please try again.') }

  const image = form.get('image')
  if (!(image instanceof Blob)) return fail(400, 'bad_request', 'No photo was included.')
  if (!IMAGE_TYPES.includes(image.type)) return fail(400, 'bad_image', 'The photo must be JPEG, PNG or WebP.')
  if (image.size === 0 || image.size > MAX_IMAGE_BYTES) return fail(400, 'bad_image', 'The prepared photo is empty or larger than 4 MB.')
  const prompt = String(form.get('prompt') ?? '')
  if (prompt.length < 50 || prompt.length > 20000) return fail(400, 'bad_request', 'The redesign instructions are missing or too long.')
  const size = String(form.get('size') ?? '')
  const quality = String(form.get('quality') ?? '')
  const level = Number(form.get('level'))
  if (!(SIZES as readonly string[]).includes(size)) return fail(400, 'bad_request', 'Unsupported image size.')
  if (!(QUALITIES as readonly string[]).includes(quality)) return fail(400, 'bad_request', 'Unsupported quality setting.')
  if (![1, 2, 3].includes(level)) return fail(400, 'bad_request', 'Unknown redesign level.')

  const model = env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL
  const ext = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg'
  const out = new FormData()
  out.append('model', model)
  out.append('prompt', prompt)
  out.append('image[]', image, `room.${ext}`)
  out.append('size', size)
  out.append('quality', quality)
  out.append('output_format', 'jpeg')
  out.append('output_compression', '90')
  out.append('n', '1')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetchImpl(`${(env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')}/images/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: out,
      signal: controller.signal,
    })
  } catch {
    return controller.signal.aborted
      ? fail(504, 'timeout', 'The image service took too long to reply. Try again, or use Standard quality, which is faster.')
      : fail(503, 'provider_unavailable', 'Couldn’t reach the image service. Check your connection and try again.')
  } finally {
    clearTimeout(timer)
  }

  let data: any = null
  try { data = await res.json() } catch { /* handled below */ }
  if (!res.ok) return providerError(res.status, data)

  const b64 = data?.data?.[0]?.b64_json
  if (typeof b64 !== 'string' || b64.length < 100) return fail(502, 'empty_result', 'The image service replied without an image. Nothing was saved. Please try again.')
  return json(200, {
    image: b64,
    mimeType: 'image/jpeg',
    model, size, quality, level,
    usage: data.usage ?? null,
    requestId: res.headers.get('x-request-id'),
  })
}
