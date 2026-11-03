/**
 * Chart DSL — numbers from tables as bar / line / area / pie charts.
 *
 *   ```chart {src=hours.xlsx sheet="Маш-часы"}
 *   title: Машино-часы по типам техники
 *   type: hbar                 # bar | hbar | line | area | pie | stacked
 *   x: Машина                  # category column (name or letter A, B…); default: first text column
 *   y: Маш.час                 # one or more value columns, comma-separated; default: all numeric columns
 *   unit: маш.час
 *   sort: desc                 # none | asc | desc
 *   top: 10                    # keep top N by first series, rest → "Прочее"
 *   exclude: ИТОГО, Всего      # drop rows whose category matches (totals rows)
 *   ```
 *
 * Inline data instead of src — a pipe or CSV table after the directives:
 *
 *   Месяц | План | Факт
 *   Янв   | 120  | 110
 */
import { coerce } from './coerce.ts'

export type ChartType = 'bar' | 'hbar' | 'line' | 'area' | 'pie' | 'stacked'
export const CHART_TYPES: ChartType[] = ['bar', 'hbar', 'line', 'area', 'pie', 'stacked']

export interface ChartSeries { name: string, values: (number | null)[] }
export interface ChartDocument {
  title?: string
  type: ChartType
  unit?: string
  categories: string[]
  series: ChartSeries[]
  errors: string[]
  warnings: string[]
  /** e.g. "Excluded totals row: ИТОГО" */
  notes: string[]
}
export interface Table { kind?: string, columns: string[], rows: unknown[][] }

// \b is ASCII-only in JS; use a Unicode letter lookahead so Cyrillic words match
const TOTAL_RE = /^(итого|всего|total|sum|сумма)(?!\p{L})/iu

