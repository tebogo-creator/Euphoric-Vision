/** Formats a whole number of rand as R1,500 (the format used in the brief). */
export function formatZAR(amount: number): string {
  if (!Number.isFinite(amount)) return 'R-'
  const rounded = Math.round(amount)
  const sign = rounded < 0 ? '-' : ''
  return `${sign}R${Math.abs(rounded).toLocaleString('en-US')}`
}

export function formatRange(low: number, high: number, openEnded = false): string {
  return `${formatZAR(low)} to ${formatZAR(high)}${openEnded ? '+' : ''}`
}
