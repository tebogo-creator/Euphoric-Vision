/**
 * Property budget planning. Plain arithmetic, no AI.
 *
 * 1. Estimate each room: the level's planning range x room type x condition,
 *    less a discount for furniture being kept (Levels 2 and 3 only).
 * 2. Allocate the owner's one total budget across rooms:
 *    - rooms where the owner typed their own amount keep it;
 *    - if the rest covers every other room's expected estimate, each gets its
 *      expected estimate and the remainder is an unallocated reserve;
 *    - otherwise the money is shared in proportion to expected estimates.
 * Rule that always holds: room allocations + reserve = total budget.
 */
import { estimateFactors, redesignLevels, type LevelId } from './config'
import { formatZAR } from './format'
import { FURNITURE_VALUES, effectiveLevel, type MasterPlan, type Project, type Room } from '../state/project'

export const roundTo = (n: number, step = estimateFactors.rounding) => Math.round(n / step) * step

export interface RoomEstimate {
  low: number
  expected: number
  high: number
  openEnded: boolean
  typeFactor: number
  conditionFactor: number
  keptDiscount: number
}

export function estimateRoom(room: Room, level: LevelId): RoomEstimate {
  const range = redesignLevels.find((l) => l.id === level)!.range
  const typeFactor = estimateFactors.roomType[room.type] ?? 1
  const conditionFactor = room.assessment.condition ? estimateFactors.condition[room.assessment.condition] : 1
  const kept = room.design.preserve.filter((i) => FURNITURE_VALUES.includes(i)).length
  const keptDiscount = level === 1 ? 0 : Math.min(kept * estimateFactors.keptFurnitureDiscount, estimateFactors.maxKeptFurnitureDiscount)
  const m = typeFactor * conditionFactor * (1 - keptDiscount)
  const low = roundTo(range.low * m)
  const high = roundTo(range.high * m)
  return { low, high, expected: roundTo((low + high) / 2), openEnded: range.openEnded, typeFactor, conditionFactor, keptDiscount }
}

export type LineStatus = 'covered' | 'tight' | 'short'

export interface BudgetLine {
  room: Room
  level: LevelId
  estimate: RoomEstimate
  /** null when there is no total budget yet. */
  allocation: number | null
  ownAmount: boolean
  status: LineStatus | null
}

export type PlanStatus = 'no-rooms' | 'no-budget' | 'fits' | 'tight' | 'shortfall' | 'overcommitted'

export interface BudgetPlan {
  lines: BudgetLine[]
  totals: { low: number; expected: number; high: number; openEnded: boolean }
  budget: number | null
  allocated: number
  /** Budget left unallocated. Negative only when the owner's own amounts exceed the budget. */
  reserve: number
  status: PlanStatus
  shortByLow: number
  shortByExpected: number
  suggestions: string[]
  warnings: string[]
}

const lineStatus = (alloc: number, e: RoomEstimate): LineStatus =>
  alloc >= e.expected ? 'covered' : alloc >= e.low ? 'tight' : 'short'

