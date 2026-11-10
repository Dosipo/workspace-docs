<script setup lang="ts">
import { computed, ref } from 'vue'
import { parseChart, niceTicks, formatNumber } from '../../../shared/chart-dsl'
import '../../assets/viz-chart.css'

const props = defineProps<{
  code?: string
  data?: string
  srcError?: string
  src?: string
  title?: string
  type?: string
  height?: string | number
}>()

const doc = computed(() => {
  let src: any
  try { src = props.data ? JSON.parse(props.data) : undefined } catch {}
  // fence meta (type=, title=) acts like directives written first in the body
  const head = [props.type && `type: ${props.type}`, props.title && `title: ${props.title}`].filter(Boolean).join('\n')
  const d = parseChart([head, props.code ?? ''].filter(Boolean).join('\n'), src)
  if (props.srcError) d.errors.unshift(props.srcError)
  return d
})
const ok = computed(() => !doc.value.errors.length && doc.value.categories.length > 0)

// Categorical palette from the site theme: Nuxt UI chart tokens (--ui-chart-1..6), set per theme.
const PALETTE = [1, 2, 3, 4, 5, 6].map(i => `var(--ui-chart-${i})`)
const color = (i: number) => PALETTE[i % PALETTE.length]

const W = 720
const H = computed(() => {
  const h = props.height
  if (h && /^\d+$/.test(String(h))) return Number(h)
  if (doc.value.type === 'hbar') return Math.min(640, 48 + doc.value.categories.length * 30 * (doc.value.series.length > 1 ? 1.4 : 1))
  if (doc.value.type === 'pie') return 300
  return 320
})
const M = computed(() => {
  const d = doc.value
  const longest = Math.max(0, ...d.categories.map(c => c.length))
  if (d.type === 'hbar') return { t: 12, r: 64, b: 28, l: Math.min(260, 16 + longest * 7) }
  const band = (W - 80) / Math.max(1, d.categories.length)
  const fitsTwoLines = longest <= Math.floor(band / 6.6) * 2
  const rotate = !fitsTwoLines && d.categories.length > 4
  return { t: 16, r: 16, b: rotate ? Math.min(120, 24 + longest * 5) : (longest > Math.floor(band / 6.6) ? 50 : 36), l: 64 }
})
const rotateLabels = computed(() => doc.value.type !== 'hbar' && M.value.b > 60)

const stacked = computed(() => doc.value.type === 'stacked')
const extent = computed(() => {
  const d = doc.value
  let max = 0, min = 0
  d.categories.forEach((_, i) => {
    if (stacked.value) {
      const pos = d.series.reduce((s, x) => s + Math.max(0, x.values[i] ?? 0), 0)
      const neg = d.series.reduce((s, x) => s + Math.min(0, x.values[i] ?? 0), 0)
      max = Math.max(max, pos); min = Math.min(min, neg)
    }
    else for (const s of d.series) { const v = s.values[i] ?? 0; max = Math.max(max, v); min = Math.min(min, v) }
  })
  const ticks = niceTicks(min, max)
  return { ticks, lo: ticks[0]!, hi: ticks[ticks.length - 1]! }
})

// value → pixel along the value axis
const plotW = computed(() => W - M.value.l - M.value.r)
const plotH = computed(() => H.value - M.value.t - M.value.b)
const vScale = (v: number) => {
  const { lo, hi } = extent.value
  const len = doc.value.type === 'hbar' ? plotW.value : plotH.value
  return ((v - lo) / (hi - lo || 1)) * len
}

interface Bar { x: number, y: number, w: number, h: number, v: number, s: number, c: number }
const bars = computed<Bar[]>(() => {
  const d = doc.value
  if (!['bar', 'hbar', 'stacked'].includes(d.type)) return []
  const n = d.categories.length, k = stacked.value ? 1 : d.series.length
  const horizontal = d.type === 'hbar'
  const band = (horizontal ? plotH.value : plotW.value) / n
  const inner = band * 0.72, bw = inner / k
  const zero = vScale(0)
  const out: Bar[] = []
  d.categories.forEach((_, c) => {
    let posAcc = 0, negAcc = 0
    d.series.forEach((s, si) => {
      const v = s.values[c]
      if (v == null) return
      let a: number, b: number
      if (stacked.value) {
        if (v >= 0) { a = posAcc; posAcc += v; b = posAcc } else { a = negAcc; negAcc += v; b = negAcc }
      }
      else { a = 0; b = v }
      const p0 = vScale(a), p1 = vScale(b)
      const off = band * c + (band - inner) / 2 + (stacked.value ? 0 : bw * si)
      if (horizontal) out.push({ x: M.value.l + Math.min(p0, p1), y: M.value.t + off, w: Math.max(1, Math.abs(p1 - p0)), h: bw - 2, v, s: si, c })
      else out.push({ x: M.value.l + off, y: M.value.t + plotH.value - Math.max(p0, p1), w: bw - 2, h: Math.max(1, Math.abs(p1 - p0)), v, s: si, c })
    })
  })
  void zero
  return out
})

