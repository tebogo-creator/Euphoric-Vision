import { useState } from 'react'
import type { Route } from '../lib/router'
import { PageHeader } from '../components/PageHeader'
import { useProject } from '../state/ProjectContext'
import { usePhotos } from '../state/PhotoContext'
import { effectiveLevel, isException } from '../state/project'
import { PlanSteps } from '../components/PlanSteps'
import { ROOM_TYPES, roomTypeLabel, type RoomType } from '../state/project'

const toNum = (v: string): number | null => {
  if (v.trim() === '') return null
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function ProjectPage({ go }: { go: (r: Route) => void }) {
  const { project, dispatch, savedLocally } = useProject()
  const photos = usePhotos()
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [roomName, setRoomName] = useState('')
  const [roomType, setRoomType] = useState<RoomType>('bedroom')

  const addRoom = () => {
    if (!roomName.trim()) return
    dispatch({ type: 'addRoom', name: roomName, roomType })
    setRoomName('')
  }

  const numField = (key: 'bedrooms' | 'bathrooms' | 'guestCapacity', label: string) => (
    <label className="field-label">
      {label}
      <input className="field" type="number" min={0} inputMode="numeric" placeholder="Leave blank if unsure"
        value={project[key] ?? ''} onChange={(e) => dispatch({ type: 'update', patch: { [key]: toNum(e.target.value) } })} />
    </label>
  )

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <PageHeader title="Your property">
        <p>Start with the basics. You can leave anything blank and come back later. Every tool reads from here.</p>
      </PageHeader>
      <p className="mt-4 text-sm" role="status">
        {savedLocally
          ? <span className="text-forest">Changes save automatically in this browser.</span>
          : <span className="text-amber">This browser is blocking storage, so changes will be lost if you refresh.</span>}
        {project.isSample && <span className="ml-2 text-ink-soft">You’re looking at fictional sample data.</span>}
      </p>

      <section aria-labelledby="steps-h" className="mt-8">
        <h2 id="steps-h" className="h-display text-2xl">Your plan, step by step</h2>
        <div className="mt-4"><PlanSteps go={go} /></div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="details-h" className="rounded-2xl border border-line bg-card p-6">
          <h2 id="details-h" className="h-display text-2xl">Property details</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="field-label sm:col-span-2">
              Project name
              <input className="field" value={project.name} placeholder="For example, Beach cottage"
                onChange={(e) => dispatch({ type: 'update', patch: { name: e.target.value } })} />
            </label>
            <label className="field-label">
              Location
              <input className="field" value={project.location} placeholder="Town or suburb"
                onChange={(e) => dispatch({ type: 'update', patch: { location: e.target.value } })} />
            </label>
            <label className="field-label">
              Property type
              <input className="field" value={project.propertyType} placeholder="For example, Holiday home"
                list="property-types" onChange={(e) => dispatch({ type: 'update', patch: { propertyType: e.target.value } })} />
              <datalist id="property-types">
                {['Holiday home', 'House', 'Apartment', 'Townhouse', 'Guesthouse', 'Cottage'].map((t) => <option key={t} value={t} />)}
              </datalist>
            </label>
            {numField('bedrooms', 'Bedrooms')}
            {numField('bathrooms', 'Bathrooms')}
            {numField('guestCapacity', 'Guests it sleeps')}
            <label className="field-label sm:col-span-2">
              Notes
              <textarea className="field min-h-[96px]" value={project.notes} placeholder="Anything worth remembering about the property"
                onChange={(e) => dispatch({ type: 'update', patch: { notes: e.target.value } })} />
            </label>
          </div>
        </section>

        <section aria-labelledby="rooms-h">
          <h2 id="rooms-h" className="h-display text-2xl">Rooms to work on</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">Add each space you might improve. You’ll redesign and cost them one at a time.</p>
          <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={(e) => { e.preventDefault(); addRoom() }}>
            <label className="field-label">
              Room name
              <input className="field" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="For example, Main bedroom" />
            </label>
            <div>
              <label className="field-label" htmlFor="room-type">Room type</label>
              <select id="room-type" className="field" value={roomType} onChange={(e) => setRoomType(e.target.value as RoomType)}>
                {ROOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary sm:col-span-2" disabled={!roomName.trim()}>Add room</button>
          </form>

          {project.rooms.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-line px-5 py-6 text-sm text-ink-soft">No rooms yet. Add the first space you’d like to improve.</p>
          ) : (
            <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-card">
              {project.rooms.map((r) => {
                const st = photos.status(r.id)
                return (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <span>
                      <span className="block font-medium text-ink">{r.name}</span>
                      <span className="text-sm text-ink-soft">
                        {roomTypeLabel(r.type)}, Level {effectiveLevel(r, project.plan)}{isException(r) ? ' (own setting)' : ''}, {st === 'ready' ? 'photo added' : st === 'missing' ? 'photo needs re-adding' : 'no photo yet'}
                      </span>
                    </span>
                    {confirmRemove === r.id ? (
                      <span className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-ink">Remove {r.name} and its photo?</span>
                        <button type="button" className="btn bg-amber px-3 py-1.5 text-white" onClick={() => { dispatch({ type: 'removeRoom', id: r.id }); setConfirmRemove(null) }}>Remove</button>
                        <button type="button" className="btn-quiet px-3 py-1.5" onClick={() => setConfirmRemove(null)}>Keep</button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-4 text-sm">
                        <button type="button" className="font-medium text-forest underline-offset-4 hover:underline"
                          onClick={() => { dispatch({ type: 'selectRoom', id: r.id }); go('redesign') }}>Open in Redesign</button>
                        <button type="button" className="text-ink-soft underline-offset-4 hover:text-amber hover:underline"
                          onClick={() => setConfirmRemove(r.id)} aria-label={`Remove ${r.name}`}>Remove</button>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
