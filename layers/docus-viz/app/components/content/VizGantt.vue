<script setup lang="ts">
import { computed, ref } from 'vue'
import { parseGantt, formatDay } from '../../../shared/gantt-dsl'
import type { GanttTask } from '../../../shared/gantt-dsl'
import { niceTicks } from '../../../shared/chart-dsl'
import { plural } from '../../../shared/plural'
import '../../assets/viz-chart.css'

const props = defineProps<{ code?: string, data?: string, srcError?: string, src?: string, title?: string }>()
// SSR-stable id for the arrow marker (several Gantts per page)
const markerId = `gantt-arrow-${useId()}`

const doc = computed(() => {
  let src: any
  try { src = props.data ? JSON.parse(props.data) : undefined } catch {}
  const d = parseGantt([props.title && `title: ${props.title}`, props.code ?? ''].filter(Boolean).join('\n'), src)
  if (props.srcError) d.errors.unshift(props.srcError)
  return d
})
const ok = computed(() => doc.value.tasks.length > 0)

const W = 720, ROW = 30, HEAD = 28
const labelW = computed(() => Math.min(260, 24 + Math.max(...doc.value.tasks.map(t => t.label.length), 6) * 7))
const range = computed(() => {
  const ts = doc.value.tasks
  // a task covering units [start, end] occupies [start, end + 1) on the axis
  const lo = Math.min(...ts.map(t => t.start)), hi = Math.max(...ts.map(t => t.end + 1))
  return { lo, hi: hi === lo ? lo + 1 : hi }
})
const x = (v: number) => labelW.value + ((v - range.value.lo) / (range.value.hi - range.value.lo)) * (W - labelW.value - 16)

// rows: section headers interleaved with tasks
type Row = { type: 'section', label: string } | { type: 'task', task: GanttTask }
const rows = computed<Row[]>(() => {
  const out: Row[] = []
  let cur: string | undefined
  for (const t of doc.value.tasks) {
    if (t.section && t.section !== cur) { out.push({ type: 'section', label: t.section }); cur = t.section }
    out.push({ type: 'task', task: t })
  }
  return out
})
const H = computed(() => HEAD + rows.value.length * ROW + 8)
const rowY = (i: number) => HEAD + i * ROW
const yOf = computed(() => Object.fromEntries(rows.value.map((r, i) => (r.type === 'task' ? [r.task.id, rowY(i)] : null)).filter(Boolean) as [string, number][]))

const ticks = computed(() => {
  const { lo, hi } = range.value
  if (!doc.value.isDate) {
    // label the start of each unit cell: tick "20" marks where unit 20 begins
    const ts = niceTicks(lo - 1, hi - 1, 8).filter(v => v >= lo - 1 && v <= hi - 1)
    return ts.map(v => ({ v: Math.max(v, lo), label: String(Math.max(v, lo)) })).filter((t, i, a) => a.findIndex(x => x.v === t.v) === i)
  }
  // dates: month starts, or weeks if short
  const span = hi - lo
  const out: { v: number, label: string }[] = []
  const d0 = new Date(lo * 86_400_000)
  if (span > 70) {
    for (let d = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + 1, 1)); d.getTime() / 86_400_000 <= hi; d.setUTCMonth(d.getUTCMonth() + 1)) {
      out.push({ v: d.getTime() / 86_400_000, label: d.toLocaleDateString('ru-RU', { month: 'short', year: span > 400 ? '2-digit' : undefined, timeZone: 'UTC' }) })
    }
  }
  else for (let v = lo; v <= hi; v += span > 21 ? 7 : 1) out.push({ v, label: formatDay(v).slice(0, 5) })
  return out
})

const fmtT = (v: number) => (doc.value.isDate ? formatDay(v) : `${v}`)
const span = (t: GanttTask) => (t.milestone ? fmtT(t.start) : `${fmtT(t.start)} – ${fmtT(t.end)}`)
const len = (t: GanttTask) => (t.milestone ? '' : plural(t.end - t.start + 1, doc.value.isDate ? 'день' : doc.value.unit))
const unitLabel = computed(() => (doc.value.isDate ? '' : doc.value.unit))

const selected = ref<GanttTask | null>(null)
const depsPaths = computed(() => {
  const out: { d: string, crit: boolean }[] = []
  for (const t of doc.value.tasks) for (const dep of t.deps) {
    const a = doc.value.tasks.find(x => x.id === dep)
    if (!a || yOf.value[a.id] === undefined || yOf.value[t.id] === undefined) continue
    const x1 = x(a.end + 1), y1 = yOf.value[a.id]! + ROW / 2
    const x2 = x(t.start), y2 = yOf.value[t.id]! + ROW / 2
    const mx = Math.max(x1 + 6, Math.min(x2 - 6, x1 + 10))
    out.push({ d: `M${x1},${y1}H${mx}V${y2}H${x2 - 3}`, crit: !!(a.crit && t.crit) })
  }
  return out
})
</script>

