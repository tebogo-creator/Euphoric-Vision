import type { Route } from '../lib/router'
import { formatRange, formatZAR } from '../lib/format'
import { buildPropertyBrief } from '../lib/redesignBrief'
import { PageHeader } from '../components/PageHeader'
import { ProjectStrip } from '../components/ProjectStrip'
import { StageNotice } from '../components/StageNotice'
import { BudgetSummary } from '../components/BudgetSummary'
import { Badge } from '../components/ui'
import { useProject } from '../state/ProjectContext'
import { usePhotos } from '../state/PhotoContext'
import { useBudget } from '../state/useBudget'
import { useAi } from '../state/AiContext'
import { COLOURS, effectiveLevel, isException, type Project } from '../state/project'

const SECTIONS: { title: string; stage: number; ready?: (p: Project) => boolean }[] = [
  { title: 'Property overview', stage: 1, ready: (p) => Boolean(p.name && p.location && p.rooms.length) },
  { title: 'Master design brief', stage: 2, ready: (p) => Boolean(p.plan.style) },
  { title: 'Original photographs', stage: 2, ready: (p) => p.rooms.some((r) => r.photo) },
  { title: 'Property quality assessment', stage: 4 },
  { title: 'Improvement opportunities', stage: 4 },
  { title: 'AI-generated redesign concepts', stage: 3, ready: (p) => p.rooms.some((r) => r.results.length > 0) },
  { title: 'Redesign level per room, with exceptions', stage: 2, ready: (p) => p.rooms.length > 0 },
  { title: 'Recommended redesign level', stage: 5 },
  { title: 'Itemised improvement budget', stage: 5 },
  { title: 'Total estimated initial investment', stage: 2, ready: (p) => p.rooms.length > 0 },
  { title: 'Budget allocation and any shortfall', stage: 2, ready: (p) => p.rooms.length > 0 && p.plan.totalBudget !== null },
  { title: 'First-year gross rental income', stage: 6 },
  { title: 'Operating expense assumptions', stage: 6 },
  { title: 'Projected operating income', stage: 6 },
  { title: 'Baseline versus improvement comparison', stage: 6 },
  { title: 'Conservative, expected and optimistic projections', stage: 6 },
  { title: 'Break-even analysis', stage: 6 },
  { title: 'Assumptions and exclusions', stage: 7 },
  { title: 'Sources and dates for external data', stage: 7 },
]

