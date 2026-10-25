import { describe, expect, it } from 'vitest'
import { handleRedesign, makeLimiter, safeEqual, statusBody, type FetchLike } from './redesignHandler'

const KEY = 'sk-test-SECRET-1234567890'
const env = { OPENAI_API_KEY: KEY, APP_ACCESS_CODE: 'open-sesame' }
const PHOTO = new Uint8Array(5000).map((_, i) => (i * 7) % 256)
const PROMPT = 'Edit the attached photograph of the bedroom ("Main bedroom"). Shared property brief (the same for every room): Modern coastal.'

function request(over: Partial<{ code: string; prompt: string; size: string; quality: string; level: string; type: string; withImage: boolean }> = {}) {
  const fd = new FormData()
  if (over.withImage !== false) fd.append('image', new Blob([PHOTO], { type: over.type ?? 'image/jpeg' }), 'room.jpg')
  fd.append('prompt', over.prompt ?? PROMPT)
  fd.append('size', over.size ?? '1536x1024')
  fd.append('quality', over.quality ?? 'medium')
  fd.append('level', over.level ?? '2')
  return new Request('http://x/api/redesign', { method: 'POST', body: fd, headers: { 'x-access-code': over.code ?? 'open-sesame', 'x-forwarded-for': '1.2.3.4' } })
}
const okImage = 'A'.repeat(4000)
const okFetch = (capture?: (url: string, init: RequestInit) => void): FetchLike => async (url, init) => {
  capture?.(url, init!)
  return new Response(JSON.stringify({ data: [{ b64_json: okImage }], usage: { input_tokens: 2100, output_tokens: 1400, input_tokens_details: { image_tokens: 1800, text_tokens: 300 } } }), { status: 200, headers: { 'x-request-id': 'req_1' } })
}
const providerFails = (status: number, body: unknown): FetchLike => async () => new Response(JSON.stringify(body), { status })
const fresh = () => makeLimiter(100)

describe('server: access and configuration', () => {
  it('refuses when the key or access code is not configured', async () => {
    expect((await handleRedesign(request(), {}, okFetch(), fresh())).status).toBe(503)
    expect((await handleRedesign(request(), { OPENAI_API_KEY: KEY }, okFetch(), fresh())).status).toBe(503)
  })
  it('refuses a wrong or missing access code, without calling OpenAI', async () => {
    let called = false
    const res = await handleRedesign(request({ code: 'guess' }), env, async () => { called = true; return new Response('{}') }, fresh())
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('access_code')
    expect(called).toBe(false)
  })
  it('status never includes the key', () => {
    const s = JSON.stringify(statusBody(env))
    expect(s).not.toContain(KEY)
    expect(JSON.parse(s)).toMatchObject({ configured: true, model: 'gpt-image-2.5-sunburst' })
  })
  it('compares codes safely', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
  })
  it('limits bursts from one visitor', () => {
    const l = makeLimiter(2, 1000)
    expect([l.allow('a', 0), l.allow('a', 1), l.allow('a', 2), l.allow('b', 3), l.allow('a', 2000)]).toEqual([true, true, false, true, true])
  })
})

describe('server: what is sent to OpenAI', () => {
  it('forwards the actual photo bytes, the full instructions and the chosen settings', async () => {
    let url = ''; let init: RequestInit = {}
    const res = await handleRedesign(request(), env, okFetch((u, i) => { url = u; init = i }), fresh())
    expect(res.status).toBe(200)
    expect(url).toBe('https://api.openai.com/v1/images/edits')
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`)
    const sent = init.body as FormData
    const img = sent.get('image[]') as Blob
    expect(new Uint8Array(await img.arrayBuffer())).toEqual(PHOTO)
    expect(sent.get('model')).toBe('gpt-image-2.5-sunburst')
    expect(sent.get('prompt')).toBe(PROMPT)
    expect(sent.get('size')).toBe('1536x1024')
    expect(sent.get('quality')).toBe('medium')
  })
  it('returns the image, but never the key', async () => {
    const res = await handleRedesign(request(), env, okFetch(), fresh())
    const text = await res.text()
    expect(text).not.toContain(KEY)
    expect(JSON.parse(text)).toMatchObject({ image: okImage, level: 2, model: 'gpt-image-2.5-sunburst', requestId: 'req_1' })
  })
  it('rejects bad input before spending anything', async () => {
    let calls = 0
    const counting: FetchLike = async () => { calls++; return new Response('{}') }
    for (const r of [request({ withImage: false }), request({ type: 'application/pdf' }), request({ prompt: 'too short' }), request({ size: '4000x4000' }), request({ quality: 'ultra' }), request({ level: '9' })]) {
      expect((await handleRedesign(r, env, counting, fresh())).status).toBe(400)
    }
    expect(calls).toBe(0)
  })
})

describe('server: honest error messages', () => {
  const cases: [string, FetchLike, number, string][] = [
    ['bad key', providerFails(401, { error: { message: 'Incorrect API key' } }), 502, 'provider_auth'],
    ['verification', providerFails(403, { error: { message: 'Organization must be verified' } }), 502, 'provider_forbidden'],
    ['no credit', providerFails(429, { error: { code: 'insufficient_quota', message: 'You exceeded your current quota' } }), 402, 'quota'],
    ['rate limit', providerFails(429, { error: { message: 'Rate limit reached' } }), 429, 'provider_rate_limit'],
    ['safety', providerFails(400, { error: { code: 'moderation_blocked', message: 'blocked' } }), 422, 'safety'],
    ['outage', providerFails(500, { error: { message: 'oops' } }), 503, 'provider_unavailable'],
    ['empty reply', async () => new Response(JSON.stringify({ data: [] }), { status: 200 }), 502, 'empty_result'],
    ['network down', async () => { throw new TypeError('fetch failed') }, 503, 'provider_unavailable'],
  ]
  for (const [name, f, status, code] of cases) {
    it(name, async () => {
      const res = await handleRedesign(request(), env, f, fresh())
      expect(res.status).toBe(status)
      const body = await res.json()
      expect(body.error).toBe(code)
      expect(body.message.length).toBeGreaterThan(20)
      expect(JSON.stringify(body)).not.toContain(KEY)
    })
  }
})