export function parseChart(code: string, src?: Table): ChartDocument {
  const doc: ChartDocument = { type: 'bar', categories: [], series: [], errors: [], warnings: [], notes: [] }
  const opts: Record<string, string> = {}
  const tableLines: string[] = []
  for (const raw of (code ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.replace(/(^|\s{2,})#.*$/, '').trim()
    if (!line) continue
    const m = line.match(/^(title|type|x|y|unit|sort|top|exclude|stack|total|where)\s*:\s*(.*)$/i)
    if (m && !tableLines.length) opts[m[1]!.toLowerCase()] = m[2]!.trim()
    else tableLines.push(line)
  }
  doc.title = opts.title
  doc.unit = opts.unit
  if (opts.type) {
    if ((CHART_TYPES as string[]).includes(opts.type)) doc.type = opts.type as ChartType
    else doc.errors.push(`Unknown type "${opts.type}" (${CHART_TYPES.join(' | ')})`)
  }

  let table: Table | undefined = src
  if (tableLines.length) {
    if (src) doc.warnings.push('Both src= and inline table given — inline table ignored')
    else table = parseInlineTable(tableLines)
  }
  if (!table || !table.columns?.length) { doc.errors.push('No data: add src=<file> or an inline table'); return doc }
  if (table.kind && table.kind !== 'table') { doc.errors.push('chart src must be tabular (csv, xlsx, json array)'); return doc }

  const cols = table.columns.map(c => String(c ?? '').trim())
  const rows = table.rows.map(r => cols.map((_, i) => coerce(r[i])))
  const colIdx = (ref: string) => {
    const r = ref.trim()
    if (/^[A-Z]{1,2}$/.test(r)) return r.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1
    const exact = cols.findIndex(c => c === r)
    return exact >= 0 ? exact : cols.findIndex(c => c.toLowerCase() === r.toLowerCase())
  }
  const isNumCol = (i: number) => rows.filter(r => r[i] !== null).length > 0 && rows.filter(r => r[i] !== null).every(r => typeof r[i] === 'number')

  const x = opts.x ? colIdx(opts.x) : cols.findIndex((_, i) => !isNumCol(i))
  if (x < 0) { doc.errors.push(opts.x ? `x: column "${opts.x}" not found (have: ${cols.join(', ')})` : 'No category (text) column found — set x:'); return doc }
  let ys: number[]
  if (opts.y) {
    ys = opts.y.split(',').map(colIdx)
    const bad = opts.y.split(',').filter((_, i) => ys[i]! < 0)
    if (bad.length) { doc.errors.push(`y: column(s) ${bad.map(b => `"${b.trim()}"`).join(', ')} not found (have: ${cols.join(', ')})`); return doc }
  }
  else ys = cols.map((_, i) => i).filter(i => i !== x && isNumCol(i))
  if (!ys.length) { doc.errors.push('No numeric columns for y'); return doc }

  if (opts.where) {
    const w = opts.where.match(/^(.+?)\s*(=|!=)\s*(.+)$/)
    const wi = w ? colIdx(w[1]!) : -1
    if (!w || wi < 0) { doc.errors.push(`where: use "<column> = <value>" (have columns: ${cols.join(', ')})`); return doc }
    const want = w[3]!.trim().toLowerCase()
    const before = rows.length
    for (let i = rows.length - 1; i >= 0; i--) {
      const eq = String(rows[i]![wi] ?? '').trim().toLowerCase() === want
      if (w[2] === '=' ? !eq : eq) rows.splice(i, 1)
    }
    doc.notes.push(`Filtered ${opts.where}: ${rows.length} of ${before} rows`)
  }
  const exclude = (opts.exclude ? opts.exclude.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [])
  let data = rows.filter((r) => {
    const cat = String(r[x] ?? '').trim()
    if (!cat) return false
    const lc = cat.toLowerCase()
    if (exclude.some(e => lc === e || lc.startsWith(e))) { doc.notes.push(`Excluded: ${cat}`); return false }
    // totals rows are always dropped (they'd dwarf the parts); `total: keep` opts out
    if (opts.total !== 'keep' && TOTAL_RE.test(cat)) { doc.notes.push(`Excluded totals row: ${cat}`); return false }
    return ys.some(i => typeof r[i] === 'number')
  })
  for (const i of ys) {
    const bad = data.filter(r => r[i] !== null && typeof r[i] !== 'number').length
    if (bad) doc.warnings.push(`Column "${cols[i]}": ${bad} non-numeric value(s) ignored`)
  }
  const first = ys[0]!
  const val = (r: unknown[]) => (typeof r[first] === 'number' ? r[first] as number : -Infinity)
  if (opts.sort === 'desc') data = [...data].sort((a, b) => val(b) - val(a))
  else if (opts.sort === 'asc') data = [...data].sort((a, b) => val(a) - val(b))
  else if (opts.sort && opts.sort !== 'none') doc.errors.push(`Unknown sort "${opts.sort}" (none | asc | desc)`)

  const top = opts.top ? Number(opts.top) : (doc.type === 'pie' ? 8 : 0)
  if (top > 0 && data.length > top) {
    const sorted = opts.sort ? data : [...data].sort((a, b) => val(b) - val(a))
    const keep = sorted.slice(0, top), rest = sorted.slice(top)
    const other: unknown[] = cols.map(() => null)
    other[x] = `Прочее (${rest.length})`
    for (const i of ys) other[i] = rest.reduce((s, r) => s + (typeof r[i] === 'number' ? r[i] as number : 0), 0)
    data = [...keep, other]
    doc.notes.push(`${rest.length} smallest grouped into "Прочее"`)
  }

  doc.categories = data.map(r => String(r[x]))
  doc.series = ys.map(i => ({ name: cols[i] || `Ряд ${i + 1}`, values: data.map(r => (typeof r[i] === 'number' ? r[i] as number : null)) }))
  if (doc.type === 'pie' && doc.series.length > 1) doc.warnings.push('pie uses only the first y column')
  if (doc.type === 'pie' && doc.series[0]!.values.some(v => (v ?? 0) < 0)) doc.errors.push('pie cannot show negative values')
  if (!doc.categories.length) doc.errors.push('No rows with numeric values')
  if (doc.categories.length > 40 && doc.type !== 'line' && doc.type !== 'area') doc.warnings.push(`${doc.categories.length} categories — use top: or a line chart`)
  return doc
}

function parseInlineTable(lines: string[]): Table {
  const sep = lines[0]!.includes('|') ? '|' : lines[0]!.includes(';') ? ';' : lines[0]!.includes('\t') ? '\t' : ','
  const split = (l: string) => l.replace(/^\||\|$/g, '').split(sep).map(s => s.trim())
  const body = lines.filter(l => !/^\|?\s*:?-{2,}/.test(l)) // skip markdown separator rows
  const [head, ...rest] = body
  return { columns: split(head!), rows: rest.map(split) }
}

/** Nice axis ticks covering [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) { max = min === 0 ? 1 : min * 1.1; min = Math.min(0, min) }
  const span = max - min
  const step0 = span / count
  const mag = 10 ** Math.floor(Math.log10(step0))
  const step = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => s >= step0)!
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = start; v <= end + step * 1e-9; v += step) ticks.push(Number(v.toPrecision(12)))
  return ticks
}

export function formatNumber(v: number, compact = false): string {
  if (compact && Math.abs(v) >= 1e6) return `${(v / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн`
  if (compact && Math.abs(v) >= 1e4) return `${(v / 1e3).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} тыс.`
  return v.toLocaleString('ru-RU', { maximumFractionDigits: Math.abs(v) < 10 ? 2 : Math.abs(v) < 1000 ? 1 : 0 })
}
