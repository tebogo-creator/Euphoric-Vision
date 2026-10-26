/**
 * The project: everything the owner has told us about one property.
 * Pure logic (no screens), so it can be tested on its own and later saved
 * to Supabase without changing the screens.
 *
 * Version 3 adds a property-wide master design plan and one total budget.
 * Rooms inherit the plan; a room only differs where the owner sets an
 * intentional exception (its own level or style).
 */
import type { LevelId } from '../lib/config'

export type RoomType =
  | 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining'
  | 'office' | 'patio' | 'outdoor' | 'other'

export const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'living', label: 'Living room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'dining', label: 'Dining room' },
  { value: 'office', label: 'Home office' },
  { value: 'patio', label: 'Patio or balcony' },
  { value: 'outdoor', label: 'Outdoor entertainment area' },
  { value: 'other', label: 'Other space' },
]
export const roomTypeLabel = (t: RoomType) => ROOM_TYPES.find((r) => r.value === t)?.label ?? 'Room'

/* ---------- Style, palette and materials ---------- */

export type StyleId =
  | 'modern-coastal' | 'contemporary' | 'warm-neutral' | 'minimalist' | 'luxury-holiday'
  | 'scandinavian' | 'african-contemporary' | 'farmhouse' | 'industrial' | 'preserve'

export const STYLES: { value: StyleId; label: string; hint: string }[] = [
  { value: 'modern-coastal', label: 'Modern coastal', hint: 'Light, airy, natural textures, soft blues and sand tones' },
  { value: 'contemporary', label: 'Contemporary', hint: 'Clean lines, current finishes, restrained colour' },
  { value: 'warm-neutral', label: 'Warm neutral', hint: 'Creams, oatmeal and timber, calm and timeless' },
  { value: 'minimalist', label: 'Minimalist', hint: 'Fewer, better pieces and clear surfaces' },
  { value: 'luxury-holiday', label: 'Luxury holiday home', hint: 'Hotel-quality linen, layered lighting, considered décor' },
  { value: 'scandinavian', label: 'Scandinavian', hint: 'Pale woods, white walls, cosy textiles' },
  { value: 'african-contemporary', label: 'African contemporary', hint: 'Local craft, earthy palette, natural materials' },
  { value: 'farmhouse', label: 'Farmhouse', hint: 'Rustic timber, linen, relaxed comfort' },
  { value: 'industrial', label: 'Industrial', hint: 'Metal, exposed textures, darker accents' },
  { value: 'preserve', label: 'Keep the current style', hint: 'Improve the rooms without changing their character' },
]
export const styleLabel = (s: StyleId | null) => STYLES.find((x) => x.value === s)?.label ?? 'Not chosen'

export const COLOURS: { value: string; label: string; hex: string }[] = [
  { value: 'warm-white', label: 'Warm white', hex: '#F7F3EA' },
  { value: 'ivory', label: 'Ivory', hex: '#EFE7D6' },
  { value: 'sand', label: 'Sand', hex: '#D9C6A5' },
  { value: 'oatmeal', label: 'Oatmeal', hex: '#CDBEA7' },
  { value: 'stone', label: 'Stone grey', hex: '#A7A39A' },
  { value: 'charcoal', label: 'Charcoal', hex: '#3A3A38' },
  { value: 'sage', label: 'Soft sage', hex: '#A9B8A0' },
  { value: 'forest', label: 'Forest green', hex: '#2F4A3A' },
  { value: 'sea-blue', label: 'Sea blue', hex: '#7FA1B3' },
  { value: 'navy', label: 'Navy', hex: '#26364F' },
  { value: 'terracotta', label: 'Terracotta', hex: '#B4673F' },
  { value: 'ochre', label: 'Ochre', hex: '#C79B4A' },
  { value: 'black', label: 'Black accents', hex: '#1E1E1E' },
]
export const MATERIALS: { value: string; label: string }[] = [
  { value: 'natural-oak', label: 'Natural oak' },
  { value: 'light-timber', label: 'Light timber' },
  { value: 'dark-timber', label: 'Dark timber' },
  { value: 'rattan', label: 'Rattan and cane' },
  { value: 'jute', label: 'Woven jute and sisal' },
  { value: 'linen', label: 'Linen' },
  { value: 'cotton', label: 'Crisp cotton' },
  { value: 'wool', label: 'Wool and bouclé' },
  { value: 'stone', label: 'Natural stone' },
  { value: 'marble', label: 'Marble' },
  { value: 'ceramic', label: 'Handmade ceramics' },
  { value: 'brass', label: 'Brushed brass' },
  { value: 'black-metal', label: 'Matte black metal' },
  { value: 'concrete', label: 'Concrete' },
]
export const colourLabel = (v: string) => COLOURS.find((c) => c.value === v)?.label ?? v
export const materialLabel = (v: string) => MATERIALS.find((m) => m.value === v)?.label ?? v

