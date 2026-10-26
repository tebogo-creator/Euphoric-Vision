import { useEffect, useState } from 'react'
import { useAi } from '../state/AiContext'

/** Header pill that explains demonstration mode in plain language. */
export function DemoModeNote() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const ai = useAi()
  if (ai.service.state === 'ready') return <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-sage px-3 py-1 text-xs font-medium text-forest-deep"><span className="h-1.5 w-1.5 rounded-full bg-forest" aria-hidden="true" />AI connected</span>
  if (ai.service.state === 'checking') return null
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-amber/40 bg-amber-soft px-3 py-1 text-xs font-medium text-amber hover:border-amber">
        <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
        <span className="sm:hidden">Demo mode</span>
        <span className="hidden sm:inline">Demonstration mode</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="demo-title" onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 text-ink shadow-xl">
            <h2 id="demo-title" className="h-display text-2xl">You’re in demonstration mode</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
              <p>This copy of the app isn’t connected to the AI image service, so it can’t generate redesigns. You can still upload photos and plan every room.</p>
              <p>To generate real redesigns, open your own Euphoric Vision app on Vercel, which keeps your OpenAI key secret. The guide is in SETUP-AI.md.</p>
              <p>The drawn bedroom on the home page is a demonstration. It isn’t a photograph and isn’t an AI result.</p>
              <p>Your project and photos stay in this browser. Nothing is sent anywhere.</p>
            </div>
            <button type="button" className="btn-primary mt-5 w-full" onClick={() => setOpen(false)} autoFocus>Got it</button>
          </div>
        </div>
      )}
    </>
  )
}
