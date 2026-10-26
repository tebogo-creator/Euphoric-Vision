/**
 * Writes the instructions Stage 3 will send to the image-editing service with
 * each room's photo. Every room's instructions contain the SAME property-wide
 * brief, so the redesigned rooms look like they belong to one home.
 * Plain, predictable text: no AI is involved in writing it.
 */
import { redesignLevels } from './config'
import { formatRange, formatZAR } from './format'
import { estimateRoom, type BudgetLine } from './budget'
import type { LevelId } from './config'
import {
  STYLES, colourLabel, effectiveLevel, effectiveStyle, isException, materialLabel, preserveLabel, roomTypeLabel,
  type Project, type Room, type RoomType,
} from '../state/project'

/** Levels 2 and 3. Level 1 is written per room by level1Direction below. */
const LEVEL_DIRECTIONS: Record<2 | 3, string> = {
  2: 'Make more substantial improvements such as rugs, curtains, lighting, soft furnishings, accessories, colours, finishes and selected furniture pieces, while keeping the existing layout and useful furniture where practical.',
  3: 'Explore a more extensive transformation of style, furniture, décor, lighting, colours and finishes, while preserving the room’s architecture, proportions and camera viewpoint.',
}

/** What Level 1 styling should focus on in each type of room. */
const LEVEL1_ROOM_FOCUS: Record<RoomType, string> = {
  bedroom: 'beautifully made bed with crisp, coordinated bedding, layered pillows and cushions in two or three sizes, and a textured throw folded at the foot',
  living: 'sofa and chairs dressed with coordinated cushions in mixed textures and a soft throw, plus a styled coffee table',
  dining: 'table styled with a simple centrepiece, coordinated table linen or runner and seat cushions where suitable',
  kitchen: 'tidy, styled countertops with a few grouped items such as a wooden board, a bowl of fruit, a plant and coordinated tea towels, and cushions on any stools or chairs',
  bathroom: 'fresh, neatly folded or hung towels in coordinated colours, a bath mat and a few grouped toiletries, a plant or a candle',
  office: 'tidy, styled desk with a lamp, a few books and a plant, and a cushion or throw on the chair',
  patio: 'outdoor cushions and throws on the existing seating, an outdoor rug, potted plants and lanterns',
  outdoor: 'outdoor cushions on the existing seating, potted plants, an outdoor rug and lanterns or festoon lights',
  other: 'coordinated soft furnishings, a few grouped accessories and plants',
}

/**
 * Level 1, Refresh & Style. Affordable styling that should still look
 * clearly better: warm, layered and inviting, like a stylist dressed the room
 * for a photo shoot, without renovation. Adapts to what the owner is keeping.
 */
export function level1Direction(room: Room): string {
  const keep = room.design.preserve
  const curtains = keep.includes('curtains')
    ? 'keep the existing curtains'
    : 'add or refresh curtains or sheers in a coordinating fabric where the windows look bare or tired'
  const art = keep.includes('artwork')
    ? 'keep the existing artwork and add one or two accessories that complement it'
    : 'add one or two framed artworks at a sensible scale, in colours drawn from the palette'
  const lamps = keep.includes('lighting')
    ? 'add warm table or floor lamps for a welcoming glow, without changing the existing light fittings'
    : 'add warm table or floor lamps, or a simple affordable shade, for a welcoming glow'
  return [
    'Style the room so it looks warm, inviting and professionally styled for holiday guests, as if a stylist dressed it for a photo shoot, but with no renovation.',
    'The result must look clearly more polished and layered than the original, not bare or generic.',
    `Focus on a ${LEVEL1_ROOM_FOCUS[room.type]}.`,
    'Use the property palette deliberately, with one or two tasteful accent colours drawn from it, repeated in cushions, throws, artwork and accessories so the room feels coordinated.',
    'Layer textures such as linen, knit, woven and natural fibres, and add a rug where the floor looks bare.',
    `${curtains[0].toUpperCase()}${curtains.slice(1)}; ${art}; ${lamps}.`,
    'Add a plant or fresh greenery and a few considered accessories grouped in small sets, rather than scattered decorations.',
    'Tidy and balance the arrangement: declutter, straighten and centre items, and make small adjustments for visual balance, without moving or replacing the main furniture.',
    'Keep every change affordable and cosmetic: no new main furniture, cabinetry, flooring, wall finishes, built-ins or structural work, and no luxury hotel makeover. These belong to Levels 2 and 3.',
  ].join(' ')
}

/** The shared brief, identical for every room in the property. */
export function buildPropertyBrief(project: Project): { rows: { label: string; value: string }[]; text: string; isSet: boolean } {
  const p = project.plan
  const style = STYLES.find((s) => s.value === p.style)
  const level = redesignLevels.find((l) => l.id === p.defaultLevel)!
  const rows = [
    { label: 'Style', value: style ? style.label : 'Not chosen' },
    { label: 'Colour palette', value: p.colours.length ? p.colours.map(colourLabel).join(', ') : 'Not chosen' },
    { label: 'Materials and finishes', value: p.materials.length ? p.materials.map(materialLabel).join(', ') : 'Not chosen' },
    { label: 'Atmosphere', value: p.direction.trim() || 'Not described' },
    { label: 'Default level', value: `${level.id}. ${level.name}` },
  ]
  const lines = [
    style ? `Property style: ${style.label} (${style.hint.toLowerCase()}).` : 'Property style: not chosen yet.',
    p.colours.length ? `Colour palette used throughout the home: ${p.colours.map(colourLabel).join(', ')}.` : null,
    p.materials.length ? `Materials and finishes used throughout the home: ${p.materials.map(materialLabel).join(', ')}.` : null,
    p.direction.trim() ? `Overall atmosphere: ${p.direction.trim()}` : null,
  ].filter(Boolean) as string[]
  return { rows, text: lines.join('\n'), isSet: Boolean(style || p.colours.length || p.materials.length || p.direction.trim()) }
}