/** Suggested starting points. The owner can change every choice. */
export const STYLE_PRESETS: Record<StyleId, { colours: string[]; materials: string[]; direction: string }> = {
  'modern-coastal': { colours: ['warm-white', 'sand', 'sea-blue', 'stone'], materials: ['natural-oak', 'linen', 'rattan', 'jute'], direction: 'Light, relaxed and airy, with restrained coastal accents rather than themed décor.' },
  contemporary: { colours: ['warm-white', 'stone', 'charcoal', 'ochre'], materials: ['light-timber', 'wool', 'black-metal', 'ceramic'], direction: 'Clean and current, with a few confident accents.' },
  'warm-neutral': { colours: ['ivory', 'oatmeal', 'sand', 'stone'], materials: ['natural-oak', 'linen', 'wool', 'ceramic'], direction: 'Calm, soft and timeless, layered with texture.' },
  minimalist: { colours: ['warm-white', 'stone', 'black'], materials: ['light-timber', 'cotton', 'concrete'], direction: 'Uncluttered and restful, with fewer, better pieces.' },
  'luxury-holiday': { colours: ['warm-white', 'ivory', 'sand', 'forest'], materials: ['cotton', 'linen', 'brass', 'marble'], direction: 'Hotel-quality comfort: crisp linen, layered lighting and considered details.' },
  scandinavian: { colours: ['warm-white', 'stone', 'sage'], materials: ['light-timber', 'wool', 'cotton', 'ceramic'], direction: 'Bright, simple and cosy.' },
  'african-contemporary': { colours: ['ivory', 'terracotta', 'ochre', 'charcoal'], materials: ['dark-timber', 'jute', 'ceramic', 'stone'], direction: 'Warm and grounded, with local craft and natural materials.' },
  farmhouse: { colours: ['ivory', 'oatmeal', 'sage', 'charcoal'], materials: ['dark-timber', 'linen', 'ceramic', 'black-metal'], direction: 'Relaxed, rustic and welcoming.' },
  industrial: { colours: ['stone', 'charcoal', 'black', 'ochre'], materials: ['black-metal', 'concrete', 'dark-timber', 'wool'], direction: 'Robust and characterful, softened with warm textiles.' },
  preserve: { colours: [], materials: [], direction: 'Keep each room’s existing character and lift its presentation.' },
}

/* ---------- What to keep ---------- */

export type PreserveItem =
  | 'bed' | 'headboard' | 'bedsideTables' | 'wardrobe' | 'sofa' | 'chairs' | 'diningTable' | 'cabinets' | 'otherFurniture'
  | 'flooring' | 'windowsDoors' | 'curtains' | 'wallColours' | 'lighting' | 'artwork'

