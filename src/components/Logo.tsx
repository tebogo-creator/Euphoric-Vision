/** Euphoric Vision brand mark: an arched doorway with a leaf, a space with potential. */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M6 29V14a10 10 0 0 1 20 0v15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 29h24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 26c0-6 2.5-9.5 6.5-11-0.5 5-2.8 8.6-6.5 11Zm0 0c0-4-1.8-6.4-4.6-7.4 0.3 3.4 2 5.8 4.6 7.4Z" fill="currentColor" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5 whitespace-nowrap text-forest">
      <LogoMark />
      <span className="font-display text-[1.4rem] font-semibold sm:text-2xl leading-none tracking-tight text-ink">
        Euphoric Vision
      </span>
    </span>
  )
}
