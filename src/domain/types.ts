import type { UnitCode } from './units'

/**
 * Material tag — the central classification. Sourced verbatim from the planner's
 * workbook `Master` sheet.
 *
 * Tags 2-4 are excluded from calculation regardless of anything else. That rule
 * is enforced in `rules.ts`, never in the UI.
 */
export type MaterialTag = 0 | 1 | 2 | 3 | 4

export const TAG_MEANING: Record<MaterialTag, string> = {
  0: 'One to one mapping',
  1: 'One to many mapping',
  2: 'Commodities, grains, livestock & raw eggs',
  3: 'Customer supplied',
  4: 'Discontinued, obsolete, no future requirement',
}

/**
 * OPEN QUESTION (BRD gap 4): when a material is discontinued, does its previous
 * tag (0 or 1) survive? Tag and lifecycle are separate fields so the answer can
 * go either way without a migration.
 */
export type Lifecycle = 'active' | 'discontinued'

/**
 * Supply band. Roughly 90% of volume is monthly (single release); ~10% is weekly
 * — locally sourced packaging on a 7-day lead time, called off against warehouse
 * pallet capacity (whiteboard: "WEEKLY 10% VOL / LOCALLY PM / 7D LT / W/H SPACE
 * CONSTRAINT").
 */
export type SupplyBand = 'monthly' | 'weekly'

export type SourceType = 'local' | 'import'

export interface Material {
  readonly code: string
  readonly description: string
  readonly unit: UnitCode
  readonly category: string
  readonly uom: string
  readonly tag: MaterialTag
  /**
   * Real extracts carry sub-classified tags — `1-Chakki MG ING`,
   * `1-Flour Additives / Enzymes`, `1-SpM ING`, `1.2` — alongside clean 0-4
   * values. The base tag drives calculation; the subclass is retained so a
   * round-trip to the source system does not lose it.
   */
  readonly tagSubclass?: string
  readonly lifecycle: Lifecycle
  readonly source: SourceType
  readonly band: SupplyBand
  /**
   * Procurement lead time in days. In the source workbook this column is
   * "LT in Days + 7 Day Pros. Time" — the 7 days processing is ALREADY included.
   * Adding it again here would double-count, so callers must treat this as the
   * total to-source time.
   */
  readonly leadTimeDays: number
  /** Days of safety cover. The workbook hardcodes 45 (`MSL in UOM (45+LT days)`). */
  readonly safetyDays: number
  readonly moq: number
  /** Bundle / pallet rounding quantity. Missing bundle blocks rounding. */
  readonly bundle: number | null
  readonly pallet: number | null
  /** Unit cost (AED) — PR value is PR qty x COGS. */
  readonly price: number
  /** Logic 1 only: the single FG this material maps to, and its BOM factor. */
  readonly fgCode?: string
  readonly bomFactor?: number
  readonly soh: number
  readonly openPo: number
  /**
   * Consumption history, most recent month LAST, as positive magnitudes.
   * Note the source workbook stores these as negative numbers (stock issues);
   * the adapter flips the sign on load.
   */
  readonly consumption: readonly number[]
  /** Warehouse pallet slots available — drives the weekly call-off split. */
  readonly whSpacePallets?: number
}

export interface ForecastRow {
  readonly fgCode: string
  readonly unit: UnitCode
  readonly uom: string
  readonly m0: number
  readonly m1: number
  readonly m2: number
  readonly description?: string
}

export type ValidationOutcome = 'loaded' | 'warning' | 'corrected' | 'quarantined'

export interface ValidatedRow {
  readonly row: number
  readonly outcome: ValidationOutcome
  readonly reason?: string
  readonly data?: ForecastRow
  readonly raw: Record<string, string>
}

export interface ValidationResult {
  readonly rows: readonly ValidatedRow[]
  readonly loaded: number
  readonly corrected: number
  readonly warnings: number
  readonly quarantined: number
}

/** One step of a calculation, rendered as the calculation trail. */
export interface TraceStep {
  readonly label: string
  readonly expression: string
  readonly inputs: Readonly<Record<string, number>>
  readonly result: number
  readonly note?: string
}

export type ExceptionType =
  | 'below-cover'
  | 'quantity-and-space'
  | 'data-gap'
  | 'no-demand-signal'

export interface PrRelease {
  /** Week of the month, 1-based. Weeks are NOT necessarily consecutive — Ram's
   *  worked example splits 100K jars across WK1, WK2 and WK4. */
  readonly week: number
  readonly qty: number
  readonly date: string
}

export interface RequirementLine {
  readonly material: Material
  readonly logic: 'BOM_EXPLOSION' | 'CONSUMPTION_TREND' | 'EXCLUDED'
  readonly requirementQty: number
  readonly prQty: number
  readonly prValue: number
  readonly amc: number
  readonly dailyReq: number
  readonly msl: number
  readonly doi: number
  readonly toi: number
  readonly releases: readonly PrRelease[]
  readonly trace: readonly TraceStep[]
  readonly exceptions: readonly ExceptionType[]
  readonly flagReason: string | null
}

export type DecisionKind = 'accept' | 'reject' | 'override'

export const REASON_CODES = [
  'Warehouse space constraint',
  'Supplier MOQ change',
  'Known forecast error',
  'Production schedule change',
  'Stock in transit not yet received',
  'Batch not closed — consumption understated',
  'Material being phased out',
] as const

export type ReasonCode = (typeof REASON_CODES)[number]

export interface Decision {
  readonly code: string
  readonly kind: DecisionKind
  readonly reasonCode?: ReasonCode
  readonly overrideQty?: number
}
