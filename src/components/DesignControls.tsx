import { useId, useState } from 'react'
import type { Route } from '../lib/router'
import { redesignLevels } from '../lib/config'
import { formatRange, formatZAR } from '../lib/format'
import { Badge, Block, chipClass } from './ui'
import { useProject } from '../state/ProjectContext'
import { useBudget } from '../state/useBudget'
import {
  CONDITIONS, FEATURE_ITEMS, FURNITURE_ITEMS, STYLES, TYPICAL_FURNITURE, effectiveLevel, effectiveStyle, styleLabel,
  type PreserveItem, type Room,
} from '../state/project'

const EXAMPLE = 'Keep the existing bed and wardrobe. Replace the bedding, improve the lighting, add tasteful decor, and create a premium holiday-home feel without making the room look overcrowded.'
const MAX_INSTRUCTIONS = 1000

/**
 * Settings for ONE room. Level and style come from the property design plan
 * unless the owner deliberately sets an exception here.
 */
export function DesignControls({ room, go }: { room: Room; go: (r: Route) => void }) {
  const { project, dispatch } = useProject()
  const budget = useBudget()
  const plan = project.plan
  const d = room.design
  const levelId = effectiveLevel(room, plan)
  const level = redesignLevels.find((l) => l.id === levelId)!
  const [styleOpen, setStyleOpen] = useState(d.styleOverride !== null)
  const reasonId = useId()
  const otherId = useId()
  const instructionsId = useId()
  const line = budget.lines.find((l) => l.room.id === room.id)
  const typical = TYPICAL_FURNITURE[room.type]

  const preserveChip = (item: { value: PreserveItem; label: string }) => {
    const on = d.preserve.includes(item.value)
    return (
      <button key={item.value} type="button" aria-pressed={on} className={chipClass(on)}
        onClick={() => dispatch({ type: 'togglePreserve', roomId: room.id, item: item.value })}>
        {on && <span aria-hidden="true">✓ </span>}{item.label}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <Block title="Redesign level"
        aside={d.levelOverride !== null ? <Badge tone="exception">Room exception</Badge> : <Badge tone="plan">From the plan</Badge>}
        hint={d.levelOverride !== null
          ? <>The plan’s default is Level {plan.defaultLevel}. This room uses Level {levelId}. <button type="button" className="text-forest underline underline-offset-4" onClick={() => dispatch({ type: 'setRoomLevel', roomId: room.id, level: plan.defaultLevel })}>Use the plan’s level</button></>
          : `Following the property plan (Level ${plan.defaultLevel}). Choose another level only if this room needs more or less work.`}>
        <div role="radiogroup" aria-label={`Redesign level for ${room.name}`} className="grid gap-2.5">
          {redesignLevels.map((l) => {
            const on = l.id === levelId
            return (
              <button key={l.id} type="button" role="radio" aria-checked={on} onClick={() => dispatch({ type: 'setRoomLevel', roomId: room.id, level: l.id })}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${on ? 'border-forest bg-sage/50' : 'border-line bg-card hover:border-forest/60'}`}>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-forest' : 'border-line'}`} aria-hidden="true">
                  {on && <span className="h-2.5 w-2.5 rounded-full bg-forest" />}
                </span>
                <span>
                  <span className="block font-medium text-ink">Level {l.id}, {l.name}{l.id === plan.defaultLevel && <span className="ml-2 text-xs font-normal text-ink-soft">plan default</span>}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">{l.summary}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-3 rounded-xl bg-ivory px-4 py-3 text-sm leading-relaxed">
          <p className="font-medium text-ink">Level {level.id} usually means</p>
          <ul className="mt-1 text-ink-soft">{level.changes.map((c) => <li key={c}>+ {c}</li>)}</ul>
          <p className="mt-1 text-ink">{level.keeps}</p>
        </div>
      </Block>

      <Block title="Style"
        aside={d.styleOverride !== null ? <Badge tone="exception">Room exception</Badge> : <Badge tone="plan">From the plan</Badge>}
        hint={plan.style
          ? `This room uses ${styleLabel(effectiveStyle(room, plan))}${d.styleOverride !== null ? `, instead of the property’s ${styleLabel(plan.style)}` : ', from the property plan'}.`
          : <>No property style yet. <button type="button" className="text-forest underline underline-offset-4" onClick={() => go('plan')}>Choose one in the design plan</button></>}>
        {!styleOpen ? (
          <button type="button" className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink" onClick={() => setStyleOpen(true)}>Use a different style for this room</button>
        ) : (
          <div>
            <p className="mb-3 text-sm text-ink-soft">A different style can make the home feel less connected. The property’s colours and materials will still be used.</p>
            <div role="radiogroup" aria-label={`Style for ${room.name}`} className="flex flex-wrap gap-2">
              {STYLES.map((s) => {
                const on = effectiveStyle(room, plan) === s.value
                return <button key={s.value} type="button" role="radio" aria-checked={on} className={chipClass(on)} onClick={() => dispatch({ type: 'setRoomStyle', roomId: room.id, style: s.value })}>{s.label}</button>
              })}
            </div>
            <button type="button" className="mt-3 text-sm text-forest underline underline-offset-4"
              onClick={() => { dispatch({ type: 'setRoomStyle', roomId: room.id, style: null }); setStyleOpen(false) }}>
              Use the property style
            </button>
          </div>
        )}
      </Block>

      {(d.levelOverride !== null || d.styleOverride !== null) && (
        <div className="-mt-2">
          <label htmlFor={reasonId} className="field-label">Why is this room different? (optional)</label>
          <input id={reasonId} className="field" maxLength={200} value={d.exceptionReason} placeholder="For example, the kitchen cupboards are worn and need more work"
            onChange={(e) => dispatch({ type: 'updateDesign', roomId: room.id, patch: { exceptionReason: e.target.value } })} />
        </div>
      )}

      <Block title="Room condition" hint="Your own view of the room today. It helps share the budget sensibly.">
        <div role="radiogroup" aria-label={`Condition of ${room.name}`} className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => {
            const on = room.assessment.condition === c.value
            return (
              <button key={c.value} type="button" role="radio" aria-checked={on} className={chipClass(on)} title={c.hint}
                onClick={() => dispatch({ type: 'setCondition', roomId: room.id, condition: on ? null : c.value })}>{c.label}</button>
            )
          })}
        </div>
        <p className="mt-2 text-sm text-ink-soft">{CONDITIONS.find((c) => c.value === room.assessment.condition)?.hint ?? 'Not rated yet. The estimate assumes fair condition.'}</p>
      </Block>

      <Block title="What to keep" hint="Marked items are things the redesign should try to leave in place.">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-card px-4 py-3">
          <span>
            <span className="block font-medium text-ink">Keep existing furniture</span>
            <span className="text-sm text-ink-soft">{d.keepExistingFurniture ? 'On. The marked furniture below stays.' : 'Off. Furniture may be changed.'}</span>
          </span>
          <button type="button" role="switch" aria-checked={d.keepExistingFurniture} aria-label="Keep existing furniture"
            onClick={() => dispatch({ type: 'setKeepFurniture', roomId: room.id, keep: !d.keepExistingFurniture })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${d.keepExistingFurniture ? 'bg-forest' : 'bg-line'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${d.keepExistingFurniture ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <p className="mt-4 text-sm font-medium text-ink">Furniture</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[...FURNITURE_ITEMS].sort((a, b) => Number(typical.includes(b.value)) - Number(typical.includes(a.value))).map(preserveChip)}
        </div>
        {d.preserve.includes('otherFurniture') && (
          <div className="mt-3">
            <label htmlFor={otherId} className="field-label">Which other furniture?</label>
            <input id={otherId} className="field" value={d.otherFurnitureNote} placeholder="For example, the cane armchair by the window"
              onChange={(e) => dispatch({ type: 'updateDesign', roomId: room.id, patch: { otherFurnitureNote: e.target.value } })} />
          </div>
        )}
        <p className="mt-4 text-sm font-medium text-ink">Room features</p>
        <div className="mt-2 flex flex-wrap gap-2">{FEATURE_ITEMS.map(preserveChip)}</div>
        <p className="mt-4 rounded-lg bg-ivory px-4 py-3 text-sm leading-relaxed text-ink-soft">
          Keeping an item means the AI will be asked to leave it in place. It can’t guarantee an exact copy of its colour, shape or size, so always compare the result with your original.
          {levelId === 3 && d.keepExistingFurniture && ' Level 3 normally replaces furniture, but anything you mark here will still be kept.'}
        </p>
      </Block>

      <Block title="Room instructions" hint="Anything specific to this room. The property plan already covers style, colours and materials.">
        <label htmlFor={instructionsId} className="sr-only">Design instructions for {room.name}</label>
        <textarea id={instructionsId} className="field min-h-[130px] leading-relaxed" maxLength={MAX_INSTRUCTIONS}
          value={d.instructions} placeholder={EXAMPLE} onChange={(e) => dispatch({ type: 'updateDesign', roomId: room.id, patch: { instructions: e.target.value } })} />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
          {d.instructions.trim() === ''
            ? <button type="button" className="text-forest underline underline-offset-4" onClick={() => dispatch({ type: 'updateDesign', roomId: room.id, patch: { instructions: EXAMPLE } })}>Use the example text</button>
            : <span />}
          <span className="tabular-nums">{d.instructions.length} / {MAX_INSTRUCTIONS}</span>
        </div>
      </Block>

      {line && (
        <Block title="Budget for this room" hint="Comes from the single property budget. You don’t need to set one here.">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[1fr_auto]">
            <dt className="text-ink-soft">Planning estimate</dt>
            <dd className="tabular-nums font-medium text-ink sm:text-right">{formatRange(line.estimate.low, line.estimate.high, line.estimate.openEnded)}</dd>
            <dt className="text-ink-soft">{line.ownAmount ? 'Your amount' : 'Suggested allocation'}</dt>
            <dd className="tabular-nums font-medium text-ink sm:text-right">{line.allocation === null ? 'Set a property budget first' : formatZAR(line.allocation)}</dd>
          </dl>
          {line.status === 'short' && <p className="mt-2 text-sm text-amber">This is below the room’s low estimate.</p>}
          <button type="button" className="mt-3 text-sm font-medium text-forest underline-offset-4 hover:underline" onClick={() => go('estimate')}>Review the property budget split</button>
        </Block>
      )}
    </div>
  )
}
