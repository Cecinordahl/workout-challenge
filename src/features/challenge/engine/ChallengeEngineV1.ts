import { createSeededRandom } from './seededRandom'
import type {
  ChallengeParams,
  DailyPlan,
  DayType,
  GoalType,
  IChallengeEngine,
} from './types'

const PRECISION: Record<GoalType, number> = {
  distance: 0.1,
  time: 1,
}

const HERO_MULTIPLIER_RANGE = [1.4, 1.6] as const
const RECOVERY_MULTIPLIER_RANGE = [0.5, 0.6] as const
const FIRST_DAY_FRACTION = 0.5
const LAST_WEEK_WEIGHT = 0.85
const RAMP_START_WEIGHT = 0.9
const RAMP_END_WEIGHT = 1.05
const SHAPE_JITTER = 0.1
const SHAPE_TAPER = 0.15
const SHAPE_TAPER_RADIUS = 3

/** Splits the challenge into weeks of 7 days; the final week may be shorter. */
function computeWeekLengths(durationDays: number): number[] {
  const lengths: number[] = []
  let remaining = durationDays
  while (remaining > 0) {
    const length = Math.min(7, remaining)
    lengths.push(length)
    remaining -= length
  }
  return lengths
}

/**
 * Weekly difficulty weights, prorated by day count so a short final week
 * doesn't get a full week's share of the total. Weeks gradually ramp from
 * slightly easier to slightly harder, except the final week, which is
 * deliberately eased to improve completion rates.
 */
function computeWeekWeights(weekLengths: number[]): number[] {
  const numWeeks = weekLengths.length
  const lastIndex = numWeeks - 1
  const rampWeeks = numWeeks > 1 ? lastIndex : 1

  const difficultyMultipliers = weekLengths.map((_, i) => {
    if (i === lastIndex && numWeeks > 1) return LAST_WEEK_WEIGHT
    if (rampWeeks <= 1) return RAMP_START_WEIGHT
    const t = i / (rampWeeks - 1)
    return RAMP_START_WEIGHT + t * (RAMP_END_WEIGHT - RAMP_START_WEIGHT)
  })

  return weekLengths.map((length, i) => length * difficultyMultipliers[i]!)
}

function computeWeeklyTargets(
  targetValue: number,
  weekWeights: number[],
): number[] {
  const totalWeight = weekWeights.reduce((sum, w) => sum + w, 0)
  return weekWeights.map((w) => (targetValue * w) / totalWeight)
}

/**
 * Picks the hero day within a week. The day after it is always the recovery
 * day, so the hero index is never the last day of the week. The first week
 * additionally excludes day 0, which is reserved as the achievable "easy
 * start" day. Returns null when the week is too short to fit both.
 */
function pickHeroIndex(
  daysInWeek: number,
  isFirstWeek: boolean,
  random: () => number,
): number | null {
  const minIndex = isFirstWeek ? 1 : 0
  const maxIndex = daysInWeek - 2
  if (minIndex > maxIndex) return null
  return minIndex + Math.floor(random() * (maxIndex - minIndex + 1))
}

/** Relative shape of a week's days: a taper toward the hero/recovery peak-dip, with seeded jitter. */
function computeDayShape(
  daysInWeek: number,
  heroIndex: number | null,
  random: () => number,
): number[] {
  const recoveryIndex = heroIndex === null ? null : heroIndex + 1
  const heroMultiplier =
    HERO_MULTIPLIER_RANGE[0] +
    random() * (HERO_MULTIPLIER_RANGE[1] - HERO_MULTIPLIER_RANGE[0])
  const recoveryMultiplier =
    RECOVERY_MULTIPLIER_RANGE[0] +
    random() * (RECOVERY_MULTIPLIER_RANGE[1] - RECOVERY_MULTIPLIER_RANGE[0])

  const multipliers: number[] = []
  for (let day = 0; day < daysInWeek; day++) {
    if (day === heroIndex) {
      multipliers.push(heroMultiplier)
    } else if (day === recoveryIndex) {
      multipliers.push(recoveryMultiplier)
    } else {
      const distance = heroIndex === null ? 0 : Math.abs(day - heroIndex)
      const taper =
        1 -
        (SHAPE_TAPER * Math.min(distance, SHAPE_TAPER_RADIUS)) /
          SHAPE_TAPER_RADIUS
      const jitter = (random() - 0.5) * SHAPE_JITTER
      multipliers.push(taper + jitter)
    }
  }
  return multipliers
}

function distributeWeekTarget(weeklyTarget: number, shape: number[]): number[] {
  const shapeSum = shape.reduce((sum, m) => sum + m, 0)
  return shape.map((m) => (weeklyTarget * m) / shapeSum)
}

/**
 * Forces day 0 of the whole challenge down to roughly half the first week's
 * average, redistributing the difference across that week's other non-hero,
 * non-recovery days so the week's total is unchanged.
 */