<template>
  <figure class="viz-gantt not-prose">
    <header class="viz-gantt__header">
      <span class="viz-gantt__badge"><UIcon name="i-lucide-calendar-range" /> План</span>
      <span class="viz-gantt__title">{{ doc.title || 'Календарный план' }}</span>
      <span v-if="src" class="viz-gantt__src"><UIcon name="i-lucide-file-spreadsheet" /> {{ src }}</span>
    </header>

    <div v-if="doc.errors.length" class="viz-gantt__errors">
      <p v-for="(e, i) in doc.errors" :key="i"><UIcon name="i-lucide-triangle-alert" /> {{ e }}</p>
    </div>

    <div v-if="ok" class="viz-gantt__body">
      <svg :viewBox="`0 0 ${W} ${H}`" class="viz-gantt__svg" role="img" :aria-label="doc.title || 'gantt'">
        <defs>
          <marker :id="markerId" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L6,3L0,6z" class="viz-gantt__arrowhead" /></marker>
        </defs>
        <!-- time grid -->
        <g class="viz-gantt__grid">
          <template v-for="t in ticks" :key="t.v">
            <line :x1="x(t.v)" :x2="x(t.v)" :y1="HEAD - 6" :y2="H" />
            <text :x="x(t.v)" :y="HEAD - 12" text-anchor="middle">{{ t.label }}</text>
          </template>
          <text v-if="unitLabel" :x="labelW - 8" :y="HEAD - 12" text-anchor="end" class="unit">{{ unitLabel }}</text>
        </g>
        <!-- rows -->
        <template v-for="(r, i) in rows" :key="i">
          <g v-if="r.type === 'section'">
            <rect :x="0" :y="rowY(i)" :width="W" :height="ROW" class="viz-gantt__section-bg" />
            <text :x="8" :y="rowY(i) + ROW / 2 + 4" class="viz-gantt__section">{{ r.label }}</text>
          </g>
          <g v-else class="viz-gantt__row" :class="{ sel: selected?.id === r.task.id }" @click="selected = selected?.id === r.task.id ? null : r.task">
            <rect :x="0" :y="rowY(i)" :width="W" :height="ROW" class="viz-gantt__hit" />
            <text :x="r.task.section ? 20 : 8" :y="rowY(i) + ROW / 2 + 4" class="viz-gantt__label">{{ r.task.label.length > 34 ? `${r.task.label.slice(0, 33)}…` : r.task.label }}<title>{{ r.task.label }}</title></text>
            <path
              v-if="r.task.milestone"
              :d="`M${x(r.task.start)},${rowY(i) + 6}l9,9l-9,9l-9,-9z`"
              class="viz-gantt__milestone" :class="{ crit: r.task.crit, done: r.task.done }"
            />
            <rect
              v-else
              :x="x(r.task.start)" :y="rowY(i) + 7" :width="Math.max(3, x(r.task.end + 1) - x(r.task.start))" :height="ROW - 14" rx="4"
              class="viz-gantt__bar" :class="{ crit: r.task.crit, done: r.task.done, active: r.task.active }"
            />
            <text
              v-if="!r.task.milestone && x(r.task.end + 1) - x(r.task.start) > 56"
              :x="x(r.task.start) + 6" :y="rowY(i) + ROW / 2 + 4" class="viz-gantt__bar-text"
            >{{ len(r.task) }}</text>
            <text
              v-else
              :x="x(r.task.milestone ? r.task.start : r.task.end + 1) + (x(r.task.milestone ? r.task.start : r.task.end + 1) > W - 90 ? -14 : 12)"
              :text-anchor="x(r.task.milestone ? r.task.start : r.task.end + 1) > W - 90 ? 'end' : 'start'"
              :y="rowY(i) + ROW / 2 + 4" class="viz-gantt__aside"
            >{{ r.task.milestone ? fmtT(r.task.start) : len(r.task) }}</text>
          </g>
        </template>
        <!-- dependencies -->
        <path v-for="(p, i) in depsPaths" :key="`d${i}`" :d="p.d" class="viz-gantt__dep" :class="{ crit: p.crit }" :marker-end="`url(#${markerId})`" />
        <!-- today -->
        <g v-if="doc.today !== undefined && doc.today >= range.lo && doc.today <= range.hi">
          <line :x1="x(doc.today)" :x2="x(doc.today)" :y1="HEAD - 4" :y2="H" class="viz-gantt__today" />
          <text :x="x(doc.today) + 4" :y="H - 4" class="viz-gantt__today-label">сейчас</text>
        </g>
      </svg>
    </div>

    <div v-if="selected" class="viz-gantt__card">
      <p class="viz-gantt__card-title">{{ selected.label }}</p>
      <p class="viz-gantt__card-meta">{{ span(selected) }}<template v-if="len(selected)"> · {{ len(selected) }}</template><template v-if="selected.deps.length"> · после: {{ selected.deps.map(d => doc.tasks.find(t => t.id === d)?.label ?? d).join(', ') }}</template></p>
      <p v-if="selected.description" class="viz-gantt__card-desc">{{ selected.description }}</p>
    </div>

    <footer v-if="ok" class="viz-gantt__footer">
      {{ plural(doc.tasks.length, 'задача') }} · {{ fmtT(range.lo) }} – {{ fmtT(range.hi - 1) }}<template v-if="!doc.isDate"> ({{ plural(range.hi - range.lo, doc.unit) }})</template>
      <template v-if="doc.tasks.some(t => t.crit)"> · <span class="crit-key" /> критический путь</template>
      <span v-for="w in doc.warnings" :key="w" class="warn"> · ⚠ {{ w }}</span>
    </footer>

    <details v-if="ok" class="viz-gantt__source">
      <summary>Таблица этапов</summary>
      <table>
        <thead><tr><th>Задача</th><th>Сроки</th><th>Длительность</th></tr></thead>
        <tbody><tr v-for="t in doc.tasks" :key="t.id"><td>{{ t.section ? `${t.section} · ` : '' }}{{ t.label }}</td><td>{{ span(t) }}</td><td>{{ len(t) || 'веха' }}</td></tr></tbody>
      </table>
    </details>
  </figure>