export interface RedesignBrief {
  summary: { label: string; value: string }[]
  keep: string[]
  propertyText: string
  roomText: string
  text: string
}

/**
 * forLevel lets the owner explore any level for a room (for example Level 3
 * for a room planned at Level 1). Without it, the room's planned level is used.
 */
export function buildRedesignBrief(room: Room, project: Project, budget?: BudgetLine, forLevel?: LevelId): RedesignBrief {
  const plan = project.plan
  const d = room.design
  const plannedLevel = effectiveLevel(room, plan)
  const levelId = forLevel ?? plannedLevel
  const exploring = levelId !== plannedLevel
  const level = redesignLevels.find((l) => l.id === levelId)!
  const style = STYLES.find((s) => s.value === effectiveStyle(room, plan))
  const propertyStyle = STYLES.find((s) => s.value === plan.style)
  const property = buildPropertyBrief(project)
  const keep = d.preserve.map((p) => (p === 'otherFurniture' && d.otherFurnitureNote.trim()
    ? `Other furniture: ${d.otherFurnitureNote.trim()}` : preserveLabel(p)))

  const levelEstimate = estimateRoom(room, levelId)
  const budgetText = exploring
    ? `planning estimate for this level ${formatRange(levelEstimate.low, levelEstimate.high, levelEstimate.openEnded)}`
    : budget && budget.allocation !== null
    ? `about ${formatZAR(budget.allocation)} allocated to this room (planning estimate ${formatRange(budget.estimate.low, budget.estimate.high, budget.estimate.openEnded)})`
    : budget ? `planning estimate ${formatRange(budget.estimate.low, budget.estimate.high, budget.estimate.openEnded)}, no property budget set yet` : ''

  const levelNote = !exploring && d.levelOverride !== null
    ? ` This room is an exception to the property’s default Level ${plan.defaultLevel}${d.exceptionReason.trim() ? ` because: ${d.exceptionReason.trim()}` : ''}.`
    : ''
  const styleLine = d.styleOverride !== null && style
    ? `Style for this room: ${style.label}, instead of the property’s ${propertyStyle?.label ?? 'style'}. Still use the property’s palette and materials so it feels connected to the other rooms.`
    : null

  const roomLines = [
    `Redesign level ${level.id}, ${level.name}.${levelNote} ${levelId === 1 ? level1Direction(room) : LEVEL_DIRECTIONS[levelId]}`,
    styleLine,
    keep.length ? `Keep these as they appear in the photo, in the same position: ${keep.join(', ')}.` : 'The owner has not asked to keep any specific items.',
    'Always keep the walls, ceiling, windows, room shape, proportions and camera angle unchanged.',
    d.instructions.trim() ? `Room-specific instructions: ${d.instructions.trim()}` : null,
    budgetText ? `Budget guide: ${budgetText}. Keep the changes realistic for this amount.` : null,
  ].filter(Boolean) as string[]

  const intro = `Edit the attached photograph of the ${roomTypeLabel(room.type).toLowerCase()} ("${room.name}") in ${project.name.trim() ? `"${project.name.trim()}", ` : ''}a holiday home. This room is part of a whole-property redesign: follow the shared property brief so every room looks like it belongs to the same home.`
  const text = [
    intro,
    '',
    'Shared property brief (the same for every room):',
    property.text,
    '',
    'This room:',
    ...roomLines,
    '',
    'Return a realistic, natural-looking photograph. Do not add text, labels or watermarks.',
  ].join('\n')

  return {
    summary: [
      { label: 'Room', value: `${room.name} (${roomTypeLabel(room.type)})` },
      { label: 'Level', value: `${level.id}. ${level.name}${exploring ? ` (exploring; the room’s plan is Level ${plannedLevel})` : d.levelOverride !== null ? ' (room exception)' : ' (from the plan)'}` },
      { label: 'Style', value: `${style?.label ?? 'Not chosen'}${d.styleOverride !== null ? ' (room exception)' : style ? ' (from the plan)' : ''}` },
      { label: 'Budget', value: exploring ? `Estimate ${formatRange(levelEstimate.low, levelEstimate.high, levelEstimate.openEnded)}` : budget?.allocation != null ? `${formatZAR(budget.allocation)} allocated` : 'No property budget yet' },
      { label: 'Keep', value: keep.length ? keep.join(', ') : 'Nothing specific' },
      { label: 'Room instructions', value: d.instructions.trim() || 'None added' },
    ],
    keep,
    propertyText: property.text,
    roomText: roomLines.join('\n'),
    text,
  }
}

/** Everything Stage 3 needs to request one room's redesign, plus what is missing. */
export function generationReadiness(room: Room, project: Project, hasPhoto: boolean) {
  const needed: string[] = []
  const recommended: string[] = []
  if (!hasPhoto) needed.push('a photo of this room')
  if (!project.plan.style && !room.design.styleOverride) recommended.push('a property style in the design plan')
  if (project.plan.totalBudget === null) recommended.push('a total property budget')
  return { ready: needed.length === 0, needed, recommended, isException: isException(room) }
}