export const FURNITURE_ITEMS: { value: PreserveItem; label: string }[] = [
  { value: 'bed', label: 'Bed' },
  { value: 'headboard', label: 'Headboard' },
  { value: 'bedsideTables', label: 'Bedside tables' },
  { value: 'wardrobe', label: 'Wardrobe' },
  { value: 'sofa', label: 'Sofa' },
  { value: 'chairs', label: 'Chairs' },
  { value: 'diningTable', label: 'Dining table' },
  { value: 'cabinets', label: 'Cabinets and units' },
  { value: 'otherFurniture', label: 'Other existing furniture' },
]
export const FEATURE_ITEMS: { value: PreserveItem; label: string }[] = [
  { value: 'flooring', label: 'Flooring' },
  { value: 'windowsDoors', label: 'Windows and doors' },
  { value: 'curtains', label: 'Curtains' },
  { value: 'wallColours', label: 'Wall colours' },
  { value: 'lighting', label: 'Light fittings' },
  { value: 'artwork', label: 'Artwork' },
]
export const FURNITURE_VALUES = FURNITURE_ITEMS.map((i) => i.value)
const ALL_PRESERVE = [...FURNITURE_VALUES, ...FEATURE_ITEMS.map((i) => i.value)] as string[]
export const preserveLabel = (v: PreserveItem) =>
  [...FURNITURE_ITEMS, ...FEATURE_ITEMS].find((i) => i.value === v)?.label ?? v

export const TYPICAL_FURNITURE: Record<RoomType, PreserveItem[]> = {
  bedroom: ['bed', 'headboard', 'bedsideTables', 'wardrobe'],
  living: ['sofa', 'chairs', 'otherFurniture'],
  dining: ['diningTable', 'chairs', 'cabinets'],
  kitchen: ['cabinets', 'chairs'],
  bathroom: ['cabinets'],
  office: ['chairs', 'cabinets', 'otherFurniture'],
  patio: ['chairs', 'diningTable', 'otherFurniture'],
  outdoor: ['chairs', 'diningTable', 'otherFurniture'],
  other: ['otherFurniture'],
}
const DEFAULT_FEATURES: PreserveItem[] = ['flooring', 'windowsDoors', 'curtains', 'wallColours']

/* ---------- Plan, rooms and project ---------- */

export interface MasterPlan {
  style: StyleId | null
  colours: string[]
  materials: string[]
  direction: string
  defaultLevel: LevelId
  /** One total improvement budget for the whole property, in rand. */
  totalBudget: number | null
}

export const emptyPlan: MasterPlan = { style: null, colours: [], materials: [], direction: '', defaultLevel: 1, totalBudget: null }

export type Condition = 'good' | 'fair' | 'tired'
export const CONDITIONS: { value: Condition; label: string; hint: string }[] = [
  { value: 'good', label: 'Good', hint: 'Presentable, needs light touches' },
  { value: 'fair', label: 'Fair', hint: 'Some wear or dated pieces' },
  { value: 'tired', label: 'Tired', hint: 'Clearly worn, needs the most work' },
]

export interface RoomDesign {
  /** null means "follow the master plan". */
  levelOverride: LevelId | null
  styleOverride: StyleId | null
  exceptionReason: string
  keepExistingFurniture: boolean
  preserve: PreserveItem[]
  otherFurnitureNote: string
  instructions: string
}

export interface RoomAssessment {
  condition: Condition | null
  notes: string
}

export function defaultDesign(type: RoomType): RoomDesign {
  return {
    levelOverride: null,
    styleOverride: null,
    exceptionReason: '',
    keepExistingFurniture: true,
    preserve: [...TYPICAL_FURNITURE[type], ...DEFAULT_FEATURES],
    otherFurnitureNote: '',
    instructions: '',
  }
}

export interface PhotoMeta {
  name: string
  type: string
  size: number
  width: number
  height: number
  addedAt: string
  remembered: boolean
}

/** One AI redesign. The image itself lives in the on-device results store. */
export interface RedesignResult {
  id: string
  level: LevelId
  createdAt: string
  model: string
  quality: 'low' | 'medium' | 'high'
  size: string
  /** The exact instructions sent, so we can tell if settings have changed since. */
  promptText: string
  costUsd: number | null
  costIsEstimate: boolean
  remembered: boolean
}