</template>

<style>
.viz-gantt__body { padding: 0.5rem 0.75rem 0.25rem; overflow-x: auto; }
.viz-gantt__svg { display: block; width: 100%; min-width: 560px; height: auto; }
.viz-gantt__grid line { stroke: var(--ui-border); }
.viz-gantt__grid text { fill: var(--ui-text-muted); font-size: 11px; font-variant-numeric: tabular-nums; }
.viz-gantt__grid text.unit { fill: var(--ui-text-dimmed); }
.viz-gantt__section-bg { fill: var(--ui-bg-muted); }
.viz-gantt__section { fill: var(--ui-text-highlighted); font-size: 12px; font-weight: 600; }
.viz-gantt__hit { fill: transparent; cursor: pointer; }
.viz-gantt__row:hover .viz-gantt__hit, .viz-gantt__row.sel .viz-gantt__hit { fill: color-mix(in oklab, var(--ui-primary) 6%, transparent); }
.viz-gantt__label { fill: var(--ui-text-toned); font-size: 12.5px; pointer-events: none; }
.viz-gantt__bar { fill: color-mix(in oklab, var(--ui-primary) 70%, var(--ui-bg)); pointer-events: none; }
.viz-gantt__bar.crit { fill: #ea580c; }
.viz-gantt__bar.done { fill: var(--ui-border-accented); }
.viz-gantt__bar.active { stroke: var(--ui-primary); stroke-width: 2; }
.viz-gantt__bar-text { fill: #fff; font-size: 11px; font-weight: 500; pointer-events: none; font-variant-numeric: tabular-nums; }
.viz-gantt__aside { fill: var(--ui-text-muted); font-size: 11px; pointer-events: none; font-variant-numeric: tabular-nums; }
.viz-gantt__milestone { fill: var(--ui-text-highlighted); pointer-events: none; }
.viz-gantt__milestone.crit { fill: #ea580c; }
.viz-gantt__milestone.done { fill: var(--ui-border-accented); }
.viz-gantt__dep { fill: none; stroke: var(--ui-text-dimmed); stroke-width: 1.25; }
.viz-gantt__dep.crit { stroke: #ea580c; }
.viz-gantt__arrowhead { fill: var(--ui-text-dimmed); }
.viz-gantt__today { stroke: #dc2626; stroke-width: 1.5; stroke-dasharray: 4 3; }
.viz-gantt__today-label { fill: #dc2626; font-size: 11px; }
.viz-gantt__card { margin: 0 0.75rem 0.75rem; padding: 0.625rem 0.875rem; border: 1px solid var(--ui-border); border-radius: var(--ui-radius); background: var(--ui-bg-muted); }
.viz-gantt__card-title { margin: 0; font-weight: 600; color: var(--ui-text-highlighted); }
.viz-gantt__card-meta { margin: 0.125rem 0 0; color: var(--ui-text-muted); font-size: 0.8125rem; font-variant-numeric: tabular-nums; }
.viz-gantt__card-desc { margin: 0.375rem 0 0; color: var(--ui-text-toned); }
.viz-gantt__footer { padding: 0.5rem 1rem; border-top: 1px solid var(--ui-border); background: var(--ui-bg-muted); color: var(--ui-text-muted); font-size: 0.8125rem; }
.viz-gantt__footer .crit-key { display: inline-block; width: 10px; height: 6px; border-radius: 2px; background: #ea580c; vertical-align: middle; }
.viz-gantt__footer .warn { color: var(--ui-warning, #d97706); }
</style>
