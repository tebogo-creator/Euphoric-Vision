import type { BudgetPlan } from '../lib/budget'
import { formatRange, formatZAR } from '../lib/format'

/** One-glance view of the property budget: what you have, what it may cost, how it is split. */
export function BudgetSummary({ plan, showSuggestions = true }: { plan: BudgetPlan; showSuggestions?: boolean }) {
  if (plan.status === 'no-rooms') return <p className="text-sm text-ink-soft">Add rooms to your project to see estimates.</p>

  const head = {
    'no-budget': { tone: 'bg-ivory text-ink', title: 'No total budget yet', body: 'Enter one amount for the whole property and Euphoric Vision will suggest how to split it.' },
    fits: { tone: 'bg-sage text-forest-deep', title: 'The plan fits your budget', body: plan.reserve > 0 ? `Every room is covered at its expected estimate, with ${formatZAR(plan.reserve)} kept as an unallocated reserve.` : 'Every room is covered at its expected estimate.' },
    tight: { tone: 'bg-amber-soft text-ink', title: 'Tight, but possible', body: `Your budget covers the low estimates but is ${formatZAR(plan.shortByExpected)} below the expected total, so rooms get less than their expected amounts.` },
    shortfall: { tone: 'bg-amber-soft text-ink', title: `Shortfall of ${formatZAR(plan.shortByLow)}`, body: `Even the low estimates add up to more than your budget. The split below shares what you have, but the plan doesn’t fit as it stands.` },
    overcommitted: { tone: 'bg-amber-soft text-ink', title: `Over-allocated by ${formatZAR(-plan.reserve)}`, body: 'The amounts you typed for individual rooms add up to more than the total budget.' },
  }[plan.status]

  const rows: [string, string][] = [
    ['Your total budget', plan.budget === null ? 'Not set' : formatZAR(plan.budget)],
    ['Estimated cost (low to high)', formatRange(plan.totals.low, plan.totals.high, plan.totals.openEnded)],
    ['Expected estimate', formatZAR(plan.totals.expected)],
  ]
  if (plan.budget !== null) {
    rows.push(['Allocated to rooms', formatZAR(plan.allocated)])
    rows.push([plan.reserve < 0 ? 'Over-allocated' : 'Unallocated reserve', formatZAR(Math.abs(plan.reserve))])
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${head.tone}`} role="status">
        <p className="font-semibold">{head.title}</p>
        <p className="mt-0.5">{head.body}</p>
      </div>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[1fr_auto]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink-soft">{k}</dt>
            <dd className="tabular-nums font-medium text-ink sm:text-right">{v}</dd>
          </div>
        ))}
      </dl>
      {plan.budget !== null && plan.status !== 'overcommitted' && (
        <p className="text-xs text-ink-soft">Check: {formatZAR(plan.allocated)} allocated + {formatZAR(plan.reserve)} reserve = {formatZAR(plan.allocated + plan.reserve)}, your total budget.</p>
      )}
      {plan.warnings.map((w) => <p key={w} className="text-sm text-amber">{w}</p>)}
      {showSuggestions && plan.suggestions.length > 0 && (
        <div className="rounded-xl border border-line bg-card px-4 py-3 text-sm">
          <p className="font-medium text-ink">Ways to make it fit</p>
          <ul className="mt-1.5 space-y-1.5 leading-relaxed text-ink-soft">{plan.suggestions.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      )}
      <p className="text-xs leading-relaxed text-ink-soft">Estimates come from preliminary planning ranges, not supplier quotes. Your budget is what you choose to spend; allocations are a suggested split of it.</p>
    </div>
  )
}
