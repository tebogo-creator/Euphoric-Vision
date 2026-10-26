import { useEffect, useId, useState } from 'react'
import type { Route } from '../lib/router'
import { redesignLevels, type LevelId } from '../lib/config'
import { formatRange, formatZAR } from '../lib/format'
import { estimateRoom } from '../lib/budget'
import { buildRedesignBrief } from '../lib/redesignBrief'
import { chooseOutputSize } from '../lib/imagePrep'
import { QUALITY_OPTIONS, estimateCostUsd, formatUsd, formatUsdWithZar } from '../lib/aiPricing'
import { BeforeAfter } from './BeforeAfter'
import { PendingResult } from './PendingResult'
import { ConnectHelp } from './ConnectHelp'
import { Badge, chipClass } from './ui'
import { useProject } from '../state/ProjectContext'
import { usePhotos } from '../state/PhotoContext'
import { useAi } from '../state/AiContext'
import { useBudget } from '../state/useBudget'
import { effectiveLevel, effectiveStyle, styleLabel, type RedesignResult, type Room } from '../state/project'

const dateText = (iso: string) => new Date(iso).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const aspectOf = (size: string) => { const [w, h] = size.split('x').map(Number); return w && h ? w / h : 3 / 2 }
const LEVELS: LevelId[] = [1, 2, 3]

/**
 * Generate and compare AI redesigns of ONE room at all three levels, from the
 * same original photo and the same property design plan.
 */
