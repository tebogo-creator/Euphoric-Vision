import type { Route } from '../lib/router'
import { appConfig, estimateFactors, redesignLevels } from '../lib/config'
import { formatRange, formatZAR } from '../lib/format'
import { PageHeader } from '../components/PageHeader'
import { ProjectStrip } from '../components/ProjectStrip'
import { StageNotice } from '../components/StageNotice'
import { BudgetSummary } from '../components/BudgetSummary'
import { Badge, MoneyInput } from '../components/ui'
import { useProject } from '../state/ProjectContext'
import { useBudget } from '../state/useBudget'
import { CONDITIONS, roomTypeLabel } from '../state/project'

const pct = (n: number) => `${Math.round(n * 100)}%`

export function Estimate({ go }: { go: (r: Route) => void }) {
  const { project, dispatch } = useProject()
  const budget = useBudget()
  const n = project.rooms.length
  const vat = { included: 'included', excluded: 'excluded', unknown: 'unknown' }[appConfig.vatTreatment]
  const hasBudget = budget.budget !== null
  const anyOwn = budget.lines.some((l) => l.ownAmount)

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 pt-10">
      <PageHeader title="Estimate Improvement Costs">
        <p>One budget for the whole property, shared across rooms. Estimates use preliminary planning assumptions, not current supplier quotes or guaranteed costs.</p>
      </PageHeader>
      <ProjectStrip go={go} />

      <section aria-labelledby="total-h" className="grid items-start gap-8 rounded-2xl border border-forest/40 bg-card p-5 sm:p-6 lg:grid-cols-[1fr_1.4fr] [&>*]:min-w-0">
        <div>
          <h2 id="total-h" className="h-display text-3xl">Total property budget</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">The one number that controls the plan. Change it here or in the design plan; it’s the same setting.</p>
          <MoneyInput className="mt-4" label="Total improvement budget" value={project.plan.totalBudget}
            onChange={(v) => dispatch({ type: 'updatePlan', patch: { totalBudget: v } })} />
          <p className="mt-3 text-sm text-ink-soft">VAT: {vat}.</p>
        </div>
        <BudgetSummary plan={budget} />
      </section>

      {n > 0 && (
        <section aria-labelledby="split-h">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-prose">
              <h2 id="split-h" className="h-display text-3xl">Room-by-room split</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">Suggested from each room’s level, type, condition and the furniture you’re keeping. Type an amount only if you want to set a room yourself.</p>
            </div>
            {anyOwn && <button type="button" className="btn-quiet" onClick={() => dispatch({ type: 'clearAllocations' })}>Use suggestions for every room</button>}
          </div>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-line text-ink-soft">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Room</th>
                  <th scope="col" className="px-4 py-3 font-medium">Level</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estimate</th>
                  <th scope="col" className="px-4 py-3 font-medium">Expected</th>
                  <th scope="col" className="px-4 py-3 font-medium">Allocation</th>
                  <th scope="col" className="px-4 py-3 font-medium">Against estimate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {budget.lines.map((l) => {
                  const cond = CONDITIONS.find((c) => c.value === l.room.assessment.condition)?.label
                  return (
                    <tr key={l.room.id} className="align-top">
                      <th scope="row" className="px-4 py-4 font-medium text-ink">
                        {l.room.name}
                        <span className="block text-xs font-normal text-ink-soft">{roomTypeLabel(l.room.type)}{cond ? `, ${cond.toLowerCase()} condition` : ''}</span>
                      </th>
                      <td className="px-4 py-4">
                        Level {l.level}
                        <span className="mt-1 block">{l.room.design.levelOverride !== null ? <Badge tone="exception">Room exception</Badge> : <Badge tone="plan">Plan</Badge>}</span>
                      </td>
                      <td className="px-4 py-4 tabular-nums">{formatRange(l.estimate.low, l.estimate.high, l.estimate.openEnded)}</td>
                      <td className="px-4 py-4 tabular-nums">{formatZAR(l.estimate.expected)}</td>
                      <td className="w-48 px-4 py-3">
                        {hasBudget ? (
                          <>
                            <MoneyInput value={l.room.allocationOverride} placeholder={String(l.allocation ?? '')}
                              onChange={(v) => dispatch({ type: 'setAllocation', roomId: l.room.id, amount: v })} />
                            <span className="mt-1 block text-xs text-ink-soft">
                              {l.ownAmount
                                ? <>Your amount. <button type="button" className="text-forest underline underline-offset-2" onClick={() => dispatch({ type: 'setAllocation', roomId: l.room.id, amount: null })}>Use suggestion</button></>
                                : `Suggested: ${formatZAR(l.allocation ?? 0)}`}
                            </span>
                          </>
                        ) : <span className="text-ink-soft">Set a total budget</span>}
                      </td>
                      <td className="px-4 py-4">
                        {l.status === null ? <span className="text-ink-soft">-</span>
                          : l.status === 'covered' ? <Badge tone="plan">Covers expected</Badge>
                            : l.status === 'tight' ? <Badge tone="warn">{formatZAR(l.estimate.expected - (l.allocation ?? 0))} below expected</Badge>
                              : <Badge tone="warn">Below low estimate</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t-2 border-line text-ink">
                <tr>
                  <th scope="row" colSpan={2} className="px-4 py-3 font-medium">All rooms</th>
                  <td className="px-4 py-3 tabular-nums font-medium">{formatRange(budget.totals.low, budget.totals.high, budget.totals.openEnded)}</td>
                  <td className="px-4 py-3 tabular-nums font-medium">{formatZAR(budget.totals.expected)}</td>
                  <td className="px-4 py-3 tabular-nums font-medium">{hasBudget ? formatZAR(budget.allocated) : '-'}</td>
                  <td />
                </tr>
                {hasBudget && (
                  <>
                    <tr>
                      <th scope="row" colSpan={4} className="px-4 py-2 font-normal text-ink-soft">{budget.reserve < 0 ? 'Over-allocated' : 'Unallocated reserve'}</th>
                      <td className={`px-4 py-2 tabular-nums ${budget.reserve < 0 ? 'text-amber' : ''}`}>{budget.reserve < 0 ? `-${formatZAR(-budget.reserve)}` : formatZAR(budget.reserve)}</td>
                      <td />
                    </tr>
                    <tr className="border-t border-line">
                      <th scope="row" colSpan={4} className="px-4 py-3 font-semibold">Total property budget</th>
                      <td className="px-4 py-3 tabular-nums font-semibold">{formatZAR(budget.budget!)}</td>
                      <td />
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>
        </section>
      )}

      <section aria-labelledby="how-h" className="grid gap-8 lg:grid-cols-2 [&>*]:min-w-0">
        <div>
          <h2 id="how-h" className="h-display text-3xl">How estimates are worked out</h2>
          <div className="mt-3 max-w-prose space-y-2 text-sm leading-relaxed text-ink-soft">
            <p>Each room starts from its level’s planning range below, then three adjustments are applied, all of them assumptions you can see:</p>
            <p><span className="font-medium text-ink">Room type.</span> Compared with a typical bedroom: kitchen {estimateFactors.roomType.kitchen}×, living room {estimateFactors.roomType.living}×, patio {estimateFactors.roomType.patio}×, bathroom {estimateFactors.roomType.bathroom}×.</p>
            <p><span className="font-medium text-ink">Condition.</span> Good {estimateFactors.condition.good}×, fair {estimateFactors.condition.fair}×, tired {estimateFactors.condition.tired}×. Unrated rooms count as fair.</p>
            <p><span className="font-medium text-ink">Furniture kept.</span> At Levels 2 and 3, each furniture item you keep lowers the estimate by {pct(estimateFactors.keptFurnitureDiscount)}, up to {pct(estimateFactors.maxKeptFurnitureDiscount)}. Level 1 already assumes furniture stays.</p>
            <p>Expected is the midpoint of low and high. Amounts are rounded to the nearest R{estimateFactors.rounding}.</p>
          </div>
        </div>
        <div>
          <h2 id="ranges-h" className="h-display text-3xl">Preliminary planning ranges</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="border-b border-line text-ink-soft">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Level</th>
                  <th scope="col" className="px-5 py-3 font-medium">Range</th>
                  <th scope="col" className="px-5 py-3 font-medium">Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {redesignLevels.map((l) => (
                  <tr key={l.id}>
                    <th scope="row" className="px-5 py-4 font-medium text-ink">{l.id}. {l.name}</th>
                    <td className="px-5 py-4 tabular-nums">{formatRange(l.range.low, l.range.high, l.range.openEnded)}</td>
                    <td className="px-5 py-4 text-ink-soft">{l.range.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-ink-soft">These are preliminary planning assumptions, not current supplier quotes or guaranteed costs.</p>
        </div>
      </section>

      <StageNotice stage={5} title="the itemised estimator">
        You’ll list items per room with editable quantities and prices, mark what you’re keeping (at no cost), and see materials, labour, delivery and contingency separately. Those itemised totals will then replace the planning estimates in this split.
      </StageNotice>
    </div>
  )
}
