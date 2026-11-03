/**
 * viz-check — validates every visualization block in content/**.md (flow, graph, map, chart, gantt),
 * resolving src= files exactly like the site build does. Prints computed figures (route lengths,
 * haul distances, chart totals, schedule spans) so the author can reconcile them with the prose.
 *
 *   node <layer>/scripts/check.ts [contentDir] [--quiet]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { matchVizFence, loadSrc } from '../remark-viz.mjs'
import { parseFlow, applyOverrides, tableToFlowDsl } from '../shared/flow-dsl.ts'
import { parseMap, applyMapOverrides } from '../shared/map-dsl.ts'
import { resolveMap, formatDistance, formatChainage } from '../shared/map-geometry.ts'
import { parseChart, formatNumber } from '../shared/chart-dsl.ts'
import { parseGantt, formatDay } from '../shared/gantt-dsl.ts'

const args = process.argv.slice(2)
const quiet = args.includes('--quiet')
const contentDir = resolve(args.find(a => !a.startsWith('--')) ?? 'content')
const rootDir = resolve(contentDir, '..')
// Resolve markdown tooling from the *docs project* (cwd), not from the layer's real path:
// the layer is usually symlinked or cloned outside the project and has no node_modules.
const projectRequire = createRequire(join(process.cwd(), 'package.json'))
const load = async (id: string) => import(pathToFileURL(projectRequire.resolve(id)).href)
const [{ unified }, { default: remarkParse }, { default: remarkMdc }, { visit }] = await Promise.all(
  ['unified', 'remark-parse', 'remark-mdc', 'unist-util-visit'].map(load),
)
const processor = unified().use(remarkParse).use(remarkMdc)

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (p.endsWith('.md')) yield p
  }
}

const counts: Record<string, number> = {}
let errors = 0, warnings = 0
const info = (s: string) => { if (!quiet) console.log(s) }

for (const file of walk(contentDir)) {
  const tree = processor.parse(readFileSync(file, 'utf8'))
  visit(tree, 'code', (node: any) => {
    const m = matchVizFence(node.lang, node.meta)
    if (!m) return
    counts[m.component] = (counts[m.component] ?? 0) + 1
    const where = `${relative(process.cwd(), file)}:${node.position?.start.line ?? '?'} [${m.lang}]`
    const err = (s: string) => { errors++; console.error(`✖ ${where}: ${s}`) }
    const warn = (s: string) => { warnings++; console.warn(`⚠ ${where}: ${s}`) }
    const loaded = loadSrc(m.attrs, file, rootDir) as { data?: string, srcError?: string }
    if (loaded.srcError) { err(loaded.srcError); return }
    const src = loaded.data ? JSON.parse(loaded.data) : undefined
    const code: string = node.value ?? ''
    if (!/^\s*title\s*:/mi.test(code) && !m.attrs.title) warn('missing "title:"')

    if (m.component === 'flow-diagram') {
      const t = tableToFlowDsl(src)
      if (t.error) return err(t.error)
      const d = applyOverrides(parseFlow([t.dsl, code].filter(Boolean).join('\n')), { lang: m.lang, ...m.attrs })
      d.errors.forEach(e => err(e.message)); d.warnings.forEach(w => warn(w.message))
      if (d.nodes.length > 15) err(`${d.nodes.length} nodes > 15 — split the diagram`)
      if (d.mode === 'flow' && d.edges.length && d.edges.every(e => !e.label)) warn('flow without edge labels')
      if (d.nodes.length && d.nodes.every(n => !n.description)) warn('no node has a "| description"')
      info(`• ${where} ${d.nodes.length} nodes, ${d.edges.length} edges${m.attrs.src ? ` (src: ${m.attrs.src})` : ''}`)
    }
    else if (m.component === 'geo-map') {
      const d = applyMapOverrides(parseMap(code, src, { routeKind: m.attrs['route-kind'] ?? m.attrs.routeKind, pointKind: m.attrs['point-kind'] ?? m.attrs.pointKind }), m.attrs)
      d.errors.forEach(e => err(e.message)); d.warnings.forEach(w => warn(w.message))
      if (d.errors.length) return
      const g = resolveMap(d)
      g.errors.forEach(err)
      if (g.bounds && (g.bounds[2] - g.bounds[0] > 60 || g.bounds[3] - g.bounds[1] > 40)) warn('map spans > 60° — check lat/lon order')
      info(`• ${where}${m.attrs.src ? ` (src: ${m.attrs.src})` : ''}`)
      for (const r of g.routes) info(`    route ${r.id}: ${formatDistance(r.lengthKm, d.units)}`)
      for (const h of g.hauls) info(`    haul ${h.from.label} → ${h.to.label}: ${formatDistance(h.km, d.units)} ${h.alongRoute ? 'along route' : 'straight'}`)
      for (const p of g.places.filter(x => x.measureKm !== undefined)) info(`    at ${p.label}: ${formatChainage(p.measureKm!, d) ?? `${p.measureKm} km`}`)
      if (!g.routes.length) info(`    ${g.places.length} places`)
    }
    else if (m.component === 'viz-chart') {
      const head = [m.attrs.type && `type: ${m.attrs.type}`].filter(Boolean).join('\n')
      const d = parseChart([head, code].filter(Boolean).join('\n'), src)
      d.errors.forEach(err); d.warnings.forEach(warn)
      if (d.errors.length) return
      info(`• ${where} ${d.type}, ${d.categories.length} categories × ${d.series.length} series${m.attrs.src ? ` (src: ${m.attrs.src})` : ''}`)
      for (const s of d.series) info(`    ${s.name}: Σ ${formatNumber(s.values.reduce<number>((a, v) => a + (v ?? 0), 0))}${d.unit ? ` ${d.unit}` : ''}, max ${formatNumber(Math.max(...s.values.map(v => v ?? -Infinity)))}`)
      d.notes.forEach(n => info(`    note: ${n}`))
    }
    else if (m.component === 'viz-gantt') {
      const d = parseGantt([m.attrs.title && `title: ${m.attrs.title}`, code].filter(Boolean).join('\n'), src)
      d.errors.forEach(err); d.warnings.forEach(warn)
      if (!d.tasks.length) return
      const lo = Math.min(...d.tasks.map(t => t.start)), hi = Math.max(...d.tasks.map(t => t.end))
      const f = (v: number) => (d.isDate ? formatDay(v) : `${v}`)
      info(`• ${where} ${d.tasks.length} tasks, ${f(lo)} – ${f(hi)}${d.isDate ? '' : ` ${d.unit}`} (${hi - lo + 1} ${d.isDate ? 'days' : d.unit})`)
    }
  })
}
const summary = Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ') || 'no blocks'
console.log(`\n${summary} · ${errors} error(s) · ${warnings} warning(s)`)
process.exit(errors ? 1 : 0)