export function AiRedesignPanel({ room, go }: { room: Room; go: (r: Route) => void }) {
  const { project, dispatch } = useProject()
  const photos = usePhotos()
  const ai = useAi()
  const budget = useBudget()
  const planned = effectiveLevel(room, project.plan)
  const [viewLevel, setViewLevel] = useState<LevelId>(planned)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const codeId = useId()
  const [codeDraft, setCodeDraft] = useState('')

  const photoUrl = photos.url(room.id)
  const line = budget.lines.find((l) => l.room.id === room.id)
  const level = redesignLevels.find((l) => l.id === viewLevel)!
  const prompt = buildRedesignBrief(room, project, line, viewLevel).text
  const versions = room.results.filter((r) => r.level === viewLevel)
  const active = versions.find((r) => r.id === room.activeResults[viewLevel])
  const activeUrl = active ? ai.resultUrl(active.id) : null
  const stale = Boolean(active && active.promptText !== prompt)
  const size = chooseOutputSize(room.photo?.width || 4, room.photo?.height || 3)
  const cost = estimateCostUsd(size, project.aiQuality)
  const running = ai.job?.roomId === room.id && ai.job.level === viewLevel
  const busyElsewhere = Boolean(ai.job) && !running
  const ready = ai.service.state === 'ready'
  const canGenerate = ready && Boolean(photoUrl) && project.aiConsent && Boolean(ai.accessCode) && !ai.job
  const anyResults = project.rooms.some((r) => r.results.length > 0)

  useEffect(() => {
    if (!ai.job) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [ai.job])

  const run = async () => {
    setConfirming(false); setError(null); setNotice(null)
    const out = await ai.generate(room, viewLevel, prompt, project.aiQuality)
    if (out.ok) setNotice(`Level ${viewLevel} redesign ready. ${out.result.costIsEstimate ? 'Estimated' : 'Approximate'} cost ${formatUsd(out.result.costUsd ?? cost)}.`)
    else setError(out.message)
  }

  const levelStatus = (l: LevelId) => {
    if (ai.job?.roomId === room.id && ai.job.level === l) return 'Generating…'
    const v = room.results.filter((r) => r.level === l)
    if (!v.length) return 'Not generated'
    const a = v.find((r) => r.id === room.activeResults[l]) ?? v[v.length - 1]
    const p = buildRedesignBrief(room, project, line, l).text
    return `${v.length} ${v.length === 1 ? 'version' : 'versions'}${a.promptText !== p ? ', settings changed' : ''}`
  }

  const thumb = (r: RedesignResult) => ai.resultUrl(r.id)

  return (
    <section aria-labelledby="ai-h" className="space-y-6 rounded-2xl border border-forest/40 bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="ai-h" className="h-display text-3xl">AI redesign</h2>
          <p className="text-sm text-ink-soft">Same photo, same design plan, three levels of change. Generated images are design concepts, not guarantees of the finished room.</p>
        </div>
        {ai.service.state === 'ready' ? <Badge tone="plan">Connected to OpenAI</Badge>
          : ai.service.state === 'checking' ? <Badge tone="muted">Checking connection…</Badge>
            : <Badge tone="warn">Not connected here</Badge>}
      </div>

      {!anyResults && ready && (
        <p className="rounded-lg bg-ivory px-4 py-3 text-sm text-ink">Start with one room, ideally your main bedroom, and generate all three levels so you can compare them fairly.</p>
      )}

      <div role="radiogroup" aria-label="Redesign level to view" className="grid gap-2 sm:grid-cols-3">
        {LEVELS.map((l) => {
          const on = l === viewLevel
          const info = redesignLevels.find((x) => x.id === l)!
          return (
            <button key={l} type="button" role="radio" aria-checked={on} onClick={() => { setViewLevel(l); setConfirming(false); setError(null); setNotice(null) }}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${on ? 'border-forest bg-sage/50' : 'border-line bg-paper hover:border-forest/60'}`}>
              <span className="block font-medium text-ink">Level {l}, {info.name}</span>
              <span className="text-xs text-ink-soft">{levelStatus(l)}{l === planned ? ', the room’s plan' : ''}</span>
            </button>
          )
        })}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr] [&>*]:min-w-0">
        <div className="space-y-3">
          <div className="relative">
            {photoUrl ? (
              <BeforeAfter
                aspect={active ? aspectOf(active.size) : room.photo?.width && room.photo.height ? room.photo.width / room.photo.height : 4 / 3}
                before={<img src={photoUrl} alt={`Your photo of ${room.name}`} className="h-full w-full object-cover" draggable={false} />}
                after={activeUrl
                  ? <img src={activeUrl} alt={`AI concept of ${room.name} at Level ${viewLevel}`} className="h-full w-full object-cover" draggable={false} data-testid="result-image" />
                  : active
                    ? <PendingResult title="Not kept after reload" body={`This Level ${viewLevel} version wasn’t saved on this device. Generate again to see it.`} />
                    : <PendingResult title={`No Level ${viewLevel} redesign yet`} body={ready ? 'Press Generate to create one from your photo.' : 'Generation needs the connected app.'} />}
                beforeLabel="Your photo"
                afterLabel={activeUrl ? `AI concept, Level ${viewLevel}` : 'Not generated yet'}
                afterTone={activeUrl ? 'result' : 'pending'}
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-line bg-paper p-6 text-center text-sm text-ink-soft">Add a photo of {room.name} below to start.</div>
            )}
            {running && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/45" role="status" aria-live="polite">
                <div className="mx-4 max-w-xs rounded-xl bg-card p-4 text-center text-sm shadow">
                  <div className="mx-auto h-1.5 w-full overflow-hidden rounded-full bg-line"><div className="h-full w-1/3 animate-[ev-progress_1.4s_ease-in-out_infinite] rounded-full bg-forest" /></div>
                  <p className="mt-3 font-medium text-ink">Generating Level {viewLevel}… {Math.round((now - (ai.job?.startedAt ?? now)) / 1000)} s</p>
                  <p className="mt-1 text-ink-soft">Usually 20 to 90 seconds. Your original photo is safe.</p>
                </div>
              </div>
            )}
          </div>
          {active && (
            <div className="text-xs leading-relaxed text-ink-soft">
              <p>AI concept generated {dateText(active.createdAt)} with {active.model}, {QUALITY_OPTIONS.find((q) => q.value === active.quality)?.label} quality{active.costUsd !== null ? `, ${active.costIsEstimate ? 'estimated' : 'approximate'} cost ${formatUsd(active.costUsd)}` : ''}.
                {activeUrl && <> <a href={activeUrl} download={`${room.name} level ${viewLevel} concept.jpg`} className="font-medium text-forest underline underline-offset-2">Download</a></>}
              </p>
              <p className="mt-1">Generated images can change details, sizes and features. Compare carefully with your original before relying on them.</p>
            </div>
          )}
          {stale && <p className="rounded-lg bg-amber-soft px-3 py-2 text-sm text-ink">Your design plan or room settings have changed since this was generated. This version is kept; generate again to use the new settings.</p>}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl bg-ivory px-4 py-3 text-sm leading-relaxed">
            <p className="font-medium text-ink">Level {level.id}, {level.name}</p>
            <p className="mt-1 text-ink-soft">{level.summary}</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-ink-soft">Style</dt><dd className="text-ink">{styleLabel(effectiveStyle(room, project.plan))}</dd>
              <dt className="text-ink-soft">Keeping</dt><dd className="text-ink">{room.design.preserve.length} items</dd>
              <dt className="text-ink-soft">Your notes</dt><dd className="text-ink">{room.design.instructions.trim() ? 'Included' : 'None'}</dd>
              <dt className="text-ink-soft">Estimate</dt><dd className="text-ink tabular-nums">{(() => { const e = estimateRoom(room, viewLevel); return formatRange(e.low, e.high, e.openEnded) })()}</dd>
              {viewLevel === planned && line?.allocation != null && <><dt className="text-ink-soft">Allocated</dt><dd className="text-ink tabular-nums">{formatZAR(line.allocation)}</dd></>}
            </dl>
            <button type="button" className="mt-2 text-forest underline underline-offset-4" onClick={() => document.getElementById('settings-h')?.scrollIntoView({ behavior: 'smooth' })}>Review room settings</button>
          </div>

          {ai.service.state === 'unavailable' || ai.service.state === 'not-configured' ? (
            <ConnectHelp service={ai.service} onRecheck={ai.recheck} />
          ) : ai.service.state === 'checking' ? null : (
            <div className="space-y-4">
              {!project.aiConsent && (
                <label className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4 text-sm">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[rgb(var(--c-forest))]" checked={false}
                    onChange={() => dispatch({ type: 'setAiConsent', consent: true })} />
                  <span className="leading-relaxed text-ink">
                    I understand that pressing Generate sends this room’s photo and instructions to OpenAI. OpenAI’s published policy is that API data isn’t used to train its models and is kept for up to 30 days for abuse monitoring.
                  </span>
                </label>
              )}
              {!ai.accessCode ? (
                <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (codeDraft.trim()) { ai.setAccessCode(codeDraft.trim()); setCodeDraft('') } }}>
                  <div className="min-w-0 flex-1">
                    <label htmlFor={codeId} className="field-label">Access code</label>
                    <input id={codeId} className="field" type="password" autoComplete="off" value={codeDraft} onChange={(e) => setCodeDraft(e.target.value)} placeholder="The code you set in Vercel" />
                  </div>
                  <button type="submit" className="btn-quiet" disabled={!codeDraft.trim()}>Save code</button>
                </form>
              ) : (
                <p className="text-xs text-ink-soft">Access code saved on this device. <button type="button" className="underline underline-offset-2" onClick={() => ai.setAccessCode('')}>Change</button></p>
              )}
              <div>
                <p className="text-sm font-medium text-ink">Quality</p>
                <div role="radiogroup" aria-label="Image quality" className="mt-2 flex flex-wrap gap-2">
                  {QUALITY_OPTIONS.map((q) => (
                    <button key={q.value} type="button" role="radio" aria-checked={project.aiQuality === q.value} className={chipClass(project.aiQuality === q.value)}
                      onClick={() => dispatch({ type: 'setAiQuality', quality: q.value })} title={q.hint}>
                      {q.label}, about {formatUsd(estimateCostUsd(size, q.value))}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-ink-soft">{QUALITY_OPTIONS.find((q) => q.value === project.aiQuality)?.hint} Costs are estimates; your OpenAI usage page shows the real charge.</p>
              </div>

              {running ? (
                <button type="button" className="btn-quiet w-full" onClick={ai.cancel}>Cancel</button>
              ) : !confirming ? (
                <button type="button" className="btn-primary w-full py-3 text-base" disabled={!canGenerate} onClick={() => { setConfirming(true); setError(null); setNotice(null) }}>
                  {active ? `Generate another Level ${viewLevel} version` : `Generate Level ${viewLevel} redesign`}
                </button>
              ) : (
                <div className="rounded-xl bg-amber-soft p-4 text-sm">
                  <p className="text-ink">This sends your photo of {room.name} to OpenAI and costs about {formatUsdWithZar(cost)}. {active ? 'Your current version is kept.' : ''}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn-primary" onClick={run}>Yes, generate</button>
                    <button type="button" className="btn-quiet" onClick={() => setConfirming(false)}>Cancel</button>
                  </div>
                </div>
              )}
              {!canGenerate && !running && !confirming && (
                <p className="text-xs text-ink-soft">
                  {!photoUrl ? `Add a photo of ${room.name} first.` : !project.aiConsent ? 'Tick the box above to allow sending the photo.' : !ai.accessCode ? 'Enter your access code first.' : busyElsewhere ? 'Another redesign is being generated.' : ''}
                </p>
              )}
              {error && <p role="alert" className="rounded-lg bg-amber-soft px-4 py-3 text-sm text-ink"><span className="font-semibold text-amber">Not generated. </span>{error} Your photo and settings haven’t changed.</p>}
              {notice && <p role="status" className="rounded-lg bg-sage px-4 py-3 text-sm text-forest-deep">{notice}</p>}
              <details className="text-sm">
                <summary className="cursor-pointer text-ink-soft">See the exact instructions for Level {viewLevel}</summary>
                <p className="mt-2 whitespace-pre-wrap rounded-xl border border-line bg-paper p-3 text-xs leading-relaxed text-ink" data-testid="level-prompt">{prompt}</p>
              </details>
            </div>
          )}

          {versions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink">Level {viewLevel} versions</p>
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {versions.map((r) => {
                  const u = thumb(r)
                  const on = r.id === active?.id
                  return (
                    <li key={r.id} className="space-y-1">
                      <button type="button" onClick={() => dispatch({ type: 'showResult', roomId: room.id, level: viewLevel, resultId: r.id })}
                        aria-pressed={on} aria-label={`Show version from ${dateText(r.createdAt)}`}
                        className={`block aspect-[3/2] w-full overflow-hidden rounded-lg border-2 ${on ? 'border-forest' : 'border-transparent'} bg-ivory`}>
                        {u ? <img src={u} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-ink-soft">Not kept</span>}
                      </button>
                      <p className="text-[11px] text-ink-soft">{dateText(r.createdAt)}</p>
                      {confirmDelete === r.id ? (
                        <span className="flex gap-2 text-[11px]">
                          <button type="button" className="text-amber underline" onClick={async () => { await ai.removeResult(room.id, r.id); setConfirmDelete(null) }}>Delete</button>
                          <button type="button" className="underline" onClick={() => setConfirmDelete(null)}>Keep</button>
                        </span>
                      ) : <button type="button" className="text-[11px] text-ink-soft underline" onClick={() => setConfirmDelete(r.id)}>Delete</button>}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-line pt-6">
        <h3 className="h-display text-2xl">Compare all levels</h3>
        <p className="mt-1 text-sm text-ink-soft">Estimates come from the planning assumptions on the Costs page, not from the images.</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <li className="space-y-2">
            <div className="aspect-[3/2] overflow-hidden rounded-xl bg-ivory">{photoUrl && <img src={photoUrl} alt={`Original photo of ${room.name}`} className="h-full w-full object-cover" />}</div>
            <p className="text-sm font-medium text-ink">Original photo</p>
            <p className="text-xs text-ink-soft">Never changed</p>
          </li>
          {LEVELS.map((l) => {
            const a = room.results.find((r) => r.id === room.activeResults[l])
            const u = a ? ai.resultUrl(a.id) : null
            const e = estimateRoom(room, l)
            return (
              <li key={l} className="space-y-2">
                <button type="button" onClick={() => setViewLevel(l)} className="block aspect-[3/2] w-full overflow-hidden rounded-xl bg-ivory text-xs text-ink-soft" aria-label={`View Level ${l}`}>
                  {u ? <img src={u} alt={`AI concept, Level ${l}`} className="h-full w-full object-cover" /> : 'Not generated'}
                </button>
                <p className="text-sm font-medium text-ink">Level {l}, {redesignLevels.find((x) => x.id === l)!.name}</p>
                <p className="text-xs tabular-nums text-ink-soft">
                  Low {formatZAR(e.low)}, expected {formatZAR(e.expected)}, high {formatZAR(e.high)}{e.openEnded ? '+' : ''}
                  {l === planned && line?.allocation != null && <span className="block">Allocated {formatZAR(line.allocation)}</span>}
                </p>
              </li>
            )
          })}
        </ul>
        <button type="button" className="mt-3 text-sm text-forest underline underline-offset-4" onClick={() => go('estimate')}>See how estimates are worked out</button>
      </div>
    </section>
  )
}
