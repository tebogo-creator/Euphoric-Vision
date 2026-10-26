import type { Route } from '../lib/router'
import { useProject } from '../state/ProjectContext'
import { usePhotos } from '../state/PhotoContext'
import { useBudget } from '../state/useBudget'

/** The owner's simple path through the whole-property plan, with live progress. */
export function PlanSteps({ go }: { go: (r: Route) => void }) {
  const { project } = useProject()
  const photos = usePhotos()
  const budget = useBudget()
  const n = project.rooms.length
  const withPhotos = project.rooms.filter((r) => photos.status(r.id) === 'ready').length

  const steps: { title: string; done: boolean; note: string; route: Route }[] = [
    { title: 'Set up the property', done: Boolean(project.name && n), note: n ? `${n} ${n === 1 ? 'room' : 'rooms'}` : 'Add the property and its rooms', route: 'project' },
    { title: 'Choose one design direction and level', done: Boolean(project.plan.style), note: project.plan.style ? `Level ${project.plan.defaultLevel} by default` : 'Pick a style for the whole home', route: 'plan' },
    { title: 'Set the total property budget', done: project.plan.totalBudget !== null, note: project.plan.totalBudget !== null ? 'Set' : 'One amount for everything', route: 'plan' },
    { title: 'Upload room photos', done: n > 0 && withPhotos === n, note: n ? `${withPhotos} of ${n} rooms` : 'Add rooms first', route: 'redesign' },
    { title: 'Review room allocations', done: budget.status === 'fits', note: { 'no-rooms': 'Add rooms first', 'no-budget': 'Needs a budget', fits: 'Fits the budget', tight: 'Tight, review it', shortfall: 'Shortfall, review it', overcommitted: 'Over-allocated, review it' }[budget.status], route: 'estimate' },
    { title: 'Prepare for AI redesign and reporting', done: false, note: 'AI redesign connects in Stage 3', route: 'report' },
  ]

  return (
    <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((s, i) => (
        <li key={s.title} className="bg-card">
          <a href={`#${s.route}`} onClick={(e) => { e.preventDefault(); go(s.route) }} className="flex h-full gap-3 px-4 py-4 hover:bg-ivory">
            <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${s.done ? 'bg-forest text-on-forest' : 'bg-ivory text-ink-soft'}`}>
              {s.done ? '✓' : i + 1}
            </span>
            <span>
              <span className="block font-medium text-ink">{s.title}<span className="sr-only">{s.done ? ', done' : ''}</span></span>
              <span className="text-sm text-ink-soft">{s.note}</span>
            </span>
          </a>
        </li>
      ))}
    </ol>
  )
}
