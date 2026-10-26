/**
 * Cost information for AI redesigns, in US dollars (OpenAI bills in USD).
 *
 * CONFIRMED (OpenAI pricing page, checked 24 Oct 2026): gpt-image-2.5-sunburst
 * is billed per million tokens: image input $8, image output $30, text input $5.
 *
 * ESTIMATED: OpenAI publishes no flat price per image. The per-image output
 * figures below come from OpenAI's cost calculator as reported by independent
 * pricing trackers in Sept to Oct 2026. Each edit also pays for reading your
 * photo and instructions (about 2 US cents, our estimate).
 * Your OpenAI Usage page always shows the real charge.
 */
export type Quality = 'low' | 'medium' | 'high'
export type OutputSize = '1536x1024' | '1024x1536' | '1024x1024'

export const AI_PRICING = {
  model: 'gpt-image-2.5-sunburst',
  checked: '24 October 2026',
  perMillionUsd: { imageInput: 8, imageOutput: 30, textInput: 5 },
  outputEstimateUsd: {
    '1536x1024': { low: 0.005, medium: 0.041, high: 0.165 },
    '1024x1536': { low: 0.005, medium: 0.041, high: 0.165 },
    '1024x1024': { low: 0.006, medium: 0.053, high: 0.211 },
  } as Record<OutputSize, Record<Quality, number>>,
  inputAllowanceUsd: 0.02,
  /** Assumption for showing rand, not a live exchange rate. */
  zarPerUsdAssumption: 18,
}

export const QUALITY_OPTIONS: { value: Quality; label: string; hint: string }[] = [
  { value: 'medium', label: 'Standard', hint: 'Good detail, faster. Best for comparing levels.' },
  { value: 'high', label: 'High', hint: 'Finest detail, slower, about four times the cost.' },
  { value: 'low', label: 'Draft', hint: 'Quick and rough, for testing only.' },
]

export function estimateCostUsd(size: OutputSize, quality: Quality): number {
  return AI_PRICING.outputEstimateUsd[size][quality] + AI_PRICING.inputAllowanceUsd
}

/** Works out the cost from the token counts OpenAI reports back, when available. */
export function costFromUsage(usage: unknown): number | null {
  const u = usage as { input_tokens?: number; output_tokens?: number; input_tokens_details?: { image_tokens?: number; text_tokens?: number } } | null
  if (!u || typeof u.output_tokens !== 'number') return null
  const p = AI_PRICING.perMillionUsd
  const img = u.input_tokens_details?.image_tokens ?? 0
  const txt = u.input_tokens_details?.text_tokens ?? Math.max(0, (u.input_tokens ?? 0) - img)
  return (img * p.imageInput + txt * p.textInput + u.output_tokens * p.imageOutput) / 1_000_000
}

export const formatUsd = (n: number) => `$${n < 0.1 ? n.toFixed(3) : n.toFixed(2)}`
export const formatUsdWithZar = (n: number) =>
  `${formatUsd(n)} (about R${(n * AI_PRICING.zarPerUsdAssumption).toFixed(2)})`