const lines = computed(() => {
  const d = doc.value
  if (d.type !== 'line' && d.type !== 'area') return []
  const n = d.categories.length
  const step = n > 1 ? plotW.value / (n - 1) : 0
  const base = M.value.t + plotH.value - vScale(Math.max(0, extent.value.lo))
  return d.series.map((s, si) => {
    const pts = s.values.map((v, i) => (v == null ? null : [M.value.l + (n > 1 ? step * i : plotW.value / 2), M.value.t + plotH.value - vScale(v)] as [number, number]))
    const segs: [number, number][][] = []
    let cur: [number, number][] = []
    for (const p of pts) { if (p) cur.push(p); else if (cur.length) { segs.push(cur); cur = [] } }
    if (cur.length) segs.push(cur)
    const path = segs.map(sg => `M${sg.map(p => p.join(',')).join('L')}`).join('')
    const area = d.type === 'area' ? segs.map(sg => `M${sg[0]![0]},${base}L${sg.map(p => p.join(',')).join('L')}L${sg[sg.length - 1]![0]},${base}Z`).join('') : ''
    return { si, path, area, pts }
  })
})

const pie = computed(() => {
  const d = doc.value
  if (d.type !== 'pie') return []
  const vals = d.series[0]!.values.map(v => Math.max(0, v ?? 0))
  const total = vals.reduce((a, b) => a + b, 0) || 1
  const cx = 150, cy = H.value / 2, r = Math.min(cy - 12, 130), ri = r * 0.58
  let a = -Math.PI / 2
  return vals.map((v, i) => {
    const sweep = (v / total) * Math.PI * 2
    const a2 = a + sweep
    const large = sweep > Math.PI ? 1 : 0
    // round: avoids SSR/client float drift in hydration and keeps the HTML small
    const r2 = (v: number) => Math.round(v * 100) / 100
    const p = (ang: number, rad: number) => `${r2(cx + rad * Math.cos(ang))},${r2(cy + rad * Math.sin(ang))}`
    const path = sweep >= Math.PI * 2 - 1e-9
      ? `M${p(0, r)}A${r},${r} 0 1 1 ${p(Math.PI, r)}A${r},${r} 0 1 1 ${p(0, r)}M${p(0, ri)}A${ri},${ri} 0 1 0 ${p(Math.PI, ri)}A${ri},${ri} 0 1 0 ${p(0, ri)}Z`
      : `M${p(a, r)}A${r},${r} 0 ${large} 1 ${p(a2, r)}L${p(a2, ri)}A${ri},${ri} 0 ${large} 0 ${p(a, ri)}Z`
    const out = { i, path, v, pct: v / total }
    a = a2
    return out
  })
})
const pieTotal = computed(() => pie.value.reduce((s, p) => s + p.v, 0))

// --- hover -----------------------------------------------------------------
const hover = ref<{ c: number, s?: number } | null>(null)
const tip = computed(() => {
  const h = hover.value, d = doc.value
  if (!h) return null
  const cat = d.categories[h.c]
  const rows = (h.s !== undefined ? [d.series[h.s]!] : d.series).map((s, k) => ({ name: s.name, v: s.values[h.c], color: color(h.s ?? k) }))
  return { cat, rows }
})
const fmt = (v: number | null | undefined) => (v == null ? '—' : `${formatNumber(v)}${doc.value.unit ? ` ${doc.value.unit}` : ''}`)
const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
/** Splits a category label into ≤ 2 lines that fit `maxChars` each (word-wise, ellipsis on overflow). */
function wrap(s: string, maxChars: number): string[] {
  if (s.length <= maxChars) return [s]
  const words = s.split(/\s+/)
  const lines: string[] = ['']
  for (const w of words) {
    const cur = lines[lines.length - 1]!
    if (!cur) lines[lines.length - 1] = w
    else if ((cur + ' ' + w).length <= maxChars) lines[lines.length - 1] = cur + ' ' + w
    else if (lines.length < 2) lines.push(w)
    else { lines[1] = truncate(lines[1] + ' ' + w, maxChars); break }
  }
  return lines.map(l => truncate(l, maxChars))
}
const bandChars = computed(() => {
  const n = doc.value.categories.length || 1
  const band = (doc.value.type === 'line' || doc.value.type === 'area') ? plotW.value / Math.max(1, n - 1) : plotW.value / n
  return Math.max(4, Math.floor(band / 6.6))
})
</script>

