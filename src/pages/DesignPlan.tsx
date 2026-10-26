import { useState } from 'react'
import type { Route } from '../lib/router'
import { redesignLevels } from '../lib/config'
import { PageHeader } from '../components/PageHeader'
import { ProjectStrip } from '../components/ProjectStrip'
import { BudgetSummary } from '../components/BudgetSummary'
import { Badge, Block, MoneyInput, chipClass } from '../components/ui'
import { useProject } from '../state/ProjectContext'
import { useBudget } from '../state/useBudget'
import {
  COLOURS, MATERIALS, STYLES, STYLE_PRESETS, effectiveLevel, exceptionRooms, isException, styleLabel,
  type Room,
} from '../state/project'

const MAX_PICKS = 6

function exceptionText(r: Room): string {
  const parts: string[] = []
  if (r.design.levelOverride !== null) parts.push(`Level ${r.design.levelOverride}`)
  if (r.design.styleOverride !== null) parts.push(styleLabel(r.design.styleOverride))
  return parts.join(', ') + (r.design.exceptionReason.trim() ? `: ${r.design.exceptionReason.trim()}` : '')
}

export function DesignPlan({ go }: { go: (r: Route) => void }) {
  const { project, dispatch } = useProject()
  const budget = useBudget()
  const p = project.plan
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmApply, setConfirmApply] = useState(false)
  const exceptions = exceptionRooms(project)
  const followers = project.rooms.length - exceptions.length

  const toggle = (key: 'colours' | 'materials', v: string) => {
    const list = p[key]
    if (list.includes(v)) dispatch({ type: 'updatePlan', patch: { [key]: list.filter((x) => x !== v) } })
    else if (list.length < MAX_PICKS) dispatch({ type: 'updatePlan', patch: { [key]: [...list, v] } })
    else setNotice(`Choose up to ${MAX_PICKS}. Fewer choices usually look more cohesive.`)
  }

  const followNote = () =>
    project.rooms.length === 0 ? '' :
      exceptions.length === 0 ? `All ${project.rooms.length} rooms follow this.` :
        `${followers} ${followers === 1 ? 'room follows' : 'rooms follow'} this. ${exceptions.map((r) => r.name).join(', ')} ${exceptions.length === 1 ? 'has' : 'have'} its own setting.`

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 pt-10">
      <PageHeader title="Design plan">
        <p>One direction for the whole property. Every room starts from these choices, so the redesigned rooms look like they belong to the same home.</p>
      </PageHeader>
      <ProjectStrip go={go} />

      <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6 rounded-2xl border border-line bg-paper p-5 sm:p-6">
          <Block title="Overall style" hint={p.style ? STYLES.find((s) => s.value === p.style)?.hint : 'Choose the style every room will share.'}>
            <div role="radiogroup" aria-label="Overall style" className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button key={s.value} type="button" role="radio" aria-checked={p.style === s.value} className={chipClass(p.style === s.value)}
                  onClick={() => { dispatch({ type: 'updatePlan', patch: { style: p.style === s.value ? null : s.value } }); setNotice(null) }}>
                  {s.label}
                </button>
              ))}
            </div>
            {p.style && STYLE_PRESETS[p.style].colours.length > 0 && (
              <button type="button" className="btn-quiet mt-4"
                onClick={() => {
                  const preset = STYLE_PRESETS[p.style!]
                  dispatch({ type: 'updatePlan', patch: { colours: preset.colours, materials: preset.materials, direction: p.direction.trim() ? p.direction : preset.direction } })
                  setNotice(`Suggested ${styleLabel(p.style)} colours and materials added. Change any of them below.`)
                }}>
                Use suggested colours and materials
              </button>
            )}
            {project.rooms.length > 0 && <p className="mt-3 text-sm text-ink-soft">{followNote()}</p>}
          </Block>

          <Block title="Colour palette" hint={`Pick up to ${MAX_PICKS} colours to repeat through the home.`}>
            <div className="flex flex-wrap gap-2">
              {COLOURS.map((c) => {
                const on = p.colours.includes(c.value)
                return (
                  <button key={c.value} type="button" aria-pressed={on} className={`${chipClass(on)} flex items-center gap-2`} onClick={() => toggle('colours', c.value)}>
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: c.hex }} aria-hidden="true" />{c.label}
                  </button>
                )
              })}
            </div>
          </Block>

          <Block title="Materials and finishes" hint={`Pick up to ${MAX_PICKS}. Each room can use them differently, for example oak in a kitchen and on a bedside table.`}>
            <div className="flex flex-wrap gap-2">
              {MATERIALS.map((m) => {
                const on = p.materials.includes(m.value)
                return <button key={m.value} type="button" aria-pressed={on} className={chipClass(on)} onClick={() => toggle('materials', m.value)}>{on && <span aria-hidden="true">✓ </span>}{m.label}</button>
              })}
            </div>
          </Block>

          <Block title="Atmosphere" hint="How should guests feel when they walk in?">
            <label htmlFor="direction" className="sr-only">Overall design direction and atmosphere</label>
            <textarea id="direction" className="field min-h-[96px] leading-relaxed" maxLength={500} value={p.direction}
              placeholder="For example: light, relaxed and airy, with restrained coastal accents rather than themed décor."
              onChange={(e) => dispatch({ type: 'updatePlan', patch: { direction: e.target.value } })} />
          </Block>

          <Block title="Default redesign level" hint="Applies to every room unless you give a room its own level.">
            <div role="radiogroup" aria-label="Default redesign level" className="grid gap-2.5">
              {redesignLevels.map((l) => {
                const on = p.defaultLevel === l.id
                return (
                  <button key={l.id} type="button" role="radio" aria-checked={on} onClick={() => dispatch({ type: 'updatePlan', patch: { defaultLevel: l.id } })}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${on ? 'border-forest bg-sage/50' : 'border-line bg-card hover:border-forest/60'}`}>
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-forest' : 'border-line'}`} aria-hidden="true">
                      {on && <span className="h-2.5 w-2.5 rounded-full bg-forest" />}
                    </span>
                    <span>
                      <span className="block font-medium text-ink">Level {l.id}, {l.name}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">{l.summary}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Block>
          {notice && <p role="status" className="rounded-lg bg-sage px-4 py-3 text-sm text-forest-deep">{notice}</p>}
        </div>

        <div className="space-y-8 lg:sticky lg:top-24">
          <section aria-labelledby="budget-h" className="rounded-2xl border border-forest/40 bg-card p-5 sm:p-6">
            <h2 id="budget-h" className="h-display text-2xl">Total property budget</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">One amount for every improvement in the property. You don’t need to budget each room.</p>
            <MoneyInput className="mt-4" label="Total improvement budget" value={p.totalBudget}
              onChange={(v) => dispatch({ type: 'updatePlan', patch: { totalBudget: v } })} />
            <div className="mt-5"><BudgetSummary plan={budget} showSuggestions={false} /></div>
            <button type="button" className="btn-quiet mt-4 w-full" onClick={() => go('estimate')}>Review the room-by-room split</button>
          </section>

          <section aria-labelledby="rooms-plan-h" className="rounded-2xl border border-line bg-card p-5 sm:p-6">
            <h2 id="rooms-plan-h" className="h-display text-2xl">Rooms and the plan</h2>
            {project.rooms.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">No rooms yet. <button type="button" className="text-forest underline underline-offset-4" onClick={() => go('project')}>Add rooms</button></p>
            ) : (
              <>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {project.rooms.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <span>
                        <span className="font-medium text-ink">{r.name}</span>
                        <span className="block text-ink-soft">Level {effectiveLevel(r, p)}, {styleLabel(r.design.styleOverride ?? p.style)}</span>
                      </span>
                      {isException(r) ? (
                        <span className="flex items-center gap-2">
                          <Badge tone="exception">Own setting: {exceptionText(r)}</Badge>
                          <button type="button" className="text-forest underline underline-offset-4" onClick={() => { dispatch({ type: 'followPlan', roomId: r.id }); setNotice(`${r.name} now follows the design plan.`) }}>Follow plan</button>
                        </span>
                      ) : <Badge tone="plan">Follows plan</Badge>}
                    </li>
                  ))}
                </ul>
                {exceptions.length > 0 && (!confirmApply ? (
                  <button type="button" className="btn-primary mt-4 w-full" onClick={() => setConfirmApply(true)}>Apply plan to all rooms</button>
                ) : (
                  <div className="mt-4 rounded-xl bg-amber-soft p-4 text-sm">
                    <p className="text-ink">This sets {exceptions.map((r) => r.name).join(', ')} back to the plan’s style and level. Photos, furniture choices, room instructions and budget amounts stay exactly as they are.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className="btn-primary" onClick={() => { dispatch({ type: 'applyPlanToAllRooms' }); setConfirmApply(false); setNotice('All rooms now follow the design plan.') }}>Yes, apply to all rooms</button>
                      <button type="button" className="btn-quiet" onClick={() => setConfirmApply(false)}>Cancel</button>
                    </div>
                  </div>
                ))}
                <p className="mt-3 text-xs leading-relaxed text-ink-soft">Rooms that follow the plan update automatically when you change it. Rooms with their own setting keep it until you choose otherwise.</p>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
