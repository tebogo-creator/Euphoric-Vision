import { useState } from 'react'
import { useProject } from '../state/ProjectContext'
import { hasProjectData } from '../state/project'

export function Footer() {
  const { project, dispatch } = useProject()
  const [confirming, setConfirming] = useState(false)
  const [cleared, setCleared] = useState(false)
  return (
    <footer className="border-t border-line bg-ivory">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm text-ink-soft md:grid-cols-[1.4fr_1fr]">
        <div className="max-w-prose space-y-2 leading-relaxed">
          <p className="font-display text-lg text-ink">See the potential in every space.</p>
          <p>AI redesigns are visualisations. They are not measurements, building plans or a promise of how a room will turn out. Costs and income figures are estimates based on assumptions you can see and change.</p>
          <p>Photos stay in this browser until you press Generate redesign and confirm. Then that one photo and its instructions are sent to OpenAI to create the concept.</p>
        </div>
        <div className="md:justify-self-end">
          <p className="font-medium text-ink">Your project</p>
          <p className="mt-1">Saved in this browser only. Clearing also deletes its photos and redesigns.</p>
          {cleared && <p className="mt-3 text-forest" role="status">Project cleared.</p>}
          {!confirming ? (
            <button type="button" className="btn-quiet mt-3" disabled={!hasProjectData(project)}
              onClick={() => { setConfirming(true); setCleared(false) }}>
              Clear project
            </button>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-ink">Delete all project details, photos and redesigns?</span>
              <button type="button" className="btn bg-amber text-white hover:opacity-90"
                onClick={() => { dispatch({ type: 'clear' }); setConfirming(false); setCleared(true) }}>Yes, clear it</button>
              <button type="button" className="btn-quiet" onClick={() => setConfirming(false)}>Keep it</button>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
