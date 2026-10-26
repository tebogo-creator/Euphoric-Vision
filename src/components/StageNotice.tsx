import type { ReactNode } from 'react'

/** Marks a part of the app that is not built yet, so nothing pretends to work. */
export function StageNotice({ stage, title, children }: { stage: number; title: string; children: ReactNode }) {
  return (
    <aside className="rounded-xl border border-amber/30 bg-amber-soft px-5 py-4 text-sm text-ink" role="note">
      <p className="font-semibold text-amber">Arrives in Stage {stage}: {title}</p>
      <div className="mt-1.5 leading-relaxed text-ink-soft">{children}</div>
    </aside>
  )
}
