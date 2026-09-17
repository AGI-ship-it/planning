import { calculate } from '../domain/calc'
import { DEFAULT_CONFIG, type PlanningConfig } from '../domain/config'
import type { Decision, ForecastRow, Material, RequirementLine } from '../domain/types'
import type { UnitCode } from '../domain/units'
import { MATERIALS } from '../data/seed'

/**
 * Mock API. Every call the app makes goes through this interface, so swapping
 * to the real Databricks / D365 endpoints is a configuration change rather than
 * a rewrite. Signatures mirror the intended production contract.
 */

export interface RunParams {
  readonly units: readonly UnitCode[]
  readonly forecast: readonly ForecastRow[]
  readonly config: PlanningConfig
}

export type RunStageState = 'pending' | 'running' | 'done' | 'failed'

export interface RunStage {
  readonly name: string
  readonly state: RunStageState
}

export interface UnitProgress {
  readonly unit: UnitCode
  readonly state: RunStageState
}

export interface RunStatus {
  readonly runId: string
  readonly state: 'running' | 'complete' | 'failed'
  readonly stages: readonly RunStage[]
  /**
   * Per-unit progress. Requirement (7) on Ram's whiteboard is SIMULTANEOUS
   * UNITS, and BRD FR-16 requires each unit to run independently of the others,
   * so run state is tracked per unit rather than as one global bar.
   */
  readonly units: readonly UnitProgress[]
  readonly startedAt: number
  readonly elapsedMs: number
}

const STAGE_NAMES = [
  'Reading stock on hand',
  'Reading open purchase orders',
  'Building consumption trend',
  'Exploding BOM for one-to-one materials',
  'Applying MOQ and bundle rounding',
  'Building supply schedule',
] as const

interface RunRecord {
  params: RunParams
  startedAt: number
  result: RequirementLine[] | null
}

const runs = new Map<string, RunRecord>()

const TOTAL_MS = 6_000

let counter = 0
const nextId = (): string => `run-${Date.now().toString(36)}-${(counter += 1)}`

export async function startRun(params: RunParams): Promise<{ runId: string }> {
  const runId = nextId()
  runs.set(runId, { params, startedAt: Date.now(), result: null })
  return { runId }
}

export async function getRunStatus(runId: string): Promise<RunStatus> {
  const rec = runs.get(runId)
  if (!rec) throw new Error(`Unknown run ${runId}`)

  const elapsed = Date.now() - rec.startedAt
  const perStage = TOTAL_MS / STAGE_NAMES.length
  const stages: RunStage[] = STAGE_NAMES.map((name, i) => {
    const start = i * perStage
    if (elapsed >= start + perStage) return { name, state: 'done' }
    if (elapsed >= start) return { name, state: 'running' }
    return { name, state: 'pending' }
  })

  // Units progress independently and finish at slightly different times.
  const units: UnitProgress[] = rec.params.units.map((unit, i) => {
    const finishAt = TOTAL_MS * (0.6 + 0.4 * ((i + 1) / rec.params.units.length))
    if (elapsed >= finishAt) return { unit, state: 'done' }
    if (elapsed >= finishAt * 0.15) return { unit, state: 'running' }
    return { unit, state: 'pending' }
  })

  const complete = elapsed >= TOTAL_MS
  if (complete && rec.result === null) {
    rec.result = computeResult(rec.params)
  }

  return {
    runId,
    state: complete ? 'complete' : 'running',
    stages,
    units,
    startedAt: rec.startedAt,
    elapsedMs: elapsed,
  }
}

export async function getRunResult(runId: string): Promise<readonly RequirementLine[]> {
  const rec = runs.get(runId)
  if (!rec) throw new Error(`Unknown run ${runId}`)
  if (rec.result === null) rec.result = computeResult(rec.params)
  return rec.result
}

function computeResult(params: RunParams): RequirementLine[] {
  const byFg = new Map<string, ForecastRow>()
  params.forecast.forEach((f) => byFg.set(f.fgCode, f))
  const cycleStart = new Date()

  return MATERIALS.filter((m) => params.units.includes(m.unit)).map((m) =>
    calculate({
      material: m,
      forecast: m.fgCode ? byFg.get(m.fgCode) : undefined,
      config: params.config,
      cycleStart,
    }),
  )
}

export async function getItemMaster(units: readonly UnitCode[]): Promise<readonly Material[]> {
  return MATERIALS.filter((m) => units.includes(m.unit))
}

export interface DemandOrderLine {
  readonly line: RequirementLine
  readonly decision: Decision
  readonly finalQty: number
  readonly finalValue: number
}

export async function submitDecisions(
  lines: readonly RequirementLine[],
  decisions: readonly Decision[],
): Promise<readonly DemandOrderLine[]> {
  const byCode = new Map(decisions.map((d) => [d.code, d]))
  return lines
    .map((line) => {
      const decision = byCode.get(line.material.code) ?? { code: line.material.code, kind: 'accept' as const }
      if (decision.kind === 'reject') return null
      const finalQty = decision.kind === 'override' ? (decision.overrideQty ?? line.prQty) : line.prQty
      return {
        line,
        decision,
        finalQty,
        finalValue: finalQty * line.material.price,
      }
    })
    .filter((x): x is DemandOrderLine => x !== null && x.finalQty > 0)
}

export const defaultConfig = DEFAULT_CONFIG
