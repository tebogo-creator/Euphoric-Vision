import type { Route } from '../lib/router'
import { PageHeader } from '../components/PageHeader'
import { ProjectStrip } from '../components/ProjectStrip'
import { BeforeAfter } from '../components/BeforeAfter'
import { RoomIllustration } from '../components/RoomIllustration'
import { PhotoUploader } from '../components/PhotoUploader'
import { DesignControls } from '../components/DesignControls'
import { WorkflowPreview } from '../components/WorkflowPreview'
import { PlanCard } from '../components/PlanCard'
import { AiRedesignPanel } from '../components/AiRedesignPanel'
import { useProject } from '../state/ProjectContext'
import { usePhotos } from '../state/PhotoContext'
import { activeRoom, effectiveLevel, effectiveStyle, isException, roomTypeLabel, styleLabel } from '../state/project'

export function Redesign({ go }: { go: (r: Route) => void }) {
  const { project, dispatch } = useProject()
  const photos = usePhotos()
  const room = activeRoom(project)

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 pt-10">
      <PageHeader title="Redesign My Room">
        <p>Work on one room at a time. Rooms follow the property design plan, and each keeps its own photo, furniture choices and instructions.</p>
      </PageHeader>
      <ProjectStrip go={go} />
      <PlanCard go={go} />

      {project.rooms.length > 0 && (
        <section aria-labelledby="room-h">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="room-h" className="text-sm font-medium text-ink">Choose a room</h2>
            <button type="button" className="text-sm text-forest underline-offset-4 hover:underline" onClick={() => go('project')}>Add or rename rooms</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="room-h">
            {project.rooms.map((r) => {
              const on = room?.id === r.id
              const st = photos.status(r.id)
              return (
                <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => dispatch({ type: 'selectRoom', id: r.id })}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${on ? 'border-forest bg-forest text-on-forest' : 'border-line bg-card text-ink hover:border-forest'}`}>
                  {r.name}
                  {st === 'ready' && <span className={`rounded-full px-1.5 text-[11px] ${on ? 'bg-on-forest/20' : 'bg-sage text-forest-deep'}`}>photo</span>}
                  {st === 'missing' && <span className={`rounded-full px-1.5 text-[11px] ${on ? 'bg-on-forest/20' : 'bg-amber-soft text-amber'}`}>photo needed</span>}
                  {isException(r) && <span className={`rounded-full px-1.5 text-[11px] ${on ? 'bg-on-forest/20' : 'bg-amber-soft text-amber'}`}>own setting</span>}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {room ? (
        <>
          <div className="rounded-2xl bg-forest px-6 py-5 text-on-forest">
            <p className="text-sm opacity-80">You’re working on</p>
            <p className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{room.name}</p>
            <p className="text-sm opacity-80">
              {roomTypeLabel(room.type)}, Level {effectiveLevel(room, project.plan)}, {styleLabel(effectiveStyle(room, project.plan))}.{' '}
              {isException(room) ? 'This room has its own setting, marked below.' : 'Follows the property design plan.'} Changes save automatically.
            </p>
          </div>

          <AiRedesignPanel key={`ai-${room.id}`} room={room} go={go} />

          <div className="grid items-start gap-10 lg:grid-cols-[1.25fr_1fr] [&>*]:min-w-0">
            <section aria-labelledby="photo-h" className="space-y-4 lg:sticky lg:top-24">
              <h2 id="photo-h" className="h-display text-3xl">Original photo</h2>
              <p className="text-sm leading-relaxed text-ink-soft">The photo every redesign of this room starts from. It’s never changed by the AI.</p>
              <PhotoUploader key={room.id} room={room} />
              <label className="flex items-start gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[rgb(var(--c-forest))]" checked={project.rememberPhotos}
                  onChange={(e) => photos.setRemember(e.target.checked)} />
                <span>
                  <span className="block font-medium text-ink">Remember photos and redesigns on this device</span>
                  <span className="leading-relaxed text-ink-soft">
                    Keeps private copies in this browser so they survive a refresh. Turn it off to forget them when you close the page. Photos are only sent anywhere when you press Generate.
                    {!photos.storageWorks && <span className="block text-amber">This browser is blocking storage, so photos will be lost on refresh.</span>}
                  </span>
                </span>
              </label>
              {photos.status(room.id) !== 'ready' && (
                <details className="rounded-xl border border-line bg-card px-4 py-3 text-sm">
                  <summary className="cursor-pointer font-medium text-ink">See how the comparison will work (demonstration drawing)</summary>
                  <div className="mt-3 space-y-2">
                    <BeforeAfter before={<RoomIllustration variant="before" />} after={<RoomIllustration variant="after" />} beforeLabel="Demo: before" afterLabel="Demo: Level 1" />
                    <p className="text-ink-soft">A drawing, not your room and not an AI result.</p>
                  </div>
                </details>
              )}
            </section>

            <section aria-labelledby="settings-h" className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
              <h2 id="settings-h" className="sr-only">Redesign settings for {room.name}</h2>
              <DesignControls key={room.id} room={room} go={go} />
            </section>
          </div>

          <WorkflowPreview key={`wf-${room.id}`} room={room} photoStatus={photos.status(room.id)} />
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-10 text-center">
          <p className="h-display text-2xl">Add a room to start redesigning</p>
          <p className="mt-2 text-sm text-ink-soft">Each room gets its own photo and settings.</p>
          <button type="button" className="btn-primary mt-5" onClick={() => go('project')}>Add rooms</button>
        </div>
      )}
    </div>
  )
}
