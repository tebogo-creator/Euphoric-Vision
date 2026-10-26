/**
 * A drawn bedroom used ONLY for demonstration. It is not a photograph and not
 * an AI result. "after" shows a Level 1 refresh: same bed, tables, curtains
 * and floor, with new white linen, cushions, art and a lamp.
 */
export function RoomIllustration({ variant }: { variant: 'before' | 'after' }) {
  const after = variant === 'after'
  return (
    <svg viewBox="0 0 600 420" className="block h-full w-full" role="img"
      aria-label={after ? 'Illustration of the bedroom after a Level 1 refresh' : 'Illustration of the bedroom before changes'}>
      <defs>
        <radialGradient id={`glow-${variant}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE6B0" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFE6B0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`light-${variant}`} x1="0" x2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={after ? 0.35 : 0.15} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* wall and floor (kept) */}
      <rect width="600" height="310" fill={after ? '#ECE5D7' : '#E2D9CA'} />
      <rect y="300" width="600" height="120" fill="#B98F63" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line key={i} x1={i * 100 - 20} y1="300" x2={i * 100 - 60} y2="420" stroke="#A67C52" strokeWidth="2" />
      ))}
      <rect y="296" width="600" height="8" fill="#F4EFE6" />
      {/* window and curtains (kept) */}
      <rect x="38" y="58" width="124" height="160" fill="#F7F4EE" />
      <rect x="46" y="66" width="108" height="144" fill="#C9DCE2" />
      <line x1="100" y1="66" x2="100" y2="210" stroke="#F7F4EE" strokeWidth="5" />
      <rect x="0" y="0" width="600" height="300" fill={`url(#light-${variant})`} />
      <rect x="22" y="48" width="160" height="5" rx="2" fill="#6B5B4A" />
      <path d="M24 52 h30 v232 q-14 6 -30 0 Z" fill="#A99880" />
      <path d="M146 52 h30 v232 q-14 6 -30 0 Z" fill="#A99880" />
      {/* wall art (added) */}
      {after && (
        <g>
          <rect x="232" y="66" width="62" height="74" fill="#3A3A36" />
          <rect x="237" y="71" width="52" height="64" fill="#FAF8F3" />
          <path d="M244 124 q19 -40 38 0" fill="none" stroke="#2F4A3A" strokeWidth="5" strokeLinecap="round" />
          <circle cx="263" cy="94" r="8" fill="#C79B4A" />
          <rect x="306" y="66" width="62" height="74" fill="#3A3A36" />
          <rect x="311" y="71" width="52" height="64" fill="#FAF8F3" />
          <rect x="320" y="86" width="16" height="38" fill="#9DB1A0" />
          <rect x="339" y="98" width="16" height="26" fill="#2F4A3A" />
        </g>
      )}
      {/* headboard and bed (kept) */}
      <rect x="198" y="152" width="226" height="112" rx="12" fill="#7A6450" />
      <rect x="206" y="160" width="210" height="96" rx="8" fill="#86705B" />
      <rect x="190" y="262" width="242" height="44" rx="4" fill="#6B5747" />
      <rect x="198" y="304" width="10" height="14" fill="#4F4034" />
      <rect x="414" y="304" width="10" height="14" fill="#4F4034" />
      {/* bedding */}
      {after ? (
        <g>
          <rect x="216" y="196" width="88" height="44" rx="10" fill="#FFFFFF" stroke="#E6E1D8" />
          <rect x="318" y="196" width="88" height="44" rx="10" fill="#FFFFFF" stroke="#E6E1D8" />
          <rect x="226" y="212" width="76" height="34" rx="9" fill="#FBFAF7" stroke="#E6E1D8" />
          <rect x="320" y="212" width="76" height="34" rx="9" fill="#FBFAF7" stroke="#E6E1D8" />
          <rect x="278" y="226" width="66" height="24" rx="8" fill="#9DB1A0" />
          <path d="M194 242 h234 v40 q0 10 -10 10 h-214 q-10 0 -10 -10 Z" fill="#FDFCF9" stroke="#E6E1D8" />
          <path d="M210 262 q40 6 80 0 M320 266 q40 6 90 -2" fill="none" stroke="#ECE8E0" strokeWidth="2" />
          <rect x="194" y="270" width="234" height="16" fill="#2F4A3A" />
        </g>
      ) : (
        <g>
          <rect x="226" y="214" width="70" height="26" rx="8" fill="#CBBFAE" />
          <rect x="326" y="218" width="70" height="22" rx="8" fill="#C4B8A6" transform="rotate(4 361 229)" />
          <path d="M194 238 h234 v44 q0 10 -10 10 h-214 q-10 0 -10 -10 Z" fill="#B5A28A" />
          <path d="M214 256 q30 14 60 0 q30 -10 56 6 q34 14 76 -4" fill="none" stroke="#A3907A" strokeWidth="3" />
          <path d="M230 274 q50 -8 110 4" fill="none" stroke="#A3907A" strokeWidth="3" />
        </g>
      )}
      {/* bedside tables (kept) */}
      <rect x="134" y="236" width="52" height="66" rx="3" fill="#8C7360" />
      <line x1="138" y1="268" x2="182" y2="268" stroke="#715C4C" strokeWidth="2" />
      <rect x="436" y="236" width="52" height="66" rx="3" fill="#8C7360" />
      <line x1="440" y1="268" x2="484" y2="268" stroke="#715C4C" strokeWidth="2" />
      {/* bedside styling */}
      {after ? (
        <g>
          <ellipse cx="160" cy="196" rx="70" ry="60" fill={`url(#glow-${variant})`} />
          <rect x="157" y="206" width="6" height="30" fill="#3A3A36" />
          <path d="M144 184 h32 l6 24 h-44 Z" fill="#F6EEDC" />
          <rect x="452" y="214" width="14" height="22" rx="4" fill="#E9E4DA" />
          <path d="M459 214 q-6 -18 4 -30 M459 214 q8 -14 -2 -26" fill="none" stroke="#2F4A3A" strokeWidth="2.5" />
          <rect x="470" y="228" width="12" height="8" fill="#C79B4A" />
        </g>
      ) : (
        <g>
          <rect x="156" y="212" width="6" height="24" fill="#5A4B3E" />
          <path d="M146 196 h26 l4 18 h-34 Z" fill="#D8CFC0" />
          <rect x="440" y="226" width="22" height="10" fill="#E0D6C6" transform="rotate(-6 451 231)" />
          <rect x="446" y="218" width="18" height="9" fill="#CFC3B0" transform="rotate(8 455 222)" />
          <rect x="468" y="222" width="8" height="14" fill="#9A8C7A" />
        </g>
      )}
    </svg>
  )
}
