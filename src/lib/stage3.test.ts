import { describe, expect, it } from 'vitest'
import { buildRedesignBrief } from './redesignBrief'
import { planBudget } from './budget'
import { chooseOutputSize } from './imagePrep'
import { costFromUsage, estimateCostUsd } from './aiPricing'
import { deserializeProject, emptyProject, projectReducer, type Project, type ProjectAction, type RedesignResult } from '../state/project'

const run = (p: Project, ...a: ProjectAction[]) => a.reduce(projectReducer, p)
const base = () => run(emptyProject, { type: 'loadSample' },
  { type: 'updatePlan', patch: { style: 'modern-coastal', colours: ['warm-white', 'sand'], materials: ['natural-oak'], direction: 'Light and relaxed.', totalBudget: 60000 } })
const result = (id: string, level: 1 | 2 | 3): RedesignResult => ({ id, level, createdAt: '2026-10-24T10:00:00Z', model: 'gpt-image-2.5-sunburst', quality: 'medium', size: '1536x1024', promptText: 'x', costUsd: 0.06, costIsEstimate: true, remembered: true })

describe('three levels from one photo and one plan', () => {
  it('each level gets distinct instructions, with an identical shared brief', () => {
    const p = base()
    const room = p.rooms[0]
    const line = planBudget(p).lines[0]
    const briefs = ([1, 2, 3] as const).map((l) => buildRedesignBrief(room, p, line, l))
    expect(new Set(briefs.map((b) => b.text)).size).toBe(3)
    expect(new Set(briefs.map((b) => b.propertyText)).size).toBe(1)
    briefs.forEach((b, i) => {
      expect(b.text).toContain(`Redesign level ${i + 1}`)
      expect(b.text).toContain('Modern coastal')
      expect(b.text).toContain('Keep these as they appear in the photo')
      expect(b.text).toContain('Always keep the walls, ceiling, windows, room shape, proportions and camera angle unchanged.')
    })
  })
  it('exploring another level uses that level’s estimate as budget guidance', () => {
    const p = base()
    const t = buildRedesignBrief(p.rooms[0], p, planBudget(p).lines[0], 3).text
    expect(t).toContain('planning estimate for this level')
    expect(t).not.toContain('allocated to this room')
  })
})

describe('results stay with the right room and level', () => {
  it('adds, shows and removes versions without touching other levels or the photo', () => {
    let p = base()
    const id = p.rooms[0].id
    const photo = { name: 'a.jpg', type: 'image/jpeg', size: 10, width: 100, height: 80, addedAt: 'x', remembered: true }
    p = run(p, { type: 'setPhoto', roomId: id, photo },
      { type: 'addResult', roomId: id, result: result('r1', 1) },
      { type: 'addResult', roomId: id, result: result('r2', 2) },
      { type: 'addResult', roomId: id, result: result('r3', 1) })
    expect(p.rooms[0].activeResults).toEqual({ 1: 'r3', 2: 'r2' })
    expect(p.rooms[1].results).toEqual([])
    p = run(p, { type: 'showResult', roomId: id, level: 1, resultId: 'r1' })
    expect(p.rooms[0].activeResults[1]).toBe('r1')
    p = run(p, { type: 'showResult', roomId: id, level: 2, resultId: 'r1' })
    expect(p.rooms[0].activeResults[2]).toBe('r2')
    p = run(p, { type: 'removeResult', roomId: id, resultId: 'r1' })
    expect(p.rooms[0].activeResults).toEqual({ 1: 'r3', 2: 'r2' })
    expect(p.rooms[0].photo).toEqual(photo)
    p = run(p, { type: 'applyPlanToAllRooms' }, { type: 'updatePlan', patch: { style: 'warm-neutral' } })
    expect(p.rooms[0].results.map((r) => r.id)).toEqual(['r2', 'r3'])
  })
  it('saved results survive a save and reload; Stage 2 planning projects upgrade cleanly', () => {
    let p = base()
    p = run(p, { type: 'addResult', roomId: p.rooms[0].id, result: result('r1', 2) }, { type: 'setAiConsent', consent: true })
    const back = deserializeProject(JSON.stringify(p))!
    expect(back).toEqual(p)
    const v3 = { ...JSON.parse(JSON.stringify(base())), version: 3 }
    v3.rooms.forEach((r: any) => { delete r.results; delete r.activeResults })
    delete v3.aiConsent
    const up = deserializeProject(JSON.stringify(v3))!
    expect(up.version).toBe(4)
    expect(up.rooms[0].results).toEqual([])
    expect(up.aiConsent).toBe(false)
    expect(up.plan.style).toBe('modern-coastal')
  })
})

describe('cost and size helpers', () => {
  it('chooses an output shape close to the photo', () => {
    expect(chooseOutputSize(4032, 3024)).toBe('1536x1024')
    expect(chooseOutputSize(3024, 4032)).toBe('1024x1536')
    expect(chooseOutputSize(1000, 1000)).toBe('1024x1024')
  })
  it('estimates cost before, and calculates it after, from token counts', () => {
    expect(estimateCostUsd('1536x1024', 'medium')).toBeCloseTo(0.061, 3)
    expect(estimateCostUsd('1536x1024', 'high')).toBeCloseTo(0.185, 3)
    // 1800 image in x $8 + 300 text in x $5 + 1400 out x $30, per million
    expect(costFromUsage({ input_tokens: 2100, output_tokens: 1400, input_tokens_details: { image_tokens: 1800, text_tokens: 300 } })).toBeCloseTo(0.0579, 4)
    expect(costFromUsage(null)).toBeNull()
  })
})