export interface Room {
  id: string
  name: string
  type: RoomType
  design: RoomDesign
  assessment: RoomAssessment
  /** Owner's own amount for this room. null means "use the suggested allocation". */
  allocationOverride: number | null
  photo: PhotoMeta | null
  /** All AI redesigns for this room, newest last. Originals are never touched. */
  results: RedesignResult[]
  /** Which result is shown for each level. */
  activeResults: Partial<Record<LevelId, string>>
}

export type AiQuality = 'low' | 'medium' | 'high'

export interface Project {
  version: 4
  name: string
  location: string
  propertyType: string
  bedrooms: number | null
  bathrooms: number | null
  guestCapacity: number | null
  notes: string
  plan: MasterPlan
  rooms: Room[]
  activeRoomId: string | null
  rememberPhotos: boolean
  /** The owner has agreed that photos may be sent to the AI provider. */
  aiConsent: boolean
  aiQuality: AiQuality
  isSample: boolean
  updatedAt: string | null
}

export type ProjectDetails = Pick<
  Project,
  'name' | 'location' | 'propertyType' | 'bedrooms' | 'bathrooms' | 'guestCapacity' | 'notes'
>

export const emptyProject: Project = {
  version: 4,
  name: '', location: '', propertyType: '',
  bedrooms: null, bathrooms: null, guestCapacity: null, notes: '',
  plan: emptyPlan,
  rooms: [],
  activeRoomId: null,
  rememberPhotos: true,
  aiConsent: false,
  aiQuality: 'medium',
  isSample: false,
  updatedAt: null,
}

export function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function makeRoom(name: string, type: RoomType): Room {
  return { id: makeId(), name, type, design: defaultDesign(type), assessment: { condition: null, notes: '' }, allocationOverride: null, photo: null, results: [], activeResults: {} }
}

/** Fictional data for exploring the app. Not a real property or real market figures. */
export function sampleProject(): Project {
  const rooms = [
    makeRoom('Main bedroom', 'bedroom'),
    makeRoom('Second bedroom', 'bedroom'),
    makeRoom('Open-plan living', 'living'),
    makeRoom('Kitchen', 'kitchen'),
    makeRoom('Covered patio', 'patio'),
  ]
  return {
    ...emptyProject,
    name: 'Sample holiday home',
    location: 'Fictional coastal town',
    propertyType: 'Holiday home',
    bedrooms: 3, bathrooms: 2, guestCapacity: 6,
    notes: 'This is fictional sample data for exploring Euphoric Vision. Replace it with your own property.',
    rooms,
    activeRoomId: rooms[0].id,
    isSample: true,
    updatedAt: new Date().toISOString(),
  }
}

/* ---------- Effective settings: what a room actually uses ---------- */

export const effectiveLevel = (r: Room, plan: MasterPlan): LevelId => r.design.levelOverride ?? plan.defaultLevel
export const effectiveStyle = (r: Room, plan: MasterPlan): StyleId | null => r.design.styleOverride ?? plan.style
export const isException = (r: Room) => r.design.levelOverride !== null || r.design.styleOverride !== null
export const exceptionRooms = (p: Project) => p.rooms.filter(isException)

/* ---------- Changes ---------- */

export type PlanPatch = Partial<MasterPlan>

