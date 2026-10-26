import { describe, expect, it } from 'vitest'
import {
  activeRoom, deserializeProject, effectiveLevel, effectiveStyle, emptyProject, exceptionRooms, hasProjectData,
  projectReducer, type Project, type ProjectAction,
} from './project'
import { formatRange, formatZAR } from '../lib/format'
import { parseHash } from '../lib/router'
import { checkFile } from '../lib/imageCheck'
import { buildRedesignBrief } from '../lib/redesignBrief'
import { estimateRoom, planBudget } from '../lib/budget'

const sample = () => projectReducer(emptyProject, { type: 'loadSample' })
const run = (p: Project, ...actions: ProjectAction[]) => actions.reduce(projectReducer, p)
const photo = { name: 'a.jpg', type: 'image/jpeg', size: 10, width: 100, height: 80, addedAt: 'x', remembered: true }

describe('rooms', () => {
  it('adds, renames and removes rooms', () => {
    let p = run(emptyProject, { type: 'addRoom', name: '  Main bedroom ', roomType: 'bedroom' })
    expect(p.rooms[0].name).toBe('Main bedroom')
    expect(p.activeRoomId).toBe(p.rooms[0].id)
    p = run(p, { type: 'removeRoom', id: p.rooms[0].id })
    expect(p.rooms).toHaveLength(0)
    expect(p.activeRoomId).toBeNull()
  })
  it('sample has bedrooms, living, kitchen and patio', () => {
    const s = sample()
    expect(s.rooms.map((r) => r.name)).toEqual(['Main bedroom', 'Second bedroom', 'Open-plan living', 'Kitchen', 'Covered patio'])
    expect(activeRoom(s)?.name).toBe('Main bedroom')
    expect(hasProjectData(run(s, { type: 'clear' }))).toBe(false)
  })
})

describe('master design plan', () => {
  it('rooms inherit the plan style and level', () => {
    const p = run(sample(), { type: 'updatePlan', patch: { style: 'modern-coastal', defaultLevel: 2 } })
    p.rooms.forEach((r) => {
      expect(effectiveLevel(r, p.plan)).toBe(2)
      expect(effectiveStyle(r, p.plan)).toBe('modern-coastal')
    })
    expect(exceptionRooms(p)).toHaveLength(0)
  })
  it('a room can be an identified exception, and still follows plan changes for what it did not override', () => {
    let p = run(sample(), { type: 'updatePlan', patch: { style: 'modern-coastal', defaultLevel: 1 } })
    const kitchen = p.rooms[3].id
    p = run(p, { type: 'setRoomLevel', roomId: kitchen, level: 2 }, { type: 'updateDesign', roomId: kitchen, patch: { exceptionReason: 'Worn cupboards' } })
    expect(exceptionRooms(p).map((r) => r.name)).toEqual(['Kitchen'])
    p = run(p, { type: 'updatePlan', patch: { style: 'warm-neutral' } })
    expect(effectiveStyle(p.rooms[3], p.plan)).toBe('warm-neutral')
    expect(effectiveLevel(p.rooms[3], p.plan)).toBe(2)
    expect(effectiveLevel(p.rooms[0], p.plan)).toBe(1)
  })
  it('choosing the plan level again removes the exception', () => {
    let p = sample()
    const id = p.rooms[0].id
    p = run(p, { type: 'setRoomLevel', roomId: id, level: 3 })
    expect(exceptionRooms(p)).toHaveLength(1)
    p = run(p, { type: 'setRoomLevel', roomId: id, level: 1 })
    expect(exceptionRooms(p)).toHaveLength(0)
  })
  it('changing the default to match an exception tidies it away', () => {
    let p = sample()
    const id = p.rooms[0].id
    p = run(p, { type: 'setRoomLevel', roomId: id, level: 2 }, { type: 'updatePlan', patch: { defaultLevel: 2 } })
    expect(p.rooms[0].design.levelOverride).toBeNull()
  })
  it('apply to all rooms resets exceptions but keeps photos, furniture, instructions and amounts', () => {
    let p = sample()
    const id = p.rooms[0].id
    p = run(p,
      { type: 'setRoomLevel', roomId: id, level: 3 },
      { type: 'setRoomStyle', roomId: id, style: 'industrial' },
      { type: 'setPhoto', roomId: id, photo },
      { type: 'togglePreserve', roomId: id, item: 'sofa' },
      { type: 'updateDesign', roomId: id, patch: { instructions: 'Keep the wardrobe' } },
      { type: 'updatePlan', patch: { totalBudget: 50000 } },
      { type: 'setAllocation', roomId: id, amount: 9000 },
    )
    const before = p.rooms[0]
    p = run(p, { type: 'applyPlanToAllRooms' })
    const after = p.rooms[0]
    expect(after.design.levelOverride).toBeNull()
    expect(after.design.styleOverride).toBeNull()
    expect(after.photo).toEqual(before.photo)
    expect(after.design.preserve).toEqual(before.design.preserve)
    expect(after.design.instructions).toBe('Keep the wardrobe')
    expect(after.allocationOverride).toBe(9000)
  })
})