function applyEasyFirstDay(
  weekValues: number[],
  heroIndex: number | null,
): number[] {
  const recoveryIndex = heroIndex === null ? null : heroIndex + 1
  const weekAverage =
    weekValues.reduce((sum, v) => sum + v, 0) / weekValues.length
  const targetDay0 = weekAverage * FIRST_DAY_FRACTION
  const currentDay0 = weekValues[0]!
  if (targetDay0 >= currentDay0) return weekValues

  const deficit = currentDay0 - targetDay0
  const adjustableIndices = weekValues
    .map((_, i) => i)
    .filter((i) => i !== 0 && i !== heroIndex && i !== recoveryIndex)
  if (adjustableIndices.length === 0) return weekValues

  const adjustableSum = adjustableIndices.reduce(
    (sum, i) => sum + weekValues[i]!,
    0,
  )
  const result = [...weekValues]
  result[0] = targetDay0
  for (const i of adjustableIndices) {
    const share = weekValues[i]! / adjustableSum
    result[i] = weekValues[i]! + deficit * share
  }
  return result
}

function roundToPrecision(value: number, precision: number): number {
  const factor = 1 / precision
  return Math.round(value * factor) / factor
}

/**
 * Rounds a sequence of raw (float) values to `precision` using cumulative
 * rounding (a largest-remainder-style method): it tracks the running exact
 * sum vs. the running rounded sum, so the rounded sequence always sums to
 * exactly `round(sum(rawValues), precision)` with no single day absorbing a
 * disproportionate correction.
 */
function roundWithExactSum(rawValues: number[], precision: number): number[] {
  const rounded: number[] = []
  let cumulativeRaw = 0
  let cumulativeRounded = 0
  for (const raw of rawValues) {
    cumulativeRaw += raw
    const roundedCumulative = roundToPrecision(cumulativeRaw, precision)
    rounded.push(
      roundToPrecision(roundedCumulative - cumulativeRounded, precision),
    )
    cumulativeRounded = roundedCumulative
  }
  return rounded
}

/**
 * Clamps every value into [min, max], then — only if clamping introduced a
 * drift from the target sum — redistributes the residual onto unlocked days
 * with spare room. Locked days (day 0, hero, recovery) are only used as a
 * last resort, so clamping never erases the shape of the plan unless there's
 * nowhere else for the residual to go.
 */
function clampAndCorrect(
  values: number[],
  min: number,
  max: number,
  target: number,
  precision: number,
  lockedIndices: Set<number>,
): number[] {
  const clamped = values.map((v) => Math.min(max, Math.max(min, v)))
  const sum = clamped.reduce((s, v) => s + v, 0)
  let residual = roundToPrecision(target - sum, precision)
  if (residual === 0) return clamped

  const result = [...clamped]
  const unlocked = result.map((_, i) => i).filter((i) => !lockedIndices.has(i))
  const pool = unlocked.length > 0 ? unlocked : result.map((_, i) => i)
  const searchOrder = [...pool].sort((a, b) => {
    const roomA = residual > 0 ? max - result[a]! : result[a]! - min
    const roomB = residual > 0 ? max - result[b]! : result[b]! - min
    return roomB - roomA
  })

  for (const i of searchOrder) {
    if (residual === 0) break
    const room = residual > 0 ? max - result[i]! : result[i]! - min
    if (room <= 0) continue
    const adjustment =
      residual > 0 ? Math.min(residual, room) : Math.max(residual, -room)
    result[i] = roundToPrecision(result[i]! + adjustment, precision)
    residual = roundToPrecision(residual - adjustment, precision)
  }
  return result
}

export class ChallengeEngineV1 implements IChallengeEngine {
  readonly version = 'v1'

  generatePlan(params: ChallengeParams): DailyPlan[] {
    const {
      durationDays,
      goalType,
      targetValue,
      dailyMinimum,
      dailyMaximum,
      randomSeed,
    } = params
    const precision = PRECISION[goalType]
    const random = createSeededRandom(randomSeed)

    const weekLengths = computeWeekLengths(durationDays)
    const weekWeights = computeWeekWeights(weekLengths)
    const weeklyTargets = computeWeeklyTargets(targetValue, weekWeights)

    const dayTypes: DayType[] = new Array<DayType>(durationDays).fill('normal')
    const rawValues: number[] = []
    const lockedIndices = new Set<number>()

    let dayCursor = 0
    weekLengths.forEach((length, weekIndex) => {
      const isFirstWeek = weekIndex === 0
      const heroIndex = pickHeroIndex(length, isFirstWeek, random)
      const shape = computeDayShape(length, heroIndex, random)
      let weekValues = distributeWeekTarget(weeklyTargets[weekIndex]!, shape)

      if (isFirstWeek) {
        weekValues = applyEasyFirstDay(weekValues, heroIndex)
        lockedIndices.add(dayCursor)
      }
      if (heroIndex !== null) {
        dayTypes[dayCursor + heroIndex] = 'hero'
        dayTypes[dayCursor + heroIndex + 1] = 'recovery'
        lockedIndices.add(dayCursor + heroIndex)
        lockedIndices.add(dayCursor + heroIndex + 1)
      }

      rawValues.push(...weekValues)
      dayCursor += length
    })

    const roundedTarget = roundToPrecision(targetValue, precision)
    const rounded = roundWithExactSum(rawValues, precision)
    const finalValues = clampAndCorrect(
      rounded,
      dailyMinimum,
      dailyMaximum,
      roundedTarget,
      precision,
      lockedIndices,
    )

    return finalValues.map((value, dayIndex) => ({
      dayIndex,
      value,
      type: dayTypes[dayIndex]!,
    }))
  }
}
