import type { Route } from '../lib/router'
import { useProject } from '../state/ProjectContext'
import { hasProjectData } from '../state/project'

/** Shows which project the current tool is working on, on every tool page. */
export function ProjectStrip({ go }: { go: (r: Route) => void }) {
  const { project } = useProject()
  if (!hasProjectData(project)) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line bg-card px-5 py-4 text-sm">
        <p className="text-ink-soft">No project yet. Add your property and rooms first, and every tool will use them.</p>
        <button type="button" className="btn-primary" onClick={() => go('project')}>Set up project</button>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ivory px-5 py-3.5 text-sm">
      <p>
        <span className="font-medium text-ink">{project.name || 'Untitled project'}</span>
        {project.isSample && <span className="ml-2 rounded-full bg-sage px-2 py-0.5 text-xs text-forest-deep">Sample data</span>}
        <span className="text-ink-soft">, {project.rooms.length} {project.rooms.length === 1 ? 'room' : 'rooms'}</span>
      </p>
      <button type="button" className="font-medium text-forest underline-offset-4 hover:underline" onClick={() => go('project')}>Edit project</button>
    </div>
  )
}
