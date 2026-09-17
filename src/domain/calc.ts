import type { PlanningConfig } from './config'
import type {
  ExceptionType,
  ForecastRow,
  Material,
  PrRelease,
  RequirementLine,
  TraceStep,
} from './types'
import { isInScope, resolveLogic } from './rules'

export const mean = (xs: readonly number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length

/** Population standard deviation, matching Excel STDEVP semantics. */
export const stdev = (xs: readonly number[]): number => {
  if (xs.length === 0) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

const lastN = (xs: readonly number[], n: number): readonly number[] =>
  xs.slice(Math.max(0, xs.length - n))

/** Round up to the next whole bundle. Returns null when bundle size is missing. */
export const roundToBundle = (qty: number, bundle: number | null): number | null => {
  if (bundle === null || bundle <= 0) return null
  return Math.ceil(qty / bundle) * bundle
}

export interface CalcInputs {
  readonly material: Material
  readonly forecast?: ForecastRow
  readonly config: PlanningConfig
  /** Anchor date for the cycle; release dates are derived from it. */
  readonly cycleStart: Date
}

export function calculate(input: CalcInputs): RequirementLine {
  const { material: m, forecast, config, cycleStart } = input
  const trace: TraceStep[] = []

  // --- Consumption statistics -------------------------------------------------
  const l3 = lastN(m.consumption, 3)
  const l6 = lastN(m.consumption, 6)
  const lm = m.consumption.at(-1) ?? 0
  const l3m = mean(l3)
  const l6m = mean(l6)
  const sd6 = stdev(l6)

  trace.push({
    label: 'L3M — average of last 3 months',
    expression: `mean(${l3.map(fmt).join(', ')})`,
    inputs: { months: l3.length },
    result: l3m,
  })
  trace.push({
    label: 'STDEV6 — standard deviation of last 6 months',
    expression: `stdev(${l6.map(fmt).join(', ')})`,
    inputs: { months: l6.length },
    result: sd6,
  })

  // AMC = mean(L3M) + k x stdev(L6M).  The `k` term is the buffer called out in
  // config.safetyBufferFactor — see the defect note there.
  const buffer = config.safetyBufferFactor * sd6
  trace.push({
    label: 'Variability buffer inside AMC',
    expression: `${config.safetyBufferFactor} x STDEV6`,
    inputs: { factor: config.safetyBufferFactor, STDEV6: sd6 },
    result: buffer,
    note:
      'This buffer is separate from, and additional to, the safety days applied in MSL below. ' +
      'Review whether both are intended.',
  })

  const amc = l3m + buffer
  trace.push({
    label: 'AMC — average monthly consumption',
    expression: 'L3M + buffer',
    inputs: { L3M: l3m, buffer },
    result: amc,
  })

  const dailyReq = amc / 30
  trace.push({
    label: 'Daily requirement',
    expression: 'AMC / 30',
    inputs: { AMC: amc },
    result: dailyReq,
  })

  // --- Cover ------------------------------------------------------------------
  const doi = amc > 0 ? (m.soh / amc) * 30 : 0
  // The BRD writes TOI as `(SOH + OpenPO / AMC) x 30`, which is a transcription
  // error. The live workbook computes `=(K+U)/N*30` — i.e. ((SOH + OpenPO) / AMC)
  // x 30 — so the corrected form below is what the business actually uses.
  const toi = amc > 0 ? ((m.soh + m.openPo) / amc) * 30 : 0

  trace.push({
    label: 'DOI — days on hand (physical stock only)',
    expression: '(SOH / AMC) x 30',
    inputs: { SOH: m.soh, AMC: amc },
    result: doi,
  })
  trace.push({
    label: 'TOI — total days on inventory (stock + open PO)',
    expression: '((SOH + OPEN_PO) / AMC) x 30',
    inputs: { SOH: m.soh, OPEN_PO: m.openPo, AMC: amc },
    result: toi,
    note: 'Corrected form. BRD F4 prints the parentheses in the wrong place.',
  })

  // --- Requirement ------------------------------------------------------------
  const logic = resolveLogic(m)
  let requirementQty = 0
  let msl = 0

  if (logic === 'CONSUMPTION_TREND') {
    // MSL = (lead time x daily req) + (safety days x daily req)
    const leadPart = m.leadTimeDays * dailyReq
    const safetyPart = m.safetyDays * dailyReq
    msl = leadPart + safetyPart

    trace.push({
      label: 'Lead time cover',
      expression: 'LEAD_TIME x DAILY_REQ',
      inputs: { LEAD_TIME: m.leadTimeDays, DAILY_REQ: dailyReq },
      result: leadPart,
      note: 'Lead time already includes the 7-day processing time held on the item master.',
    })
    trace.push({
      label: 'Safety stock cover',
      expression: 'SAFETY_DAYS x DAILY_REQ',
      inputs: { SAFETY_DAYS: m.safetyDays, DAILY_REQ: dailyReq },
      result: safetyPart,
    })
    trace.push({
      label: 'MSL — minimum stock level',
      expression: 'lead time cover + safety stock cover',
      inputs: { leadPart, safetyPart },
      result: msl,
    })

    requirementQty = msl - m.soh - m.openPo
    trace.push({
      label: 'Requirement quantity (Logic 2 — consumption trend)',
      expression: 'MSL - SOH - OPEN_PO',
      inputs: { MSL: msl, SOH: m.soh, OPEN_PO: m.openPo },
      result: requirementQty,
    })
  } else if (logic === 'BOM_EXPLOSION') {
    const f0 = forecast?.m0 ?? 0
    const f1 = forecast?.m1 ?? 0
    const factor = m.bomFactor ?? 0
    const gross = (f0 + f1) * factor

    trace.push({
      label: 'Forecast demand across horizon',
      expression: 'FORECAST_M + FORECAST_M1',
      inputs: { FORECAST_M: f0, FORECAST_M1: f1 },
      result: f0 + f1,
    })
    trace.push({
      label: 'Exploded through BOM',
      expression: '(FORECAST_M + FORECAST_M1) x BOM_FACTOR',
      inputs: { forecast: f0 + f1, BOM_FACTOR: factor },
      result: gross,
    })

    requirementQty = gross - m.soh - m.openPo
    trace.push({
      label: 'Requirement quantity (Logic 1 — BOM explosion)',
      expression: 'gross - SOH - OPEN_PO',
      inputs: { gross, SOH: m.soh, OPEN_PO: m.openPo },
      result: requirementQty,
    })
  }

  // --- PR quantity ------------------------------------------------------------
  const net = Math.max(0, requirementQty)
  let prQty = net
  const exceptions: ExceptionType[] = []

  if (net > 0) {
    if (net < m.moq) {
      prQty = m.moq
      trace.push({
        label: 'Supplier MOQ applied',
        expression: 'max(requirement, MOQ)',
        inputs: { requirement: net, MOQ: m.moq },
        result: prQty,
      })
    }
    const rounded = roundToBundle(prQty, m.bundle)
    if (rounded === null) {
      exceptions.push('data-gap')
      trace.push({
        label: 'Bundle rounding',
        expression: 'roundup(qty / BUNDLE) x BUNDLE',
        inputs: { qty: prQty },
        result: prQty,
        note: 'Bundle size is missing on the item master — quantity could not be rounded.',
      })
    } else {
      prQty = rounded
      trace.push({
        label: 'Rounded to bundle',
        expression: 'roundup(qty / BUNDLE) x BUNDLE',
        inputs: { qty: net, BUNDLE: m.bundle ?? 0 },
        result: prQty,
      })
    }
  }

  const prValue = prQty * m.price
  trace.push({
    label: 'PR value',
    expression: 'PR_QTY x unit cost',
    inputs: { PR_QTY: prQty, cost: m.price },
    result: prValue,
  })

  // --- Exceptions -------------------------------------------------------------
  if (!isInScope(m)) {
    return {
      material: m,
      logic: 'EXCLUDED',
      requirementQty: 0,
      prQty: 0,
      prValue: 0,
      amc,
      dailyReq,
      msl: 0,
      doi,
      toi,
      releases: [],
      trace: [
        {
          label: 'Excluded from calculation',
          expression: `tag ${m.tag}`,
          inputs: { tag: m.tag },
          result: 0,
          note: excludeReason(m),
        },
      ],
      exceptions: ['data-gap'],
      flagReason: excludeReason(m),
    }
  }

  if (m.leadTimeDays <= 0 || m.safetyDays <= 0) exceptions.push('data-gap')
  if (logic === 'CONSUMPTION_TREND' && amc <= 0) exceptions.push('no-demand-signal')
  if (logic === 'BOM_EXPLOSION' && !forecast) exceptions.push('no-demand-signal')
  if (toi < config.lowCoverDays) exceptions.push('below-cover')

  const releases = splitReleases(m, prQty, cycleStart)
  if (m.band === 'weekly' && m.pallet && m.whSpacePallets != null) {
    const capacity = m.pallet * m.whSpacePallets
    if (prQty > capacity) exceptions.push('quantity-and-space')
  }

  return {
    material: m,
    logic,
    requirementQty,
    prQty,
    prValue,
    amc,
    dailyReq,
    msl,
    doi,
    toi,
    releases,
    trace,
    exceptions,
    flagReason: describeFlag(exceptions, m, toi, config),
  }
}

function excludeReason(m: Material): string {
  if (m.lifecycle === 'discontinued') return 'Material is discontinued — no future requirement.'
  switch (m.tag) {
    case 2:
      return 'Tag 2 — commodities, grains, livestock and raw eggs are handled under a different operating model.'
    case 3:
      return 'Tag 3 — customer supplied material.'
    case 4:
      return 'Tag 4 — discontinued or obsolete, no future requirement.'
    default:
      return 'Out of scope.'
  }
}

function describeFlag(
  exceptions: readonly ExceptionType[],
  m: Material,
  toi: number,
  config: PlanningConfig,
): string | null {
  if (exceptions.length === 0) return null
  if (exceptions.includes('data-gap')) {
    if (m.bundle === null) return 'Bundle size is missing, so the quantity could not be rounded to a full pallet.'
    return 'Planning parameters are incomplete on the item master.'
  }
  if (exceptions.includes('no-demand-signal')) {
    return 'No forecast and no consumption history — there is no demand signal to plan from.'
  }
  if (exceptions.includes('quantity-and-space')) {
    return 'Suggested quantity exceeds the warehouse pallet space available for this material.'
  }
  if (exceptions.includes('below-cover')) {
    return `Cover is ${toi.toFixed(0)} days including open POs, below the ${config.lowCoverDays}-day threshold.`
  }
  return null
}

/**
 * Split a PR quantity into call-offs.
 *
 * Monthly band gets a single release. Weekly band is called off against
 * warehouse pallet capacity across the month. Ram's worked example splits
 * 100K jars as WK1 30K / WK2 30K / WK4 40K — note weeks are NOT necessarily
 * consecutive, so this returns a sparse list rather than a fixed W1-W4 array.
 */
export function splitReleases(m: Material, prQty: number, cycleStart: Date): PrRelease[] {
  if (prQty <= 0) return []

  const dateFor = (week: number): string => {
    const d = new Date(cycleStart)
    d.setDate(d.getDate() + (week - 1) * 7)
    return d.toISOString().slice(0, 10)
  }

  if (m.band === 'monthly') {
    return [{ week: 1, qty: prQty, date: dateFor(1) }]
  }

  const capacity = m.pallet && m.whSpacePallets ? m.pallet * m.whSpacePallets : prQty
  if (capacity <= 0) return [{ week: 1, qty: prQty, date: dateFor(1) }]

  const releases: PrRelease[] = []
  let remaining = prQty
  // Weeks 1, 2 and 4 mirror the observed call-off pattern; week 3 is commonly
  // skipped because of the receiving schedule.
  for (const week of [1, 2, 4]) {
    if (remaining <= 0) break
    const qty = Math.min(capacity, remaining)
    releases.push({ week, qty, date: dateFor(week) })
    remaining -= qty
  }
  if (remaining > 0 && releases.length > 0) {
    const last = releases[releases.length - 1] as PrRelease
    releases[releases.length - 1] = { ...last, qty: last.qty + remaining }
  }
  return releases
}

const fmt = (n: number): string => n.toLocaleString('en-US', { maximumFractionDigits: 0 })
