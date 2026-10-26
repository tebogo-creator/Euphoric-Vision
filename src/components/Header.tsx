import type { Route } from '../lib/router'
import { Logo } from './Logo'
import { DemoModeNote } from './DemoModeNote'

export const NAV: { route: Route; label: string }[] = [
  { route: 'project', label: 'Your project' },
  { route: 'plan', label: 'Design plan' },
  { route: 'redesign', label: 'Redesign' },
  { route: 'assess', label: 'Assess' },
  { route: 'estimate', label: 'Costs' },
  { route: 'report', label: 'Reports' },
]

export function Header({ route, go }: { route: Route; go: (r: Route) => void }) {
  const link = (r: Route, label: string, extra = '') => (
    <a key={r} href={`#${r}`} onClick={(e) => { e.preventDefault(); go(r) }}
      aria-current={route === r ? 'page' : undefined}
      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors ${route === r ? 'bg-sage font-medium text-forest-deep' : 'text-ink-soft hover:text-ink'} ${extra}`}>
      {label}
    </a>
  )
  return (
    <header className="sticky z-40 border-b border-line/70 bg-paper/90 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <a href="#" onClick={(e) => { e.preventDefault(); go('home') }} aria-label="Euphoric Vision home"><Logo /></a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">{NAV.map((n) => link(n.route, n.label))}</nav>
        <DemoModeNote />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2.5 md:hidden" aria-label="Main mobile">
        {link('home', 'Home')}
        {NAV.map((n) => link(n.route, n.label))}
      </nav>
    </header>
  )
}
