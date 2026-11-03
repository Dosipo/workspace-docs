/**
 * Gantt DSL — phases and tasks on a timeline of dates or abstract units (shifts, days, weeks).
 *
 *   title: Этапы мобилизации
 *   unit: смена                     # date (default if dates are used) | any word: смена, день, неделя, месяц
 *   today: 45                       # optional "now" marker (unit value or date)
 *
 *   section Земляное полотно        # group header
 *   rip    Рыхление SD 32       : 1 - 30                        # start - end (inclusive)
 *   haul   Вывозка в отвал      : 31 - 110   [crit]             # flags: crit, done, active, milestone
 *   fill   Отсыпка насыпи       : after rip, 60                 # after <id>[, <id>…], duration
 *   ready  Сдача земполотна     : 150 [milestone]
 *     | 52 ед. техники, 10 рабочих.                            # description (shown on click)
 *
 *   section Финиш
 *   pave   Покрытие ЩПС         : 2026-08-01 - 2026-09-15       # dates work too (don't mix with units)
 *
 * Tables via src= with columns: task|задача|этап, start|начало, end|окончание|конец, duration|длительность,
 * after|depends|зависит, section|группа|раздел, id, flags|статус, description|описание.
 */
import { coerce } from './coerce.ts'

export interface GanttTask {
  id: string
  label: string
  section?: string
  start: number          // unit value or epoch day
  end: number            // inclusive
  deps: string[]
  crit?: boolean
  done?: boolean
  active?: boolean
  milestone?: boolean
  description?: string
  line: number
}
export interface GanttDocument {
  title?: string
  unit: string           // 'date' or a word
  isDate: boolean
  today?: number
  tasks: GanttTask[]
  sections: string[]
  errors: string[]
  warnings: string[]
}

