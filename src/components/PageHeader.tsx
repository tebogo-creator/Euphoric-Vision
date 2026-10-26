import type { ReactNode } from 'react'

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="max-w-prose">
      <h1 className="h-display text-4xl sm:text-5xl">{title}</h1>
      {children && <div className="mt-3 text-base leading-relaxed text-ink-soft sm:text-lg">{children}</div>}
    </header>
  )
}