export type ProjectAction =
  | { type: 'update'; patch: Partial<ProjectDetails> }
  | { type: 'updatePlan'; patch: PlanPatch }
  | { type: 'applyPlanToAllRooms' }
  | { type: 'addRoom'; name: string; roomType: RoomType }
  | { type: 'renameRoom'; id: string; name: string }
  | { type: 'removeRoom'; id: string }
  | { type: 'selectRoom'; id: string }
  | { type: 'setRoomLevel'; roomId: string; level: LevelId }
  | { type: 'setRoomStyle'; roomId: string; style: StyleId | null }
  | { type: 'followPlan'; roomId: string }
  | { type: 'updateDesign'; roomId: string; patch: Partial<Pick<RoomDesign, 'instructions' | 'otherFurnitureNote' | 'exceptionReason'>> }
  | { type: 'setKeepFurniture'; roomId: string; keep: boolean }
  | { type: 'togglePreserve'; roomId: string; item: PreserveItem }
  | { type: 'setCondition'; roomId: string; condition: Condition | null }
  | { type: 'setAllocation'; roomId: string; amount: number | null }
  | { type: 'clearAllocations' }
  | { type: 'setPhoto'; roomId: string; photo: PhotoMeta | null }
  | { type: 'setRememberPhotos'; remember: boolean }
  | { type: 'markPhotosRemembered'; remembered: boolean; roomIds?: string[] }
  | { type: 'addResult'; roomId: string; result: RedesignResult }
  | { type: 'showResult'; roomId: string; level: LevelId; resultId: string }
  | { type: 'removeResult'; roomId: string; resultId: string }
  | { type: 'markResultsRemembered'; remembered: boolean; resultIds?: string[] }
  | { type: 'setAiConsent'; consent: boolean }
  | { type: 'setAiQuality'; quality: AiQuality }
  | { type: 'loadSample' }
  | { type: 'clear' }

const touch = (p: Project): Project => ({ ...p, updatedAt: new Date().toISOString() })
const mapRoom = (p: Project, id: string, fn: (r: Room) => Room): Project =>
  touch({ ...p, rooms: p.rooms.map((r) => (r.id === id ? fn(r) : r)) })
const withDesign = (r: Room, patch: Partial<RoomDesign>): Room => ({ ...r, design: { ...r.design, ...patch } })

/** An override that now matches the plan is no longer an exception, so drop it. */
function tidyOverrides(rooms: Room[], plan: MasterPlan): Room[] {
  return rooms.map((r) => {
    const lvl = r.design.levelOverride === plan.defaultLevel ? null : r.design.levelOverride
    const sty = r.design.styleOverride !== null && r.design.styleOverride === plan.style ? null : r.design.styleOverride
    if (lvl === r.design.levelOverride && sty === r.design.styleOverride) return r
    return withDesign(r, { levelOverride: lvl, styleOverride: sty, exceptionReason: lvl === null && sty === null ? '' : r.design.exceptionReason })
  })
}

