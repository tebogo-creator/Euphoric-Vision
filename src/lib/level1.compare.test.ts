import { describe, expect, it } from 'vitest'
import { buildRedesignBrief } from './redesignBrief'
import { planBudget } from './budget'
import { ROOM_TYPES, emptyProject, makeRoom, projectReducer, type Project } from '../state/project'

function project(level: 1 | 2 | 3): Project {
  let p = projectReducer(emptyProject, { type: 'update', patch: { name: 'Test house' } })
  p = projectReducer(p, { type: 'updatePlan', patch: { style: 'modern-coastal', colours: ['warm-white', 'sand', 'sea-blue'], materials: ['natural-oak', 'linen'], direction: 'Light and relaxed.', totalBudget: 80000, defaultLevel: level } })
  p = { ...p, rooms: ROOM_TYPES.map((t) => makeRoom(t.label, t.value)) }
  return p
}

describe('Level 1 refinement', () => {
  // Locked wording: Levels 2 and 3 must not change when Level 1 is refined.
  const LOCKED = {
    2: 'Redesign level 2, Upgrade & Improve. Make more substantial improvements such as rugs, curtains, lighting, soft furnishings, accessories, colours, finishes and selected furniture pieces, while keeping the existing layout and useful furniture where practical.',
    3: 'Redesign level 3, Complete Redesign. Explore a more extensive transformation of style, furniture, décor, lighting, colours and finishes, while preserving the room’s architecture, proportions and camera viewpoint.',
  }
  for (const level of [2, 3] as const) {
    it(`Level ${level} instructions are unchanged for every room type`, () => {
      const p = project(level)
      const lines = planBudget(p).lines
      p.rooms.forEach((r, i) => expect(buildRedesignBrief(r, p, lines[i]).text.split('\n')).toContain(LOCKED[level]))
    })
  }
  it('Level 1 is richer, room-aware and still cosmetic', () => {
    const p = project(1)
    const lines = planBudget(p).lines
    p.rooms.forEach((r, i) => {
      const t = buildRedesignBrief(r, p, lines[i]).text
      expect(t).not.toContain('Make small, high-impact styling changes only')
      for (const s of ['accent colours', 'Layer textures', 'plant', 'warm table or floor lamps', 'no new main furniture, cabinetry', 'Shared property brief', 'Modern coastal']) expect(t).toContain(s)
      expect(t).not.toContain('—')
    })
    const bedroom = buildRedesignBrief(p.rooms.find((r) => r.type === 'bedroom')!, p).text
    const kitchen = buildRedesignBrief(p.rooms.find((r) => r.type === 'kitchen')!, p).text
    expect(bedroom).toContain('layered pillows')
    expect(kitchen).toContain('countertops')
  })
  it('Level 1 respects what the owner keeps', () => {
    const p = project(1)
    const room = p.rooms.find((r) => r.type === 'bedroom')!
    expect(buildRedesignBrief(room, p).text).toContain('Keep the existing curtains')
    const noCurtains = projectReducer({ ...p, rooms: [room] }, { type: 'togglePreserve', roomId: room.id, item: 'curtains' })
    expect(buildRedesignBrief(noCurtains.rooms[0], noCurtains).text).toContain('Add or refresh curtains')
  })
})
