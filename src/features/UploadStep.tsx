import { useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { guessMapping, validateForecast, type ColumnMapping } from '../domain/forecast'
import type { ForecastRow, ValidationResult } from '../domain/types'
import { SEED_FORECAST } from '../data/seed'
import { Button, Empty, Panel, Pill, inputClass } from '../ui/primitives'
import { qty } from '../lib/format'

const KNOWN_FG = new Set(SEED_FORECAST.map((f) => f.fgCode))

const MAPPING_KEY = 'agf-mrp.forecast-mapping'

export function UploadStep({
  onLoaded,
  loaded,
}: {
  onLoaded: (rows: readonly ForecastRow[], fileName: string) => void
  loaded: { rows: readonly ForecastRow[]; fileName: string } | null
}): JSX.Element {
  const [raw, setRaw] = useState<Record<string, string>[] | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({})
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const ready = Boolean(mapping.fgCode && mapping.unit && mapping.m0 && mapping.m1 && mapping.m2)

  const result: ValidationResult | null = useMemo(() => {
    if (!raw || !ready) return null
    return validateForecast(raw, mapping as ColumnMapping, KNOWN_FG)
  }, [raw, mapping, ready])

  const handleFile = async (file: File): Promise<void> => {
    setError(null)
    setFileName(file.name)
    try {
      let rows: Record<string, string>[] = []
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text()
        const parsed = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        })
        rows = parsed.data
      } else {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf)
        const sheetName = wb.SheetNames[0]
        if (!sheetName) throw new Error('The workbook has no sheets.')
        const sheet = wb.Sheets[sheetName]
        if (!sheet) throw new Error('The first sheet could not be read.')
        rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false, defval: '' })
      }
      if (rows.length === 0) {
        setError('The file has no data rows.')
        return
      }
      const hdrs = Object.keys(rows[0] ?? {})
      setRaw(rows)
      setHeaders(hdrs)

      const stored = localStorage.getItem(MAPPING_KEY)
      const remembered = stored ? (JSON.parse(stored) as Partial<ColumnMapping>) : null
      const usable =
        remembered && Object.values(remembered).every((c) => !c || hdrs.includes(c as string))
      setMapping(usable && remembered ? remembered : guessMapping(hdrs))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The file could not be read.')
    }
  }

  const confirm = (): void => {
    if (!result) return
    localStorage.setItem(MAPPING_KEY, JSON.stringify(mapping))
    const rows = result.rows.flatMap((r) => (r.data ? [r.data] : []))
    onLoaded(rows, fileName)
  }

  const useSample = (): void => {
    onLoaded(SEED_FORECAST, 'FG Forecast — Sep-Nov 2026 (sample).xlsx')
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Upload the finished goods forecast"
        subtitle="Sales send this file by email each cycle. CSV or Excel."
        right={
          <Button variant="ghost" onClick={useSample}>
            Use sample forecast
          </Button>
        }
      >
        <div className="p-4">
          <div
            className="rounded border border-dashed border-line bg-surface px-6 py-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) void handleFile(f)
            }}
          >
            <p className="text-[13px] text-ink">Drop the forecast file here</p>
            <p className="mt-1 text-[12px] text-muted">
              Expected columns: item code, unit, UOM and three rolling month quantities
            </p>
            <div className="mt-3">
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Choose file
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleFile(f)
                }}
              />
            </div>
            {fileName && <p className="mt-3 text-[12px] text-muted">{fileName}</p>}
          </div>
          {error && (
            <p className="mt-3 rounded border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-[12px] text-bad">
              {error}
            </p>
          )}
        </div>
      </Panel>

      {raw && (
        <Panel
          title="Map the columns"
          subtitle="Guessed from the header row, and remembered for next month."
        >
          <div className="grid grid-cols-3 gap-3 p-4">
            {(
              [
                ['fgCode', 'FG item code', true],
                ['unit', 'Manufacturing unit', true],
                ['uom', 'UOM', false],
                ['m0', 'Month 1 quantity', true],
                ['m1', 'Month 2 quantity', true],
                ['m2', 'Month 3 quantity', true],
                ['description', 'Description', false],
              ] as const
            ).map(([key, label, required]) => (
              <label key={key} className="block">
                <span className="block text-[12px] font-medium">
                  {label}
                  {required && <span className="text-bad"> *</span>}
                </span>
                <select
                  className={`${inputClass} mt-1`}
                  value={mapping[key] ?? ''}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [key]: e.target.value || undefined }))
                  }
                >
                  <option value="">— not mapped —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </Panel>
      )}

      {result && (
        <Panel
          title="Validation"
          subtitle="Bad rows are quarantined. The rest of the file still loads."
          right={
            <Button variant="primary" onClick={confirm} disabled={result.loaded + result.corrected + result.warnings === 0}>
              Accept {qty(result.loaded + result.corrected + result.warnings)} rows
            </Button>
          }
        >
          <div className="flex gap-2 border-b border-line px-4 py-3">
            <Pill tone="good">{qty(result.loaded)} loaded</Pill>
            <Pill tone="info">{qty(result.corrected)} auto-corrected</Pill>
            <Pill tone="flag">{qty(result.warnings)} with warning</Pill>
            <Pill tone="bad">{qty(result.quarantined)} quarantined</Pill>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-1.5 font-medium">Row</th>
                  <th className="px-2 py-1.5 font-medium">Outcome</th>
                  <th className="px-2 py-1.5 font-medium">Item</th>
                  <th className="px-2 py-1.5 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {result.rows
                  .filter((r) => r.outcome !== 'loaded')
                  .map((r) => (
                    <tr key={r.row} className="border-t border-line">
                      <td className="px-4 py-1.5 tnum text-muted">{r.row}</td>
                      <td className="px-2 py-1.5">
                        <Pill
                          tone={
                            r.outcome === 'quarantined'
                              ? 'bad'
                              : r.outcome === 'corrected'
                                ? 'info'
                                : 'flag'
                          }
                        >
                          {r.outcome}
                        </Pill>
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[11px]">
                        {r.data?.fgCode ?? '—'}
                      </td>
                      <td className="px-2 py-1.5 text-muted">{r.reason}</td>
                    </tr>
                  ))}
                {result.rows.every((r) => r.outcome === 'loaded') && (
                  <tr>
                    <td colSpan={4}>
                      <Empty>Every row validated cleanly.</Empty>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {loaded && (
        <Panel title="Loaded forecast" subtitle={loaded.fileName}>
          <table className="w-full text-[12px]">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-1.5 font-medium">FG code</th>
                <th className="px-2 py-1.5 font-medium">Description</th>
                <th className="px-2 py-1.5 font-medium">Unit</th>
                <th className="px-2 py-1.5 text-right font-medium">Month 1</th>
                <th className="px-2 py-1.5 text-right font-medium">Month 2</th>
                <th className="px-2 py-1.5 text-right font-medium">Month 3</th>
              </tr>
            </thead>
            <tbody>
              {loaded.rows.map((r) => (
                <tr key={r.fgCode} className="border-t border-line">
                  <td className="px-4 py-1.5 font-mono text-[11px]">{r.fgCode}</td>
                  <td className="px-2 py-1.5 text-muted">{r.description}</td>
                  <td className="px-2 py-1.5">{r.unit}</td>
                  <td className="px-2 py-1.5 text-right tnum">{qty(r.m0)}</td>
                  <td className="px-2 py-1.5 text-right tnum">{qty(r.m1)}</td>
                  <td className="px-2 py-1.5 text-right tnum">{qty(r.m2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  )
}
