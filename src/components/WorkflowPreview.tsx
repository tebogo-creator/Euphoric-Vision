import { useState } from 'react'
import { buildRedesignBrief, generationReadiness } from '../lib/redesignBrief'
import type { PhotoStatus } from '../state/PhotoContext'
import { useProject } from '../state/ProjectContext'
import { useBudget } from '../state/useBudget'
import type { Room } from '../state/project'

/**
 * Shows what Stage 3 will send to the image service for this room: its photo,
 * the shared property brief and the room's own settings. Sends nothing and
 * generates nothing.
 */
export function WorkflowPreview({ room, photoStatus }: { room: Room; photoStatus: PhotoStatus }) {
  const { project } = useProject()
  const budget = useBudget()
  const [open, setOpen] = useState(false)
  const line = budget.lines.find((l) => l.room.id === room.id)
  const brief = buildRedesignBrief(room, project, line)
  const hasPhoto = photoStatus === 'ready'
  const readiness = generationReadiness(room, project, hasPhoto)

  const steps = [
    { label: 'Your photo of this room', state: hasPhoto ? 'done' : 'todo', note: hasPhoto ? room.photo?.name : 'Add a photo first' },
    { label: 'The shared property brief', state: project.plan.style ? 'done' : 'todo', note: project.plan.style ? 'Same for every room in the home' : 'Choose a style in the design plan' },
    { label: 'This room’s settings', state: 'done', note: brief.summary[1].value },
    { label: 'Send photo and instructions to the image service', state: 'later', note: 'Only when you press Generate and confirm the cost' },
    { label: 'Show the redesign in the comparison slider', state: 'later', note: 'Appears in the AI redesign panel above' },
  ] as const

  return (
    <section aria-labelledby="workflow-h" className="rounded-2xl border border-line bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-prose">
          <h2 id="workflow-h" className="h-display text-2xl">What gets sent for this room</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">A check of the request for the room’s planned level. Opening this sends nothing and costs nothing; generating happens only with the Generate button above.</p>
        </div>
        <button type="button" className={open ? 'btn-quiet' : 'btn-primary'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide' : 'Show what gets sent'}
        </button>
      </div>

      {open && (
        <div className="mt-6 space-y-6">
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={s.label} className="flex gap-3 text-sm">
                <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${s.state === 'done' ? 'bg-forest text-on-forest' : s.state === 'todo' ? 'bg-amber-soft text-amber' : 'bg-ivory text-ink-soft'}`}>
                  {s.state === 'done' ? '✓' : i + 1}
                </span>
                <span>
                  <span className="block font-medium text-ink">{s.label}<span className="sr-only">: {s.state === 'done' ? 'ready' : s.state === 'todo' ? 'needed' : 'not available yet'}</span></span>
                  <span className="text-ink-soft">{s.note}</span>
                </span>
              </li>
            ))}
          </ol>
          {readiness.recommended.length > 0 && (
            <p className="rounded-lg bg-amber-soft px-4 py-3 text-sm text-ink">For more consistent results, add {readiness.recommended.join(' and ')}.</p>
          )}
          <dl className="grid gap-x-6 gap-y-3 rounded-xl bg-ivory p-4 text-sm sm:grid-cols-[auto_1fr]">
            {brief.summary.map((row) => (
              <div key={row.label} className="contents">
                <dt className="font-medium text-ink">{row.label}</dt>
                <dd className="text-ink-soft">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="text-sm font-medium text-ink">Instructions the image service will receive with your photo</p>
            <p className="mt-2 whitespace-pre-wrap rounded-xl border border-line bg-paper p-4 text-sm leading-relaxed text-ink" data-testid="brief-text">{brief.text}</p>
            <p className="mt-2 text-sm text-ink-soft">The first part is identical for every room, which is what keeps the home cohesive.</p>
          </div>
        </div>
      )}
    </section>
  )
}