export function planBudget(project: Project): BudgetPlan {
  const plan = project.plan
  const base = project.rooms.map((room) => {
    const level = effectiveLevel(room, plan)
    return { room, level, estimate: estimateRoom(room, level) }
  })
  const totals = {
    low: base.reduce((s, l) => s + l.estimate.low, 0),
    expected: base.reduce((s, l) => s + l.estimate.expected, 0),
    high: base.reduce((s, l) => s + l.estimate.high, 0),
    openEnded: base.some((l) => l.estimate.openEnded),
  }
  const T = plan.totalBudget
  const empty = { totals, budget: T, allocated: 0, reserve: 0, shortByLow: 0, shortByExpected: 0, suggestions: [], warnings: [] }

  if (!base.length) return { ...empty, lines: [], status: 'no-rooms' }
  if (T === null) {
    return { ...empty, lines: base.map((b) => ({ ...b, allocation: null, ownAmount: b.room.allocationOverride !== null, status: null })), status: 'no-budget' }
  }

  const alloc = new Map<string, number>()
  const own = base.filter((b) => b.room.allocationOverride !== null)
  const auto = base.filter((b) => b.room.allocationOverride === null)
  own.forEach((b) => alloc.set(b.room.id, b.room.allocationOverride!))
  const ownSum = own.reduce((s, b) => s + b.room.allocationOverride!, 0)
  const available = T - ownSum
  const autoExpected = auto.reduce((s, b) => s + b.estimate.expected, 0)
  let reserve: number

  if (available < 0) {
    auto.forEach((b) => alloc.set(b.room.id, 0))
    reserve = available
  } else if (!auto.length) {
    reserve = available
  } else if (available >= autoExpected) {
    auto.forEach((b) => alloc.set(b.room.id, b.estimate.expected))
    reserve = available - autoExpected
  } else {
    // Share proportionally, round down, then give the leftover to the biggest room so it adds up exactly.
    const weightTotal = autoExpected || auto.length
    let given = 0
    auto.forEach((b) => {
      const w = autoExpected ? b.estimate.expected : 1
      const a = Math.floor((available * w) / weightTotal / estimateFactors.rounding) * estimateFactors.rounding
      alloc.set(b.room.id, a); given += a
    })
    const biggest = [...auto].sort((a, b) => b.estimate.expected - a.estimate.expected)[0]
    alloc.set(biggest.room.id, alloc.get(biggest.room.id)! + (available - given))
    reserve = 0
  }

  const lines: BudgetLine[] = base.map((b) => {
    const a = alloc.get(b.room.id)!
    return { ...b, allocation: a, ownAmount: b.room.allocationOverride !== null, status: lineStatus(a, b.estimate) }
  })
  const allocated = lines.reduce((s, l) => s + (l.allocation ?? 0), 0)

  const status: PlanStatus = available < 0 ? 'overcommitted' : T < totals.low ? 'shortfall' : T < totals.expected ? 'tight' : 'fits'
  const shortByLow = Math.max(0, totals.low - T)
  const shortByExpected = Math.max(0, totals.expected - T)

  const warnings = lines
    .filter((l) => l.ownAmount && l.status === 'short')
    .map((l) => `Your amount for ${l.room.name} (${formatZAR(l.allocation!)}) is below its low estimate of ${formatZAR(l.estimate.low)}.`)

  return { lines, totals, budget: T, allocated, reserve, status, shortByLow, shortByExpected, suggestions: suggest(project, lines, status, totals, T, ownSum), warnings }
}

function suggest(project: Project, lines: BudgetLine[], status: PlanStatus, totals: BudgetPlan['totals'], T: number, ownSum: number): string[] {
  if (status === 'fits') return []
  if (status === 'overcommitted') {
    return [
      `Your own room amounts add up to ${formatZAR(ownSum)}, which is ${formatZAR(ownSum - T)} more than the total budget. Lower one of them, or switch rooms back to suggested amounts.`,
      `Or raise the total budget to at least ${formatZAR(ownSum)}.`,
    ]
  }
  const out: string[] = []
  const plan: MasterPlan = project.plan
  if (plan.defaultLevel > 1) {
    const lower = (plan.defaultLevel - 1) as LevelId
    const followers = lines.filter((l) => l.room.design.levelOverride === null)
    const saving = followers.reduce((s, l) => s + l.estimate.expected - estimateRoom(l.room, lower).expected, 0)
    if (saving > 0) out.push(`Lower the property’s default level to Level ${lower}. That saves about ${formatZAR(saving)} across ${followers.length} ${followers.length === 1 ? 'room' : 'rooms'}.`)
  }
  lines
    .filter((l) => l.room.design.levelOverride !== null && l.level > 1)
    .map((l) => ({ l, saving: l.estimate.expected - estimateRoom(l.room, (l.level - 1) as LevelId).expected }))
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 2)
    .forEach(({ l, saving }) => out.push(`Move ${l.room.name} from Level ${l.level} to Level ${l.level - 1}. That saves about ${formatZAR(saving)}.`))
  const phase = [...lines].filter((l) => l.room.assessment.condition === 'good').sort((a, b) => b.estimate.expected - a.estimate.expected)[0]
  if (phase && lines.length > 1) out.push(`Leave ${phase.room.name} (marked in good condition) for a later phase. That frees about ${formatZAR(phase.estimate.expected)}.`)
  out.push(status === 'shortfall'
    ? `Or raise the total budget to at least ${formatZAR(totals.low)} (the low estimate), or ${formatZAR(totals.expected)} to cover the expected estimate.`
    : `Or raise the total budget to ${formatZAR(totals.expected)} to cover every room’s expected estimate.`)
  return out
}
