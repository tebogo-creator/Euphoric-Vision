import { useId, type ReactNode } from 'react'

/** Small shared controls, so every page looks and behaves the same. */

export const chipClass = (on: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? 'border-forest bg-forest text-on-forest' : 'border-line bg-card text-ink hover:border-forest'}`

export function Block({ title, hint, children, aside }: { title: string; hint?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={id} className="h-display text-2xl">{title}</h3>
        {aside}
      </div>
      {hint && <div className="mt-1 text-sm leading-relaxed text-ink-soft">{hint}</div>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function MoneyInput({ value, onChange, label, placeholder = 'For example 60000', id, className = '' }: {
  value: number | null; onChange: (v: number | null) => void; label?: string; placeholder?: string; id?: string; className?: string
}) {
  const auto = useId()
  const inputId = id ?? auto
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="field-label">{label}</label>}
      <div className={`relative ${label ? 'mt-1.5' : ''}`}>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">R</span>
        <input id={inputId} className="field mt-0 pl-7 tabular-nums" type="number" inputMode="numeric" min={0} step={500}
          placeholder={placeholder} value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value.trim()
            const n = Math.round(Number(v))
            onChange(v === '' || !Number.isFinite(n) || n < 0 ? null : n)
          }} />
      </div>
    </div>
  )
}

export function Badge({ tone, children }: { tone: 'plan' | 'exception' | 'warn' | 'muted'; children: ReactNode }) {
  const cls = {
    plan: 'bg-sage text-forest-deep',
    exception: 'bg-amber-soft text-amber border border-amber/30',
    warn: 'bg-amber-soft text-amber',
    muted: 'bg-ivory text-ink-soft',
  }[tone]
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>
}
