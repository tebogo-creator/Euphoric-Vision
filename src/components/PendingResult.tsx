/** The honest empty state for the "after" side of the comparison. */
export function PendingResult({ title = 'No redesign yet', body = 'The AI redesign of this photo will appear here once you generate it.' }: { title?: string; body?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-end"
      style={{ background: 'repeating-linear-gradient(135deg, #EFE9DD 0 14px, #E7E0D2 14px 28px)' }}>
      <div className="mr-[6%] w-[40%] max-w-[260px] rounded-xl bg-white/95 p-3 text-left shadow-sm sm:p-4">
        <p className="text-xs font-semibold text-[#2F4A3A] sm:text-sm">{title}</p>
        <p className="mt-1 text-[11px] leading-snug text-[#5F5D58] sm:text-xs">{body}</p>
      </div>
    </div>
  )
}