export function projectReducer(state: Project, action: ProjectAction): Project {
  switch (action.type) {
    case 'update':
      return touch({ ...state, ...action.patch })
    case 'updatePlan': {
      const plan = { ...state.plan, ...action.patch }
      return touch({ ...state, plan, rooms: tidyOverrides(state.rooms, plan) })
    }
    case 'applyPlanToAllRooms':
      // Only the level and style exceptions are reset. Photos, furniture, instructions and allocations are untouched.
      return touch({ ...state, rooms: state.rooms.map((r) => withDesign(r, { levelOverride: null, styleOverride: null, exceptionReason: '' })) })
    case 'addRoom': {
      const name = action.name.trim()
      if (!name) return state
      const room = makeRoom(name, action.roomType)
      return touch({ ...state, rooms: [...state.rooms, room], activeRoomId: state.activeRoomId ?? room.id })
    }
    case 'renameRoom': {
      const name = action.name.trim()
      if (!name) return state
      return mapRoom(state, action.id, (r) => ({ ...r, name }))
    }
    case 'removeRoom': {
      const rooms = state.rooms.filter((r) => r.id !== action.id)
      const activeRoomId = state.activeRoomId === action.id ? rooms[0]?.id ?? null : state.activeRoomId
      return touch({ ...state, rooms, activeRoomId })
    }
    case 'selectRoom':
      if (!state.rooms.some((r) => r.id === action.id)) return state
      return { ...state, activeRoomId: action.id }
    case 'setRoomLevel':
      return mapRoom(state, action.roomId, (r) =>
        withDesign(r, { levelOverride: action.level === state.plan.defaultLevel ? null : action.level }))
    case 'setRoomStyle':
      return mapRoom(state, action.roomId, (r) =>
        withDesign(r, { styleOverride: action.style === null || action.style === state.plan.style ? null : action.style }))
    case 'followPlan':
      return mapRoom(state, action.roomId, (r) => withDesign(r, { levelOverride: null, styleOverride: null, exceptionReason: '' }))
    case 'updateDesign':
      return mapRoom(state, action.roomId, (r) => withDesign(r, action.patch))
    case 'setKeepFurniture':
      return mapRoom(state, action.roomId, (r) => {
        const withoutFurniture = r.design.preserve.filter((i) => !FURNITURE_VALUES.includes(i))
        const preserve = action.keep ? [...TYPICAL_FURNITURE[r.type], ...withoutFurniture] : withoutFurniture
        return withDesign(r, { keepExistingFurniture: action.keep, preserve })
      })
    case 'togglePreserve':
      return mapRoom(state, action.roomId, (r) => {
        const has = r.design.preserve.includes(action.item)
        const preserve = has ? r.design.preserve.filter((i) => i !== action.item) : [...r.design.preserve, action.item]
        return withDesign(r, { preserve, keepExistingFurniture: preserve.some((i) => FURNITURE_VALUES.includes(i)) })
      })
    case 'setCondition':
      return mapRoom(state, action.roomId, (r) => ({ ...r, assessment: { ...r.assessment, condition: action.condition } }))
    case 'setAllocation': {
      const a = action.amount
      return mapRoom(state, action.roomId, (r) => ({ ...r, allocationOverride: a === null || !Number.isFinite(a) || a < 0 ? null : Math.round(a) }))
    }
    case 'clearAllocations':
      return touch({ ...state, rooms: state.rooms.map((r) => ({ ...r, allocationOverride: null })) })
    case 'setPhoto':
      return mapRoom(state, action.roomId, (r) => ({ ...r, photo: action.photo }))
    case 'setRememberPhotos':
      return touch({ ...state, rememberPhotos: action.remember })
    case 'markPhotosRemembered':
      return touch({
        ...state,
        rooms: state.rooms.map((r) => (r.photo && (!action.roomIds || action.roomIds.includes(r.id))
          ? { ...r, photo: { ...r.photo, remembered: action.remembered } } : r)),
      })
    case 'addResult':
      return mapRoom(state, action.roomId, (r) => ({
        ...r,
        results: [...r.results, action.result],
        activeResults: { ...r.activeResults, [action.result.level]: action.result.id },
      }))
    case 'showResult':
      return mapRoom(state, action.roomId, (r) =>
        r.results.some((x) => x.id === action.resultId && x.level === action.level)
          ? { ...r, activeResults: { ...r.activeResults, [action.level]: action.resultId } } : r)
    case 'removeResult':
      return mapRoom(state, action.roomId, (r) => {
        const gone = r.results.find((x) => x.id === action.resultId)
        if (!gone) return r
        const results = r.results.filter((x) => x.id !== action.resultId)
        const activeResults = { ...r.activeResults }
        if (activeResults[gone.level] === gone.id) {
          const latest = [...results].reverse().find((x) => x.level === gone.level)
          if (latest) activeResults[gone.level] = latest.id
          else delete activeResults[gone.level]
        }
        return { ...r, results, activeResults }
      })
    case 'markResultsRemembered':
      return touch({
        ...state,
        rooms: state.rooms.map((r) => ({
          ...r,
          results: r.results.map((x) => (!action.resultIds || action.resultIds.includes(x.id) ? { ...x, remembered: action.remembered } : x)),
        })),
      })
    case 'setAiConsent':
      return touch({ ...state, aiConsent: action.consent })
    case 'setAiQuality':
      return touch({ ...state, aiQuality: action.quality })
    case 'loadSample':
      return sampleProject()
    case 'clear':
      return { ...emptyProject }
  }
}