<template>
  <figure class="viz-chart not-prose">
    <header class="viz-chart__header">
      <span class="viz-chart__badge"><UIcon name="i-lucide-chart-column" /> График</span>
      <span class="viz-chart__title">{{ doc.title || 'Данные' }}</span>
      <span v-if="src" class="viz-chart__src" :title="`Источник: ${src}`"><UIcon name="i-lucide-file-spreadsheet" /> {{ src }}</span>
    </header>

    <div v-if="doc.errors.length" class="viz-chart__errors">
      <p v-for="(e, i) in doc.errors" :key="i"><UIcon name="i-lucide-triangle-alert" /> {{ e }}</p>
    </div>

    <div v-if="ok" class="viz-chart__body" @mouseleave="hover = null">
      <svg :viewBox="`0 0 ${W} ${H}`" class="viz-chart__svg" role="img" :aria-label="doc.title || 'chart'">
        <!-- value grid -->
        <g v-if="doc.type !== 'pie'" class="viz-chart__grid">
          <template v-for="t in extent.ticks" :key="t">
            <template v-if="doc.type === 'hbar'">
              <line :x1="M.l + vScale(t)" :x2="M.l + vScale(t)" :y1="M.t" :y2="M.t + plotH" :class="{ zero: t === 0 }" />
              <text :x="M.l + vScale(t)" :y="H - 8" text-anchor="middle">{{ formatNumber(t, true) }}</text>
            </template>
            <template v-else>
              <line :x1="M.l" :x2="M.l + plotW" :y1="M.t + plotH - vScale(t)" :y2="M.t + plotH - vScale(t)" :class="{ zero: t === 0 }" />
              <text :x="M.l - 8" :y="M.t + plotH - vScale(t) + 4" text-anchor="end">{{ formatNumber(t, true) }}</text>
            </template>
          </template>
        </g>

        <!-- category labels -->
        <g v-if="doc.type !== 'pie'" class="viz-chart__cats">
          <template v-for="(c, i) in doc.categories" :key="i">
            <text
              v-if="doc.type === 'hbar'"
              :x="M.l - 8" :y="M.t + (plotH / doc.categories.length) * (i + 0.5) + 4" text-anchor="end"
            >{{ truncate(c, 36) }}<title>{{ c }}</title></text>
            <text
              v-else-if="doc.categories.length <= 24 || i % Math.ceil(doc.categories.length / 24) === 0"
              :x="M.l + (doc.type === 'line' || doc.type === 'area' ? (doc.categories.length > 1 ? (plotW / (doc.categories.length - 1)) * i : plotW / 2) : (plotW / doc.categories.length) * (i + 0.5))"
              :y="M.t + plotH + 16"
              :text-anchor="rotateLabels ? 'end' : 'middle'"
              :transform="rotateLabels ? `rotate(-35 ${M.l + (plotW / doc.categories.length) * (i + 0.5)} ${M.t + plotH + 16})` : undefined"
            ><template v-if="rotateLabels">{{ truncate(c, 22) }}</template><template v-else><tspan v-for="(ln, k) in wrap(c, bandChars)" :key="k" :x="M.l + (doc.type === 'line' || doc.type === 'area' ? (doc.categories.length > 1 ? (plotW / (doc.categories.length - 1)) * i : plotW / 2) : (plotW / doc.categories.length) * (i + 0.5))" :dy="k ? 13 : 0">{{ ln }}</tspan></template><title>{{ c }}</title></text>
          </template>
        </g>

        <!-- bars -->
        <rect
          v-for="(b, i) in bars" :key="`b${i}`"
          :x="b.x" :y="b.y" :width="Math.max(0, b.w)" :height="Math.max(0, b.h)" rx="3"
          :fill="color(b.s)" class="viz-chart__bar"
          :class="{ dim: hover && hover.c !== b.c }"
          @mouseenter="hover = { c: b.c, s: doc.series.length > 1 && !stacked ? b.s : undefined }"
        />
        <!-- value labels on single-series hbar -->
        <template v-if="doc.type === 'hbar' && doc.series.length === 1">
          <text v-for="(b, i) in bars" :key="`v${i}`" :x="b.x + b.w + 6" :y="b.y + b.h / 2 + 4" class="viz-chart__value">{{ formatNumber(b.v, true) }}</text>
        </template>

        <!-- lines / areas -->
        <g v-for="l in lines" :key="`l${l.si}`">
          <path v-if="l.area" :d="l.area" :fill="color(l.si)" class="viz-chart__area" />
          <path :d="l.path" :stroke="color(l.si)" class="viz-chart__line" />
          <template v-for="(p, i) in l.pts" :key="i">
            <circle v-if="p" :cx="p[0]" :cy="p[1]" :r="hover?.c === i ? 5 : (doc.categories.length <= 30 ? 3 : 0)" :fill="color(l.si)" class="viz-chart__dot" />
          </template>
        </g>
        <template v-if="lines.length">
          <rect
            v-for="(c, i) in doc.categories" :key="`h${i}`"
            :x="M.l + (doc.categories.length > 1 ? (plotW / (doc.categories.length - 1)) * (i - 0.5) : 0)" :y="M.t"
            :width="doc.categories.length > 1 ? plotW / (doc.categories.length - 1) : plotW" :height="plotH"
            fill="transparent" @mouseenter="hover = { c: i }"
          />
        </template>

        <!-- pie -->
        <g v-if="pie.length">
          <path
            v-for="p in pie" :key="p.i" :d="p.path" :fill="color(p.i)" class="viz-chart__slice"
            :class="{ dim: hover && hover.c !== p.i }" @mouseenter="hover = { c: p.i }"
          />
          <text :x="150" :y="H / 2 - 2" text-anchor="middle" class="viz-chart__pie-total">{{ formatNumber(pieTotal, true) }}</text>
          <text :x="150" :y="H / 2 + 16" text-anchor="middle" class="viz-chart__pie-unit">{{ doc.unit || 'всего' }}</text>
          <g v-for="p in pie" :key="`lg${p.i}`" :transform="`translate(320 ${H / 2 - pie.length * 13 + p.i * 26})`" class="viz-chart__pie-legend" @mouseenter="hover = { c: p.i }">
            <rect width="12" height="12" rx="3" :fill="color(p.i)" />
            <text x="20" y="10">{{ truncate(doc.categories[p.i]!, 30) }}</text>
            <text x="380" y="10" text-anchor="end" class="num">{{ (p.pct * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) }}%</text>
          </g>
        </g>
      </svg>

      <div v-if="tip" class="viz-chart__tip">
        <strong>{{ tip.cat }}</strong>
        <span v-for="r in tip.rows" :key="r.name"><i :style="{ background: r.color }" />{{ r.name }}: <b>{{ fmt(r.v) }}</b></span>
      </div>
    </div>

    <ul v-if="ok && doc.series.length > 1 && doc.type !== 'pie'" class="viz-chart__legend">
      <li v-for="(s, i) in doc.series" :key="s.name"><i :style="{ background: color(i) }" />{{ s.name }}</li>
    </ul>

    <footer v-if="doc.notes.length || doc.warnings.length" class="viz-chart__notes">
      <span v-for="n in doc.notes" :key="n">{{ n }}</span>
      <span v-for="w in doc.warnings" :key="w" class="warn">⚠ {{ w }}</span>
    </footer>

    <!-- SSR data table: accessible, searchable, works without JS -->
    <details v-if="ok" class="viz-chart__source">
      <summary>Таблица данных</summary>
      <table>
        <thead><tr><th /><th v-for="s in doc.series" :key="s.name">{{ s.name }}</th></tr></thead>
        <tbody>
          <tr v-for="(c, i) in doc.categories" :key="i"><td>{{ c }}</td><td v-for="s in doc.series" :key="s.name">{{ fmt(s.values[i]) }}</td></tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>
