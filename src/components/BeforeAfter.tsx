import { useId, useState, type ReactNode } from 'react'

/**
 * Drag the handle (or use the arrow keys) to compare two images.
 * "aspect" is width divided by height, so a real photo is shown uncropped.
 */
export function BeforeAfter({ before, after, beforeLabel = 'Before', afterLabel = 'After', aspect = 10 / 7, afterTone = 'result' }: {
  before: ReactNode; after: ReactNode; beforeLabel?: string; afterLabel?: string; aspect?: number
  afterTone?: 'result' | 'pending'
}) {
  const [pos, setPos] = useState(50)
  const id = useId()
  return (
    <div className="relative w-full select-none overflow-hidden rounded-2xl bg-ivory shadow-[0_24px_60px_-30px_rgba(31,51,40,0.45)]"
      style={{ aspectRatio: String(aspect) }}>
      <div className="absolute inset-0">{after}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>{before}</div>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -ml-px w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
        <div className="absolute top-1/2 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2F4A3A] shadow-md">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path d="M9 6l-5 6 5 6M15 6l5 6-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#2B2B2A]">{beforeLabel}</span>
      <span className={`pointer-events-none absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${afterTone === 'result' ? 'bg-[#2F4A3A]/90 text-white' : 'bg-white/90 text-[#8A5E16]'}`}>{afterLabel}</span>
      <label htmlFor={id} className="sr-only">Compare before and after</label>
      <input id={id} type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  )
}