describe('budget planning', () => {
  it('estimates use type, condition and kept furniture', () => {
    const p = sample()
    const bedroom = p.rooms[0]
    expect(estimateRoom(bedroom, 1)).toMatchObject({ low: 1500, high: 8000, expected: 4800 })
    const kitchen = p.rooms[3]
    expect(estimateRoom(kitchen, 1).low).toBe(2300) // 1500 x 1.5 rounded to R100
    const tired = run(p, { type: 'setCondition', roomId: bedroom.id, condition: 'tired' }).rooms[0]
    expect(estimateRoom(tired, 1).high).toBe(9600)
    // Level 2 with 4 furniture items kept: 20% off
    expect(estimateRoom(bedroom, 2).low).toBe(6400)
  })
  it('no budget yet: estimates, no allocations', () => {
    const b = planBudget(sample())
    expect(b.status).toBe('no-budget')
    expect(b.lines.every((l) => l.allocation === null)).toBe(true)
  })
  const reconciles = (p: Project) => {
    const b = planBudget(p)
    expect(b.allocated + b.reserve).toBe(p.plan.totalBudget)
    return b
  }
  it('fits: every room gets its expected estimate, the rest is reserve', () => {
    const b = reconciles(run(sample(), { type: 'updatePlan', patch: { totalBudget: 100000 } }))
    expect(b.status).toBe('fits')
    expect(b.reserve).toBe(100000 - b.totals.expected)
    expect(b.lines.every((l) => l.status === 'covered')).toBe(true)
  })
  it('tight: shared proportionally and adds up exactly', () => {
    const p0 = sample()
    const exp = planBudget(p0).totals.expected
    const low = planBudget(p0).totals.low
    const T = Math.round((exp + low) / 2) + 37 // deliberately awkward number
    const b = reconciles(run(p0, { type: 'updatePlan', patch: { totalBudget: T } }))
    expect(b.status).toBe('tight')
    expect(b.reserve).toBe(0)
    expect(b.suggestions.length).toBeGreaterThan(0)
  })
  it('shortfall: flagged clearly, with suggestions, still reconciles', () => {
    const p = run(sample(), { type: 'updatePlan', patch: { totalBudget: 5000, defaultLevel: 2 } })
    const b = reconciles(p)
    expect(b.status).toBe('shortfall')
    expect(b.shortByLow).toBe(b.totals.low - 5000)
    expect(b.suggestions.join(' ')).toMatch(/default level to Level 1/)
  })
  it('owner amounts are respected and over-allocation is flagged', () => {
    let p = run(sample(), { type: 'updatePlan', patch: { totalBudget: 30000 } })
    p = run(p, { type: 'setAllocation', roomId: p.rooms[0].id, amount: 12000 })
    let b = reconciles(p)
    expect(b.lines[0].allocation).toBe(12000)
    expect(b.lines[0].ownAmount).toBe(true)
    p = run(p, { type: 'setAllocation', roomId: p.rooms[1].id, amount: 25000 })
    b = reconciles(p)
    expect(b.status).toBe('overcommitted')
    expect(b.reserve).toBe(30000 - 37000)
  })
  it('exceptions change the estimate for that room only', () => {
    let p = run(sample(), { type: 'updatePlan', patch: { totalBudget: 60000 } })
    const before = planBudget(p).lines.map((l) => l.estimate.expected)
    p = run(p, { type: 'setRoomLevel', roomId: p.rooms[3].id, level: 2 })
    const after = planBudget(p).lines.map((l) => l.estimate.expected)
    expect(after[3]).toBeGreaterThan(before[3])
    expect([after[0], after[1], after[2], after[4]]).toEqual([before[0], before[1], before[2], before[4]])
  })
})