export const activeRoom = (p: Project): Room | undefined =>
  p.rooms.find((r) => r.id === p.activeRoomId) ?? p.rooms[0]

export function hasProjectData(p: Project): boolean {
  return Boolean(
    p.name || p.location || p.propertyType || p.notes || p.rooms.length ||
    p.bedrooms !== null || p.bathrooms !== null || p.guestCapacity !== null ||
    p.plan.style || p.plan.totalBudget !== null,
  )
}

/* ---------- Reading saved data (and upgrading older versions) ---------- */

const isNumOrNull = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v))
const isStr = (v: unknown): v is string => typeof v === 'string'
const ROOM_TYPE_VALUES = ROOM_TYPES.map((r) => r.value) as string[]
const STYLE_VALUES = STYLES.map((s) => s.value) as string[]
const COLOUR_VALUES = COLOURS.map((c) => c.value)
const MATERIAL_VALUES = MATERIALS.map((m) => m.value)
const asLevel = (v: unknown): LevelId | null => (v === 1 || v === 2 || v === 3 ? v : null)
const asStyle = (v: unknown): StyleId | null => (isStr(v) && STYLE_VALUES.includes(v) ? (v as StyleId) : null)
const asMoney = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : null)

/** The value that appears most often (ties go to the first seen). */
function mostCommon<T>(values: T[]): T | null {
  const counts = new Map<T, number>()
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1))
  let best: T | null = null; let n = 0
  counts.forEach((c, v) => { if (c > n) { best = v; n = c } })
  return best
}

function readPreserve(d: any, type: RoomType): PreserveItem[] {
  return Array.isArray(d?.preserve)
    ? d.preserve.filter((i: unknown) => isStr(i) && ALL_PRESERVE.includes(i))
    : defaultDesign(type).preserve
}

function readPhoto(p: any): PhotoMeta | null {
  if (!p || !isStr(p.name) || !isStr(p.type) || typeof p.size !== 'number') return null
  return {
    name: p.name, type: p.type, size: p.size,
    width: typeof p.width === 'number' ? p.width : 0,
    height: typeof p.height === 'number' ? p.height : 0,
    addedAt: isStr(p.addedAt) ? p.addedAt : new Date().toISOString(),
    remembered: Boolean(p.remembered),
  }
}

function readResults(list: unknown): RedesignResult[] {
  if (!Array.isArray(list)) return []
  return list
    .filter((x: any) => x && isStr(x.id) && asLevel(x.level) && isStr(x.createdAt) && isStr(x.promptText))
    .map((x: any) => ({
      id: x.id, level: x.level, createdAt: x.createdAt,
      model: isStr(x.model) ? x.model : 'unknown',
      quality: ['low', 'medium', 'high'].includes(x.quality) ? x.quality : 'medium',
      size: isStr(x.size) ? x.size : '',
      promptText: x.promptText,
      costUsd: typeof x.costUsd === 'number' ? x.costUsd : null,
      costIsEstimate: x.costIsEstimate !== false,
      remembered: Boolean(x.remembered),
    }))
}

/**
 * Safely reads a saved project. Upgrades Stage 1 (v1) and Stage 2 (v2) projects:
 * the most common room level and style become the master plan, rooms that
 * differed become exceptions, and per-room budgets are added up into one total.
 */