export function Report({ go }: { go: (r: Route) => void }) {
  const { project } = useProject()
  const photos = usePhotos()
  const ai = useAi()
  const budget = useBudget()
  const brief = buildPropertyBrief(project)
  const n = project.rooms.length
  const withPhotos = project.rooms.filter((r) => photos.status(r.id) === 'ready').length

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-5 pt-10">
      <PageHeader title="Generate Investment Report">
        <p>A property-wide summary that sets upfront costs against projected rental income, in plain language. Income figures will always be labelled as projections, never guarantees.</p>
      </PageHeader>
      <ProjectStrip go={go} />

      <section aria-labelledby="brief-h" className="rounded-2xl border border-line bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="brief-h" className="h-display text-3xl">Master design brief</h2>
          <button type="button" className="text-sm font-medium text-forest underline-offset-4 hover:underline" onClick={() => go('plan')}>Edit design plan</button>
        </div>
        {brief.isSet ? (
          <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
            {brief.rows.map((r) => (
              <div key={r.label} className="contents">
                <dt className="font-medium text-ink">{r.label}</dt>
                <dd className="text-ink-soft">
                  {r.label === 'Colour palette' && project.plan.colours.length > 0 && (
                    <span className="mr-2 inline-flex gap-1 align-middle">
                      {project.plan.colours.map((c) => <span key={c} className="h-4 w-4 rounded-full border border-black/10" style={{ background: COLOURS.find((x) => x.value === c)?.hex }} aria-hidden="true" />)}
                    </span>
                  )}
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : <p className="mt-3 text-sm text-ink-soft">No design plan yet. Choose a style, palette and materials for the whole property first.</p>}
      </section>

      <section aria-labelledby="photos-h">
        <h2 id="photos-h" className="h-display text-3xl">Rooms and photographs</h2>
        <p className="mt-1 text-sm text-ink-soft">{n ? `${withPhotos} of ${n} rooms have a photo. Each room will be redesigned from its own photo using the shared brief above.` : 'No rooms yet.'}</p>
        {n > 0 && (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.rooms.map((r) => {
              const url = photos.url(r.id)
              const line = budget.lines.find((l) => l.room.id === r.id)
              return (
                <li key={r.id} className="overflow-hidden rounded-2xl border border-line bg-card">
                  <div className="aspect-[4/3] bg-ivory">
                    {url ? <img src={url} alt={`Original photo of ${r.name}`} className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center text-sm text-ink-soft">No photo yet</div>}
                  </div>
                  <div className="space-y-1.5 p-4 text-sm">
                    <p className="font-medium text-ink">{r.name}</p>
                    <p className="flex flex-wrap items-center gap-2 text-ink-soft">
                      Level {effectiveLevel(r, project.plan)}
                      {isException(r) ? <Badge tone="exception">Own setting</Badge> : <Badge tone="plan">Follows plan</Badge>}
                    </p>
                    {line && <p className="text-ink-soft">Estimate {formatRange(line.estimate.low, line.estimate.high, line.estimate.openEnded)}{line.allocation !== null ? `, allocated ${formatZAR(line.allocation)}` : ''}</p>}
                    {!url && <p className="text-amber">Needs a photo before redesign</p>}
                    <div>
                      <p className="text-ink-soft">AI concepts (not photos of finished work)</p>
                      <div className="mt-1 grid grid-cols-3 gap-1.5">
                        {([1, 2, 3] as const).map((l) => {
                          const a = r.results.find((x) => x.id === r.activeResults[l])
                          const u = a ? ai.resultUrl(a.id) : null
                          return (
                            <figure key={l} className="space-y-0.5">
                              <div className="flex aspect-[3/2] items-center justify-center overflow-hidden rounded bg-ivory text-[10px] text-ink-soft">
                                {u ? <img src={u} alt={`AI concept of ${r.name}, Level ${l}`} className="h-full w-full object-cover" /> : 'None'}
                              </div>
                              <figcaption className="text-[10px] text-ink-soft">Level {l}</figcaption>
                            </figure>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {n > 0 && (
        <section aria-labelledby="inv-h" className="grid items-start gap-8 rounded-2xl border border-line bg-card p-5 sm:p-6 lg:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
          <div>
            <h2 id="inv-h" className="h-display text-3xl">Improvement investment</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-sm">
                <thead className="border-b border-line text-ink-soft">
                  <tr>
                    <th scope="col" className="py-2 pr-4 font-medium">Room</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Estimate</th>
                    <th scope="col" className="py-2 text-right font-medium">Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {budget.lines.map((l) => (
                    <tr key={l.room.id}>
                      <th scope="row" className="py-2.5 pr-4 font-medium text-ink">{l.room.name}</th>
                      <td className="py-2.5 pr-4 tabular-nums">{formatRange(l.estimate.low, l.estimate.high, l.estimate.openEnded)}</td>
                      <td className="py-2.5 text-right tabular-nums">{l.allocation === null ? '-' : formatZAR(l.allocation)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-line">
                  <tr>
                    <th scope="row" className="py-2.5 pr-4 font-semibold">Total estimated investment</th>
                    <td className="py-2.5 pr-4 tabular-nums font-semibold">{formatRange(budget.totals.low, budget.totals.high, budget.totals.openEnded)}</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold">{budget.budget === null ? '-' : formatZAR(budget.allocated)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-soft">Planning estimates only. Itemised costs replace these in Stage 5.</p>
          </div>
          <BudgetSummary plan={budget} />
        </section>
      )}

      <StageNotice stage={6} title="rental income projections">
        The report will compare a baseline (the property as it is today) with the improvement scenario, using nightly rates, occupancy and expenses you enter. Every assumption will be shown, and any increase in income will be your stated assumption, not a promise that improvements cause it.
      </StageNotice>

      <section aria-labelledby="contents-h">
        <h2 id="contents-h" className="h-display text-3xl">What the full report will contain</h2>
        <ol className="mt-5 divide-y divide-line rounded-2xl border border-line bg-card">
          {SECTIONS.map((s, i) => {
            const ready = s.ready?.(project) ?? false
            const label = s.ready ? (ready ? 'Has your details' : 'Needs your input') : `Built in Stage ${s.stage}`
            return (
              <li key={s.title} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <span><span className="mr-3 tabular-nums text-ink-soft">{i + 1}.</span><span className="text-ink">{s.title}</span></span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${ready ? 'bg-sage text-forest-deep' : 'bg-ivory text-ink-soft'}`}>{label}</span>
              </li>
            )
          })}
        </ol>
      </section>
      <StageNotice stage={7} title="the downloadable report">
        Once the cost and income tools exist, this page will assemble everything into one report you can print or save as PDF.
      </StageNotice>
    </div>
  )
}