describe('coherent generation instructions', () => {
  it('every room shares the same property brief, plus its own details', () => {
    let p = run(sample(),
      { type: 'updatePlan', patch: { style: 'modern-coastal', colours: ['warm-white', 'sand'], materials: ['natural-oak'], direction: 'Light and relaxed.', totalBudget: 60000 } })
    p = run(p, { type: 'setRoomLevel', roomId: p.rooms[3].id, level: 2 }, { type: 'updateDesign', roomId: p.rooms[3].id, patch: { instructions: 'New handles.' } })
    const lines = planBudget(p).lines
    const bed = buildRedesignBrief(p.rooms[0], p, lines[0])
    const kit = buildRedesignBrief(p.rooms[3], p, lines[3])
    expect(bed.propertyText).toBe(kit.propertyText)
    expect(bed.propertyText).toContain('Modern coastal')
    expect(bed.propertyText).toContain('Warm white, Sand')
    expect(bed.propertyText).toContain('Natural oak')
    expect(kit.text).toContain('exception to the property’s default Level 1')
    expect(kit.text).toContain('New handles.')
    expect(kit.text).toContain(formatZAR(lines[3].allocation!))
    expect(bed.text).toContain('Bed')
    expect(bed.text + kit.text).not.toContain('—')
  })
})

describe('saved project reading', () => {
  it('round-trips a project', () => {
    const s = run(sample(), { type: 'updatePlan', patch: { style: 'contemporary', colours: ['sand'], totalBudget: 1000 } })
    expect(deserializeProject(JSON.stringify(s))).toEqual(s)
  })
  it('upgrades a Stage 2 project: common level and style become the plan, budgets are added up', () => {
    const room = (id: string, level: number, style: string | null, amount: number | null) => ({
      id, name: id, type: 'bedroom', photo: null,
      design: { level, style, budgetPreference: null, budgetAmount: amount, keepExistingFurniture: true, preserve: ['bed'], otherFurnitureNote: '', instructions: `notes ${id}` },
    })
    const v2 = { version: 2, name: 'Old', location: '', propertyType: '', bedrooms: null, bathrooms: null, guestCapacity: null, notes: '',
      rooms: [room('a', 1, 'modern-coastal', 8000), room('b', 1, 'modern-coastal', null), room('c', 3, 'industrial', 20000)],
      activeRoomId: 'c', rememberPhotos: true, isSample: false, updatedAt: null }
    const p = deserializeProject(JSON.stringify(v2))!
    expect(p.plan).toMatchObject({ style: 'modern-coastal', defaultLevel: 1, totalBudget: 28000 })
    expect(exceptionRooms(p).map((r) => r.id)).toEqual(['c'])
    expect(p.rooms[2].design).toMatchObject({ levelOverride: 3, styleOverride: 'industrial', instructions: 'notes c' })
    expect(p.activeRoomId).toBe('c')
  })
  it('upgrades a Stage 1 project and rejects damaged data', () => {
    const v1 = { version: 1, name: 'Old', location: 'Ballito', propertyType: '', bedrooms: 2, bathrooms: null, guestCapacity: 4, notes: '',
      rooms: [{ id: 'r1', name: 'Main', type: 'bedroom' }], isSample: false, updatedAt: null }
    expect(deserializeProject(JSON.stringify(v1))?.rooms[0].design.levelOverride).toBeNull()
    expect(deserializeProject('not json')).toBeNull()
    expect(deserializeProject(JSON.stringify({ version: 9 }))).toBeNull()
  })
})

describe('photo checks, formatting and navigation', () => {
  it('accepts and rejects files sensibly', () => {
    expect(checkFile({ name: 'room.JPG', type: 'image/jpeg', size: 2_000_000 }).ok).toBe(true)
    expect(checkFile({ name: 'big.jpg', type: 'image/jpeg', size: 20 * 1024 * 1024 }).ok).toBe(false)
    expect(checkFile({ name: 'IMG.HEIC', type: 'image/heic', size: 100 }).ok).toBe(false)
  })
  it('formats rand and parses links', () => {
    expect(formatZAR(1500)).toBe('R1,500')
    expect(formatRange(30000, 100000, true)).toBe('R30,000 to R100,000+')
    expect(parseHash('#plan')).toBe('plan')
    expect(parseHash('#nonsense')).toBe('home')
  })
})