export function deserializeProject(raw: string | null): Project | null {
  if (!raw) return null
  try {
    const d = JSON.parse(raw)
    if (!d || ![1, 2, 3, 4].includes(d.version)) return null
    if (![d.name, d.location, d.propertyType, d.notes].every(isStr)) return null
    if (![d.bedrooms, d.bathrooms, d.guestCapacity].every(isNumOrNull)) return null
    if (!Array.isArray(d.rooms)) return null
    const rawRooms = d.rooms.filter((r: any) => r && isStr(r.id) && isStr(r.name) && ROOM_TYPE_VALUES.includes(r.type))

    let plan: MasterPlan
    if (d.version >= 3 && d.plan && typeof d.plan === 'object') {
      plan = {
        style: asStyle(d.plan.style),
        colours: Array.isArray(d.plan.colours) ? d.plan.colours.filter((c: unknown) => isStr(c) && COLOUR_VALUES.includes(c)) : [],
        materials: Array.isArray(d.plan.materials) ? d.plan.materials.filter((m: unknown) => isStr(m) && MATERIAL_VALUES.includes(m)) : [],
        direction: isStr(d.plan.direction) ? d.plan.direction : '',
        defaultLevel: asLevel(d.plan.defaultLevel) ?? 1,
        totalBudget: asMoney(d.plan.totalBudget),
      }
    } else {
      const levels = rawRooms.map((r: any) => asLevel(r.design?.level) ?? 1)
      const styles = rawRooms.map((r: any) => asStyle(r.design?.style)).filter(Boolean) as StyleId[]
      const budgets = rawRooms.map((r: any) => asMoney(r.design?.budgetAmount) ?? 0)
      const total = budgets.reduce((a: number, b: number) => a + b, 0)
      plan = { ...emptyPlan, defaultLevel: mostCommon(levels) ?? 1, style: mostCommon(styles), totalBudget: total > 0 ? total : null }
    }

    const rooms: Room[] = rawRooms.map((r: any) => {
      const dz = r.design ?? {}
      const levelOverride = d.version >= 3 ? asLevel(dz.levelOverride) : asLevel(dz.level)
      const styleOverride = d.version >= 3 ? asStyle(dz.styleOverride) : asStyle(dz.style)
      const results = readResults(r.results)
      const activeResults: Partial<Record<LevelId, string>> = {}
      for (const lvl of [1, 2, 3] as LevelId[]) {
        const want = r.activeResults?.[lvl]
        const pick = results.find((x) => x.id === want && x.level === lvl) ?? [...results].reverse().find((x) => x.level === lvl)
        if (pick) activeResults[lvl] = pick.id
      }
      const base = defaultDesign(r.type)
      return {
        id: r.id, name: r.name, type: r.type,
        design: {
          levelOverride, styleOverride,
          exceptionReason: isStr(dz.exceptionReason) ? dz.exceptionReason : '',
          keepExistingFurniture: typeof dz.keepExistingFurniture === 'boolean' ? dz.keepExistingFurniture : base.keepExistingFurniture,
          preserve: readPreserve(dz, r.type),
          otherFurnitureNote: isStr(dz.otherFurnitureNote) ? dz.otherFurnitureNote : '',
          instructions: isStr(dz.instructions) ? dz.instructions : '',
        },
        assessment: {
          condition: ['good', 'fair', 'tired'].includes(r.assessment?.condition) ? r.assessment.condition : null,
          notes: isStr(r.assessment?.notes) ? r.assessment.notes : '',
        },
        allocationOverride: d.version >= 3 ? asMoney(r.allocationOverride) : null,
        photo: readPhoto(r.photo),
        results,
        activeResults,
      }
    })

    const activeRoomId = rooms.some((r) => r.id === d.activeRoomId) ? d.activeRoomId : rooms[0]?.id ?? null
    return {
      version: 4,
      name: d.name, location: d.location, propertyType: d.propertyType, notes: d.notes,
      bedrooms: d.bedrooms, bathrooms: d.bathrooms, guestCapacity: d.guestCapacity,
      plan,
      rooms: tidyOverrides(rooms, plan),
      activeRoomId,
      rememberPhotos: typeof d.rememberPhotos === 'boolean' ? d.rememberPhotos : true,
      aiConsent: d.aiConsent === true,
      aiQuality: ['low', 'medium', 'high'].includes(d.aiQuality) ? d.aiQuality : 'medium',
      isSample: Boolean(d.isSample),
      updatedAt: isStr(d.updatedAt) ? d.updatedAt : null,
    }
  } catch {
    return null
  }
}
