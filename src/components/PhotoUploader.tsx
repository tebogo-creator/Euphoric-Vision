import { useRef, useState, type DragEvent } from 'react'
import { photoRules } from '../lib/config'
import { formatBytes } from '../lib/imageCheck'
import { usePhotos } from '../state/PhotoContext'
import type { Room } from '../state/project'

const ACCEPT = [...photoRules.acceptedTypes, ...photoRules.acceptedExtensions].join(',')

type Feedback = { kind: 'error' | 'success' | 'warning'; text: string } | null

/** Upload, replace and remove the photo for ONE room. */
export function PhotoUploader({ room }: { room: Room }) {
  const photos = usePhotos()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const status = photos.status(room.id)

  const handle = async (file: File | undefined) => {
    if (!file) return
    setBusy(true); setFeedback(null); setConfirmRemove(false)
    const out = await photos.upload(room.id, file)
    setBusy(false)
    if (!out.ok) setFeedback({ kind: 'error', text: out.message })
    else if (out.warning) setFeedback({ kind: 'warning', text: `Photo added to ${room.name}. ${out.warning}` })
    else setFeedback({ kind: 'success', text: `Photo added to ${room.name}.` })
    if (input.current) input.current.value = ''
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 1) { setFeedback({ kind: 'error', text: 'Please drop one photo at a time. Each room has one photo.' }); return }
    handle(files[0])
  }

  const fileInput = (
    <input ref={input} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true"
      data-testid="photo-input" onChange={(e) => handle(e.target.files?.[0])} />
  )

  const feedbackBox = feedback && (
    <p role={feedback.kind === 'error' ? 'alert' : 'status'}
      className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${feedback.kind === 'error' ? 'bg-amber-soft text-amber' : feedback.kind === 'warning' ? 'bg-amber-soft text-ink' : 'bg-sage text-forest-deep'}`}>
      {feedback.text}
    </p>
  )

  if (status === 'ready' && room.photo) {
    return (
      <div className="space-y-3">
        {fileInput}
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-ink-soft">
            <span className="font-medium text-ink">{room.photo.name}</span>
            <span>, {formatBytes(room.photo.size)}, {room.photo.width} × {room.photo.height} px</span>
            <span className="block">{room.photo.remembered ? 'Kept on this device, survives a refresh.' : 'Held until you refresh or close the page.'}</span>
          </p>
          {!confirmRemove ? (
            <div className="flex gap-2">
              <button type="button" className="btn-quiet" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Checking photo…' : 'Replace photo'}</button>
              <button type="button" className="btn-quiet" disabled={busy} onClick={() => setConfirmRemove(true)}>Remove photo</button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-ink">Remove this photo from {room.name}?</span>
              <button type="button" className="btn bg-amber text-white hover:opacity-90"
                onClick={async () => { await photos.remove(room.id); setConfirmRemove(false); setFeedback({ kind: 'success', text: `Photo removed from ${room.name}. Your settings are still here.` }) }}>
                Yes, remove
              </button>
              <button type="button" className="btn-quiet" onClick={() => setConfirmRemove(false)}>Keep it</button>
            </div>
          )}
        </div>
        {feedbackBox}
      </div>
    )
  }

  if (status === 'loading') {
    return <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-line bg-ivory text-sm text-ink-soft" role="status">Bringing back your saved photo…</div>
  }

  return (
    <div className="space-y-3">
      {fileInput}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex aspect-[4/3] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 text-center transition-colors ${dragging ? 'border-forest bg-sage/60' : 'border-line bg-card'}`}
      >
        <svg viewBox="0 0 48 48" className="h-12 w-12 text-forest" aria-hidden="true">
          <rect x="6" y="10" width="36" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="17" cy="20" r="3.5" fill="currentColor" />
          <path d="M8 34l10-10 8 8 5-5 9 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
        {status === 'missing' && room.photo ? (
          <p className="max-w-sm text-sm leading-relaxed text-ink">
            The photo for {room.name} (“{room.photo.name}”) wasn’t kept after the page reloaded. Add it again to carry on. Your settings are safe.
          </p>
        ) : (
          <div>
            <p className="font-display text-2xl font-semibold text-ink">Add a photo of {room.name}</p>
            <p className="mt-1 text-sm text-ink-soft">Drag it here, or choose it from your device. JPG, PNG or WebP, up to {formatBytes(photoRules.maxBytes)}.</p>
          </div>
        )}
        <button type="button" className="btn-primary" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? 'Checking photo…' : 'Choose photo'}
        </button>
        <p className="text-xs text-ink-soft">Your photo stays in this browser. Nothing is uploaded in this stage.</p>
      </div>
      {feedbackBox}
    </div>
  )
}
