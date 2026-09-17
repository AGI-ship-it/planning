import type { Material, MaterialTag } from './types'

/**
 * Tags 2-4 are excluded from calculation regardless of anything else, and a
 * discontinued material is excluded whatever its tag. Enforced here, in the
 * domain layer, so no UI path can route round it.
 */
export function isInScope(m: Material): boolean {
  if (m.lifecycle === 'discontinued') return false
  return m.tag === 0 || m.tag === 1
}

export type LogicKind = 'BOM_EXPLOSION' | 'CONSUMPTION_TREND' | 'EXCLUDED'

/**
 * Resolve which calculation applies to a material.
 *
 * CONTRADICTION IN SOURCES — the logic *numbering* is reversed between them:
 *   - BRD 6.1/6.2 and the workbook `Master` sheet: Logic 1 = one-to-one (BOM),
 *     Logic 2 = one-to-many (consumption trend).
 *   - Ram's whiteboard: "LOGIC 1 - REQ1 ... ONE ITEM {FG1 FG2 FG3}" with
 *     "REQ1 = CONS. TREND - L6M, L3M, LM", and "LOGIC 2 ... ONE ITEM = FG"
 *     with BOM — i.e. exactly the opposite numbering.
 *
 * Two sources against one, so the BRD numbering is used for display. But the
 * binding below is deliberately made against the tag's *meaning*, never against
 * the digit, so that if the numbering is later found to be the other way round
 * the calculation still cannot be wrong.
 *
 *   tag 0 = "One to one mapping"  -> material maps to a single FG -> BOM explosion
 *   tag 1 = "One to many mapping" -> material spans many FGs      -> consumption trend
 */
export function resolveLogic(m: Material): LogicKind {
  if (!isInScope(m)) return 'EXCLUDED'
  return m.tag === 0 ? 'BOM_EXPLOSION' : 'CONSUMPTION_TREND'
}

/** Display label for the logic, using BRD numbering. */
export function logicLabel(kind: LogicKind): string {
  switch (kind) {
    case 'BOM_EXPLOSION':
      return 'Logic 1 — BOM explosion'
    case 'CONSUMPTION_TREND':
      return 'Logic 2 — consumption trend'
    case 'EXCLUDED':
      return 'Excluded'
  }
}

/**
 * Parse a tag value as it appears in a real extract. Production data carries
 * sub-classified tags such as `1-Chakki MG ING`, `1-Flour Additives / Enzymes`,
 * `1-SpM ING` and `1.2` alongside clean `0`-`4` values. A strict enum parse
 * rejects those rows; this keeps the base tag and preserves the subclass.
 */
export function parseTag(raw: string): { tag: MaterialTag; subclass?: string } | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const match = /^([0-4])(?:[.\-\s](.*))?$/.exec(trimmed)
  if (!match) return null
  const tag = Number(match[1]) as MaterialTag
  const rest = match[2]?.trim()
  return rest ? { tag, subclass: rest } : { tag }
}

/** Materials needing planner attention because the item master is incomplete. */
export function masterDataGaps(m: Material): string[] {
  const gaps: string[] = []
  if (m.bundle === null) gaps.push('bundle size')
  if (m.leadTimeDays <= 0) gaps.push('lead time')
  if (m.safetyDays <= 0) gaps.push('safety days')
  if (m.price <= 0) gaps.push('unit cost')
  if (m.tag === 0 && m.bomFactor == null) gaps.push('BOM factor')
  return gaps
}
