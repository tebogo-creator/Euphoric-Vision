/**
 * App-wide settings. Planning ranges are preliminary planning assumptions from
 * the project brief, not supplier quotes or guaranteed costs. Stage 5 makes them editable.
 */
export const appConfig = {
  /** Becomes true in Stage 3, when a server-side image API is connected. */
  imageGenerationConfigured: false,
  vatTreatment: 'unknown' as 'included' | 'excluded' | 'unknown',
}

export type LevelId = 1 | 2 | 3

export interface RedesignLevel {
  id: LevelId
  name: string
  summary: string
  keeps: string
  changes: string[]
  range: { low: number; high: number; openEnded: boolean; unit: string }
}

/** Photo upload limits. */
export const photoRules = {
  maxBytes: 15 * 1024 * 1024,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  /** Below this width or height, results may look soft. A warning, not a block. */
  smallEdge: 800,
}

export const redesignLevels: RedesignLevel[] = [
  {
    id: 1,
    name: 'Refresh & Style',
    summary: 'Affordable styling that makes the room warm, layered and inviting: soft furnishings, accent colours, artwork, plants and lighting, keeping your existing furniture.',
    keeps: 'Keeps your main furniture, fixed features, flooring and layout.',
    changes: ['Coordinated linen, cushions and throws, with tasteful accent colours', 'Layered textures, rugs and curtains where needed', 'Artwork, plants and grouped accessories', 'Warm lamp lighting and a tidy, balanced arrangement'],
    range: { low: 1500, high: 8000, openEnded: false, unit: 'per typical bedroom' },
  },
  {
    id: 2,
    name: 'Upgrade & Improve',
    summary: 'More substantial improvements, keeping as much of the existing layout and useful furniture as practical.',
    keeps: 'Keeps the main furniture and the room’s character.',
    changes: ['Rugs, curtains and lighting', 'Soft furnishings and accessories', 'Selected furniture pieces', 'Colours and finishes'],
    range: { low: 8000, high: 30000, openEnded: false, unit: 'per typical bedroom' },
  },
  {
    id: 3,
    name: 'Complete Redesign',
    summary: 'A more extensive transformation of the room’s style, furniture, finishes and overall appearance.',
    keeps: 'Keeps the room’s architecture and proportions.',
    changes: ['New furniture and décor', 'New lighting scheme', 'New colours and finishes'],
    range: { low: 30000, high: 100000, openEnded: true, unit: 'per typical bedroom' },
  },
]

/**
 * Planning factors used to estimate and allocate the property budget.
 * These are preliminary assumptions, shown to the owner, not market data.
 */
export const estimateFactors = {
  /** Relative cost of each room type compared with a typical bedroom. */
  roomType: {
    bedroom: 1, living: 1.3, kitchen: 1.5, bathroom: 0.9, dining: 0.9,
    office: 0.8, patio: 0.9, outdoor: 1, other: 0.8,
  } as Record<string, number>,
  /** Rooms in tired condition usually need more spent on them. */
  condition: { good: 0.85, fair: 1, tired: 1.2 } as Record<string, number>,
  /** At Levels 2 and 3, each furniture item kept lowers the estimate. Level 1 already assumes furniture stays. */
  keptFurnitureDiscount: 0.05,
  maxKeptFurnitureDiscount: 0.25,
  /** Allocations are rounded to this many rand. */
  rounding: 100,
}