const DAY = 86_400_000
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$|^(\d{1,2})\.(\d{1,2})\.(\d{4})$/
export function parseDate(s: string): number | undefined {
  const m = DATE_RE.exec(s.trim())
  if (!m) return
  const [y, mo, d] = m[1] ? [m[1], m[2], m[3]] : [m[6], m[5], m[4]]
  const t = Date.UTC(Number(y), Number(mo) - 1, Number(d))
  const back = new Date(t)
  // reject overflow like 2026-13-45 that Date.UTC silently rolls over
  if (back.getUTCFullYear() !== Number(y) || back.getUTCMonth() !== Number(mo) - 1 || back.getUTCDate() !== Number(d)) return
  return Math.round(t / DAY)
}
export function formatDay(day: number): string {
  const d = new Date(day * DAY)
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`
}

const ID = '[\\p{L}\\p{N}_.-]+'
const TASK_RE = new RegExp(`^(${ID})\\s+(.+?)\\s*:\\s*(.+?)\\s*(?:\\[([\\w\\s,]+)\\])?$`, 'u')
const FLAGS = ['crit', 'done', 'active', 'milestone']

interface Raw { id: string, label: string, section?: string, spec: string, flags: string[], line: number, description?: string }

export function parseGantt(code: string, src?: { kind?: string, columns: string[], rows: unknown[][] }): GanttDocument {
  const doc: GanttDocument = { unit: '', isDate: false, tasks: [], sections: [], errors: [], warnings: [] }
  const raws: Raw[] = []
  let section: string | undefined
  let todayRaw: string | undefined
  if (src) raws.push(...tableToRaw(src, doc))

  let last: Raw | undefined
  ;(code ?? '').replace(/\r\n?/g, '\n').split('\n').forEach((rawLine, i) => {
    const n = i + 1
    const t = rawLine.trim()
    if (t.startsWith('|')) { if (last) last.description = [last.description, t.slice(1).trim()].filter(Boolean).join(' '); else doc.errors.push(`Line ${n}: description must follow a task`); return }
    const line = rawLine.replace(/(^|\s{2,})#.*$/, '').trim()
    if (!line) return
    last = undefined
    let m: RegExpMatchArray | null
    if ((m = line.match(/^(title|unit|today)\s*:\s*(.+)$/i))) {
      const k = m[1]!.toLowerCase(), v = m[2]!.trim()
      if (k === 'title') doc.title = v
      else if (k === 'unit') doc.unit = v
      else todayRaw = v
      return
    }
    if ((m = line.match(/^section\s+(.+)$/i))) { section = m[1]!.trim(); return }
    if ((m = line.match(TASK_RE))) {
      const flags = (m[4] ?? '').split(/[\s,]+/).filter(Boolean).map(f => f.toLowerCase())
      for (const f of flags) if (!FLAGS.includes(f)) doc.errors.push(`Line ${n}: unknown flag "${f}" (${FLAGS.join(', ')})`)
      last = { id: m[1]!, label: m[2]!, section, spec: m[3]!, flags, line: n }
      raws.push(last)
      return
    }
    doc.errors.push(`Line ${n}: cannot parse "${line}" (expected "id Label : start - end")`)
  })

  // detect scale
  const anyDate = raws.some(r => DATE_RE.test(r.spec.split(/\s+-\s+|,/)[0]!.trim())) || (todayRaw && parseDate(todayRaw) !== undefined)
  doc.isDate = doc.unit === 'date' || (!doc.unit && !!anyDate)
  if (!doc.unit) doc.unit = doc.isDate ? 'date' : 'день'
  const num = (s: string, where: string): number | undefined => {
    const v = doc.isDate ? parseDate(s) : Number(String(s).trim().replace(',', '.'))
    if (v === undefined || Number.isNaN(v)) { doc.errors.push(`${where}: "${s}" is not a ${doc.isDate ? 'date (YYYY-MM-DD or DD.MM.YYYY)' : 'number'}`); return }
    return v
  }

  // resolve: explicit ranges first, then "after" chains (iterate until stable)
  const byId = new Map<string, GanttTask>()
  const pending: Raw[] = []
  const ids = new Set<string>()
  for (const r of raws) {
    if (ids.has(r.id)) doc.errors.push(`Line ${r.line}: duplicate task id "${r.id}"`)
    ids.add(r.id)
  }
  const make = (r: Raw, start: number, end: number, deps: string[] = []): GanttTask => ({
    id: r.id, label: r.label, section: r.section, start, end, deps, line: r.line, description: r.description,
    crit: r.flags.includes('crit'), done: r.flags.includes('done'), active: r.flags.includes('active'), milestone: r.flags.includes('milestone'),
  })
  for (const r of raws) {
    const where = `Line ${r.line} (${r.id})`
    if (/^after\s/i.test(r.spec)) { pending.push(r); continue }
    const range = r.spec.split(/\s+-\s+|\s*–\s*|\s*—\s*/)
    if (range.length === 2) {
      const a = num(range[0]!, where), b = num(range[1]!, where)
      if (a === undefined || b === undefined) continue
      if (b < a) { doc.errors.push(`${where}: end ${range[1]} is before start ${range[0]}`); continue }
      byId.set(r.id, make(r, a, b))
    }
    else if (range.length === 1 && (r.flags.includes('milestone') || !r.spec.includes(','))) {
      const a = num(range[0]!, where)
      if (a === undefined) continue
      byId.set(r.id, make(r, a, a))
      if (!r.flags.includes('milestone')) byId.get(r.id)!.milestone = true
    }
    else if (/^[^,]+,\s*\d+(\.\d+)?$/.test(r.spec)) {
      const [s, d] = r.spec.split(',')
      const a = num(s!, where), dur = Number(d)
      if (a === undefined) continue
      byId.set(r.id, make(r, a, a + Math.max(0, dur - 1)))
    }
    else doc.errors.push(`${where}: cannot read timing "${r.spec}" (use "start - end", "start, duration" or "after id, duration")`)
  }
  for (let guard = 0; pending.length && guard < 100; guard++) {
    for (let i = pending.length - 1; i >= 0; i--) {
      const r = pending[i]!
      const m = r.spec.match(/^after\s+(.+?)\s*,\s*(\d+(?:\.\d+)?)$/i)
      if (!m) { doc.errors.push(`Line ${r.line} (${r.id}): use "after id[, id…], duration" — e.g. "after rip, 30"`); pending.splice(i, 1); continue }
      const deps = m[1]!.split(/[\s,]+/).filter(Boolean)
      const missing = deps.filter(d => !ids.has(d))
      if (missing.length) { doc.errors.push(`Line ${r.line} (${r.id}): unknown dependency ${missing.map(x => `"${x}"`).join(', ')}`); pending.splice(i, 1); continue }
      if (deps.every(d => byId.has(d))) {
        const start = Math.max(...deps.map(d => byId.get(d)!.end)) + 1
        byId.set(r.id, make(r, start, start + Math.max(0, Number(m[2]) - 1), deps))
        pending.splice(i, 1)
      }
    }
  }
  for (const r of pending) doc.errors.push(`Line ${r.line} (${r.id}): circular dependency`)

  doc.tasks = raws.map(r => byId.get(r.id)).filter(Boolean) as GanttTask[]
  doc.sections = [...new Set(doc.tasks.map(t => t.section).filter(Boolean) as string[])]
  if (todayRaw) doc.today = num(todayRaw, 'today')
  // dependency sanity: task starting before its dependency ends
  for (const t of doc.tasks) for (const d of t.deps) {
    const dep = byId.get(d)
    if (dep && t.start <= dep.end) doc.warnings.push(`"${t.label}" starts before "${dep.label}" ends`)
  }
  if (!doc.tasks.length && !doc.errors.length) doc.errors.push('No tasks')
  return doc
}

function tableToRaw(src: { kind?: string, columns: string[], rows: unknown[][] }, doc: GanttDocument): Raw[] {
  if (src.kind && src.kind !== 'table') { doc.errors.push('gantt src must be a table'); return [] }
  const cols = src.columns.map(c => String(c).toLowerCase().trim())
  // match whole words anywhere in the header: "Дата начала", "Начало работ", "Start date"
  const col = (...n: string[]) => cols.findIndex(c => n.some(x => c === x || new RegExp(`(^|[^\\p{L}])${x}`, 'u').test(c)))
  const task = col('task', 'задач', 'этап', 'работ', 'наименование', 'name'), start = col('start', 'начал', 'старт')
  const end = col('end', 'finish', 'окончан', 'конец', 'завершен'), dur = col('duration', 'длительн', 'продолжительн')
  const after = col('after', 'depends', 'зависит', 'после'), sec = col('section', 'группа', 'раздел', 'фаза')
  const idc = col('id', 'код', '№'), flags = col('flags', 'статус', 'status'), desc = col('description', 'описание', 'примечание')
  if (task < 0 || (start < 0 && after < 0)) { doc.errors.push(`gantt src needs task + start (or after) columns (have: ${src.columns.join(', ')})`); return [] }
  const s = (v: unknown) => {
    if (typeof v === 'number' && v > 20000 && v < 80000 && /дат|date/.test(cols.join(' '))) return formatExcelDate(v)
    return String(coerce(v) ?? '').trim()
  }
  return src.rows.map((r, i): Raw | null => {
    const label = s(r[task]); if (!label) return null
    const id = (idc >= 0 && s(r[idc])) || `t${i + 1}`
    let spec: string
    if (after >= 0 && s(r[after])) spec = `after ${s(r[after])}, ${s(r[dur]) || 1}`
    else if (end >= 0 && s(r[end])) spec = `${s(r[start])} - ${s(r[end])}`
    else if (dur >= 0 && s(r[dur])) spec = `${s(r[start])}, ${s(r[dur])}`
    else spec = s(r[start])
    const fl = flags >= 0 ? s(r[flags]).toLowerCase() : ''
    const mapped = [/crit|крит/.test(fl) && 'crit', /done|готов|выполн/.test(fl) && 'done', /active|в работе|идёт/.test(fl) && 'active', /mile|веха/.test(fl) && 'milestone'].filter(Boolean) as string[]
    return { id: id.replace(/[^\p{L}\p{N}_.-]+/gu, '_'), label, section: sec >= 0 ? s(r[sec]) || undefined : undefined, spec, flags: mapped, line: 0, description: desc >= 0 ? s(r[desc]) || undefined : undefined }
  }).filter(Boolean) as Raw[]
}
/** Excel serial date → YYYY-MM-DD */
function formatExcelDate(n: number) {
  const d = new Date(Date.UTC(1899, 11, 30) + n * DAY)
  return d.toISOString().slice(0, 10)
}
