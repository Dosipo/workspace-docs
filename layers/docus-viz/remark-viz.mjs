/**
 * docus-viz remark plugin — one entry point for every visualization block.
 *
 *   ```flow | process | graph   → <FlowDiagram>
 *   ```map  | geo               → <GeoMap>
 *   ```chart                    → <VizChart>
 *   ```gantt                    → <VizGantt>
 *
 * Fence meta becomes props: ```chart {src=hours.xlsx sheet="Маш-часы" type=bar height=320}
 * `src=` is resolved at build time — first in <rootDir>/data/, then next to the .md file —
 * read with ./sources (csv, tsv, xlsx, json, geojson, kml, kmz, gpx) and embedded as JSON,
 * so the page works offline, is searchable, and the source file never ships to the client.
 */
import { existsSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { readSource } from './sources/index.mjs'

export const BLOCKS = {
  flow: 'flow-diagram', process: 'flow-diagram', graph: 'flow-diagram',
  map: 'geo-map', geo: 'geo-map',
  chart: 'viz-chart',
  gantt: 'viz-gantt',
}
const FENCE_LANG_RE = new RegExp(`^(${Object.keys(BLOCKS).join('|')})(\\{.*\\})?$`)

export function parseMeta(meta) {
  const attrs = {}
  if (!meta) return attrs
  const body = meta.trim().replace(/^\{|\}$/g, '')
  for (const m of body.matchAll(/([\w-]+)(?:=("[^"]*"|'[^']*'|\S+))?/g)) {
    attrs[m[1]] = m[2] === undefined ? 'true' : m[2].replace(/^["']|["']$/g, '')
  }
  return attrs
}

/** `{ lang, component, attrs }` when a fenced code block is a viz block, else null. */
export function matchVizFence(lang, meta) {
  const m = FENCE_LANG_RE.exec(lang || '')
  if (!m) return null
  const attrs = parseMeta([m[2], meta].filter(Boolean).join(' '))
  if (m[1] === 'graph' && !attrs.mode) attrs.mode = 'graph'
  return { lang: m[1], component: BLOCKS[m[1]], attrs }
}
// back-compat names used by older checkers/tests
export const matchFlowFence = (l, m) => { const r = matchVizFence(l, m); return r && r.component === 'flow-diagram' ? { lang: r.lang, attrs: r.attrs } : null }
export const matchMapFence = (l, m) => { const r = matchVizFence(l, m); return r && r.component === 'geo-map' ? { lang: r.lang, attrs: r.attrs } : null }

/** Finds the data file for `src` given the markdown file path and project root. */
export function resolveSrc(src, mdPath, rootDir) {
  const candidates = isAbsolute(src) ? [src] : [
    rootDir && join(rootDir, 'data', src),
    mdPath && join(dirname(mdPath), src),
    rootDir && join(rootDir, src),
  ].filter(Boolean)
  const hit = candidates.find(p => existsSync(p) && statSync(p).isFile())
  if (!hit) return { error: `src "${src}" not found (looked in: ${candidates.map(p => rootDir ? relative(rootDir, p) : p).join(', ')})` }
  if (rootDir && relative(resolve(rootDir), resolve(hit)).startsWith('..')) return { error: `src "${src}" is outside the project` }
  return { path: hit }
}

/** Reads and embeds `src` data; never throws — errors are surfaced on the page. */
export function loadSrc(attrs, mdPath, rootDir) {
  if (!attrs.src) return {}
  const r = resolveSrc(attrs.src, mdPath, rootDir)
  if (r.error) return { srcError: r.error }
  try {
    const data = readSource(r.path, { sheet: attrs.sheet, range: attrs.range, header: attrs.header, delimiter: attrs.delimiter })
    return { data: JSON.stringify(data) }
  }
  catch (e) {
    return { srcError: `src "${attrs.src}": ${e.message}` }
  }
}

function walk(node, fn) {
  if (!node.children) return
  node.children.forEach((child, i) => {
    const replacement = fn(child)
    if (replacement) node.children[i] = replacement
    else walk(child, fn)
  })
}

export default function remarkViz(options = {}) {
  return (tree, file) => {
    const mdPath = file?.path || file?.history?.[0]
    const rootDir = options.rootDir || file?.cwd
    walk(tree, (node) => {
      if (node.type !== 'code') return
      const match = matchVizFence(node.lang, node.meta)
      if (!match) return
      const { src, ...rest } = match.attrs
      return {
        type: 'containerComponent',
        name: match.component,
        attributes: { ...rest, ...(src ? { src } : {}), lang: match.lang, code: node.value, ...loadSrc(match.attrs, mdPath, rootDir) },
        fmAttributes: {},
        children: [],
        position: node.position,
      }
    })
  }
}
