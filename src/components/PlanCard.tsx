import type { Route } from '../lib/router'
import { redesignLevels } from '../lib/config'
import { formatZAR } from '../lib/format'
import { useProject } from '../state/ProjectContext'
import { COLOURS, materialLabel, styleLabel } from '../state/project'

/** Compact view of the master design plan, shown above room work. */
export function PlanCard({ go }: { go: (r: Route) => void }) {
  const { project } = useProject()
  const p = project.plan
  const level = redesignLevels.find((l) => l.id === p.defaultLevel)!
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-card px-5 py-4">
      <div className="space-y-1.5 text-sm">
        <p className="font-medium text-ink">Property design plan</p>
        <p className="text-ink-soft">
          {p.style ? styleLabel(p.style) : <span className="text-amber">No style chosen yet</span>}
          {`, Level ${level.id} ${level.name} by default`}
          {p.totalBudget !== null ? `, budget ${formatZAR(p.totalBudget)}` : ', no total budget yet'}
        </p>
        {(p.colours.length > 0 || p.materials.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {p.colours.map((c) => {
              const col = COLOURS.find((x) => x.value === c)
              return col ? <span key={c} title={col.label} className="h-5 w-5 rounded-full border border-black/10" style={{ background: col.hex }}><span className="sr-only">{col.label}</span></span> : null
            })}
            {p.materials.length > 0 && <span className="text-ink-soft">{p.materials.map(materialLabel).join(', ')}</span>}
          </div>
        )}
      </div>
      <button type="button" className="btn-quiet" onClick={() => go('plan')}>Edit design plan</button>
    </div>
  )
}
