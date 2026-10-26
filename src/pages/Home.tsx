import type { Route } from '../lib/router'
import { BeforeAfter } from '../components/BeforeAfter'
import { RoomIllustration } from '../components/RoomIllustration'
import { useProject } from '../state/ProjectContext'
import { activeRoom, hasProjectData } from '../state/project'
import { PlanSteps } from '../components/PlanSteps'

const TOOLS: { route: Route; title: string; body: string; status: string }[] = [
  { route: 'redesign', title: 'Redesign My Room', body: 'Upload a photo, choose a level and style, and mark what to keep.', status: 'AI redesign works in your connected app.' },
  { route: 'assess', title: 'Assess My Property', body: 'Check furnishings, linen, amenities and first impressions against a holiday-home checklist.', status: 'Arrives in Stage 4.' },
  { route: 'estimate', title: 'Estimate Improvement Costs', body: 'Set one budget for the whole property and see it shared sensibly across rooms, in rand.', status: 'Budget split working now. Itemised estimator in Stage 5.' },
  { route: 'report', title: 'Generate Investment Report', body: 'Compare the cost of each redesign level with a year of projected rental income.', status: 'Arrives in Stages 6 and 7.' },
]

export function Home({ go }: { go: (r: Route) => void }) {
  const { project, dispatch } = useProject()
  const started = hasProjectData(project)
  const room = activeRoom(project)

  const openSample = () => {
    if (started && !window.confirm(project.isSample ? 'Reset the sample project? Its photos and settings will be cleared.' : 'Replace your current project with the sample project? Its photos and settings will be cleared.')) return
    dispatch({ type: 'loadSample' })
    go('project')
  }

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-[1fr_1.1fr] md:gap-14 md:pt-16">
        <div>
          <h1 className="h-display text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl">See the potential in every space.</h1>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-ink-soft">
            Picture a better room, check how your property presents, cost the changes in rand, and see how they compare with a year of rental income.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn-primary px-6 py-3 text-base" onClick={() => go('project')}>
              {started ? 'Continue your project' : 'Start a project'}
            </button>
            {room ? (
              <button type="button" className="btn-quiet px-6 py-3 text-base" onClick={() => go('redesign')}>Return to {room.name}</button>
            ) : (
              <button type="button" className="btn-quiet px-6 py-3 text-base" onClick={openSample}>Try the sample project</button>
            )}
          </div>
          {room && (
            <button type="button" className="mt-4 text-sm text-ink-soft underline underline-offset-4 hover:text-ink" onClick={openSample}>
              {project.isSample ? 'Reset the sample project' : 'Try the sample project instead'}
            </button>
          )}
        </div>
        <figure>
          <BeforeAfter
            before={<RoomIllustration variant="before" />}
            after={<RoomIllustration variant="after" />}
            beforeLabel="Demonstration: before"
            afterLabel="Demonstration: Level 1"
          />
          <figcaption className="mt-3 text-sm leading-relaxed text-ink-soft">
            Drag to compare. The same bed, tables, curtains and floor, with white linen, cushions, two prints and a lamp. This is a drawing for demonstration, not an AI result.
          </figcaption>
        </figure>
      </section>

      {started && (
        <section className="mx-auto max-w-6xl px-5 pb-14">
          <h2 className="h-display text-3xl">Your plan, step by step</h2>
          <div className="mt-5"><PlanSteps go={go} /></div>
        </section>
      )}

      <section className="border-t border-line bg-ivory/60">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="max-w-prose">
            <h2 className="h-display text-3xl sm:text-4xl">Four tools, one project</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">Each step feeds the next. What you enter about your property is kept as you move between tools.</p>
          </div>
          <ol className="mt-10 divide-y divide-line border-y border-line">
            {TOOLS.map((t, i) => (
              <li key={t.route}>
                <a href={`#${t.route}`} onClick={(e) => { e.preventDefault(); go(t.route) }}
                  className="group grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-1 py-6 sm:grid-cols-[3.5rem_1fr_auto] sm:items-center">
                  <span className="font-display text-3xl text-forest sm:row-span-2 sm:text-4xl" aria-hidden="true">{i + 1}</span>
                  <span className="font-display text-2xl font-semibold text-ink group-hover:text-forest sm:text-[1.7rem]">{t.title}</span>
                  <span className="col-start-2 max-w-prose leading-relaxed text-ink-soft">
                    {t.body} <span className="text-ink-soft/80">{t.status}</span>
                  </span>
                  <span className="col-start-2 mt-2 text-sm font-medium text-forest sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mt-0">Open</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
