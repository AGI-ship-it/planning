import type { ForecastRow, ValidatedRow, ValidationResult } from './types'
import { UNITS, type UnitCode } from './units'

export interface ColumnMapping {
  fgCode: string
  unit: string
  uom: string
  m0: string
  m1: string
  m2: string
  description?: string
}

const CANDIDATES: Record<keyof ColumnMapping, readonly string[]> = {
  fgCode: ['item code', 'itemcode', 'item number', 'fg code', 'material code', 'sku'],
  unit: ['bu', 'unit', 'source plant', 'plant', 'site', 'legal entity'],
  uom: ['uom', 'unit of measure', 'inventory unit'],
  m0: ['fc qty', 'month 1', 'm0', 'qty 1'],
  m1: ['month 2', 'm1', 'qty 2'],
  m2: ['month 3', 'm2', 'qty 3'],
  description: ['item description', 'description', 'product name'],
}

/**
 * Guess the column mapping from a header row. The real forecast file (workbook
 * `Rolling FC` sheet) has 22 columns with three consecutive "FC Qty MT <month>"
 * columns, so month columns are matched positionally once the first is found.
 */
export function guessMapping(headers: readonly string[]): Partial<ColumnMapping> {
  const norm = headers.map((h) => h.toLowerCase().trim())
  const found: Partial<ColumnMapping> = {}

  const pick = (key: keyof ColumnMapping): void => {
    const idx = norm.findIndex((h) => CANDIDATES[key].some((c) => h.includes(c)))
    if (idx >= 0) found[key] = headers[idx]
  }

  ;(['fgCode', 'unit', 'uom', 'description'] as const).forEach(pick)

  const qtyCols = headers.filter((_, i) => {
    const h = norm[i] ?? ''
    return h.includes('fc qty') || h.includes('forecast')
  })
  if (qtyCols.length >= 3) {
    found.m0 = qtyCols[0]
    found.m1 = qtyCols[1]
    found.m2 = qtyCols[2]
  } else {
    ;(['m0', 'm1', 'm2'] as const).forEach(pick)
  }

  return found
}

const UNIT_CODES = new Set<string>(UNITS.map((u) => u.code))

/** Recognisable unit-code typos that can be auto-corrected rather than rejected. */
const UNIT_FIXES: Record<string, UnitCode> = {
  NFMM: 'NFM', NMF: 'NFM', JFMM: 'JFM', JMF: 'JFM',
  OATS: 'OAT', OTA: 'OAT', EOPP: 'EOP', EPO: 'EOP',
  FPMM: 'FPM', FMP: 'FPM', AGFMM: 'AGFM', AGF: 'AGFM',
}

const num = (raw: string | undefined): number | null => {
  if (raw == null) return null
  const cleaned = raw.replace(/[, ]/g, '').trim()
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/**
 * Validate an uploaded forecast row by row.
 *
 * Bad rows are quarantined, never blocking — the rest of the file loads. Three
 * non-clean outcomes are distinguished so the planner knows what needs fixing:
 * quarantined (unknown item code, negative quantity), auto-corrected
 * (recognisable unit-code typo) and loaded-with-warning (blank month, UOM
 * mismatch).
 */
export function validateForecast(
  rows: readonly Record<string, string>[],
  mapping: ColumnMapping,
  knownFgCodes: ReadonlySet<string>,
): ValidationResult {
  const out: ValidatedRow[] = []

  rows.forEach((raw, i) => {
    const rowNo = i + 2 // 1-based, allowing for the header row
    const push = (
      outcome: ValidatedRow['outcome'],
      reason?: string,
      data?: ForecastRow,
    ): void => {
      out.push({ row: rowNo, outcome, reason, data, raw })
    }

    const fgCode = (raw[mapping.fgCode] ?? '').trim()
    if (fgCode === '') {
      push('quarantined', 'Item code is blank.')
      return
    }
    if (!knownFgCodes.has(fgCode)) {
      push('quarantined', `Item code ${fgCode} does not exist on the item master.`)
      return
    }

    let unitRaw = (raw[mapping.unit] ?? '').trim().toUpperCase()
    let corrected = false
    if (!UNIT_CODES.has(unitRaw)) {
      const fix = UNIT_FIXES[unitRaw]
      if (fix) {
        unitRaw = fix
        corrected = true
      } else {
        push('quarantined', `Unit "${unitRaw}" is not a recognised manufacturing unit.`)
        return
      }
    }

    const m0 = num(raw[mapping.m0])
    const m1 = num(raw[mapping.m1])
    const m2 = num(raw[mapping.m2])

    if ([m0, m1, m2].some((v) => v !== null && v < 0)) {
      push('quarantined', 'Forecast quantity is negative.')
      return
    }

    const data: ForecastRow = {
      fgCode,
      unit: unitRaw as UnitCode,
      uom: (raw[mapping.uom] ?? 'MT').trim() || 'MT',
      m0: m0 ?? 0,
      m1: m1 ?? 0,
      m2: m2 ?? 0,
      description: mapping.description ? raw[mapping.description] : undefined,
    }

    if (corrected) {
      push('corrected', `Unit code corrected to ${unitRaw}.`, data)
      return
    }
    if (m0 === null || m1 === null || m2 === null) {
      push('warning', 'One or more month quantities are blank and were read as zero.', data)
      return
    }
    push('loaded', undefined, data)
  })

  return {
    rows: out,
    loaded: out.filter((r) => r.outcome === 'loaded').length,
    corrected: out.filter((r) => r.outcome === 'corrected').length,
    warnings: out.filter((r) => r.outcome === 'warning').length,
    quarantined: out.filter((r) => r.outcome === 'quarantined').length,
  }
}
