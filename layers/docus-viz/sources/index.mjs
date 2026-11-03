/**
 * Build-time file readers for docus-viz blocks (`src=` attribute).
 * Node-only, zero dependencies: zlib for .xlsx/.kmz, a tiny XML tokenizer for KML/GPX/XLSX.
 *
 *   readSource(absPath, { sheet, range }) → { kind, ... }
 *     .csv/.tsv           → { kind: 'table', columns, rows }
 *     .xlsx               → { kind: 'table', columns, rows, sheets }   (cached values; first sheet or `sheet=`)
 *     .json               → { kind: 'table' } for arrays of objects, { kind: 'geojson' } for GeoJSON
 *     .geojson            → { kind: 'geojson', data }
 *     .kml / .kmz / .gpx  → { kind: 'geojson', data }
 */
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { inflateRawSync } from 'node:zlib'

// ---------------------------------------------------------------- zip ------
export function unzip(buf) {
  const files = {}
  // find End Of Central Directory
  let eocd = buf.length - 22
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--
  if (eocd < 0) throw new Error('not a zip archive')
  const count = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad zip central directory')
    const method = buf.readUInt16LE(p + 10)
    const csize = buf.readUInt32LE(p + 20)
    const nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32)
    const local = buf.readUInt32LE(p + 42)
    const name = buf.toString('utf8', p + 46, p + 46 + nlen)
    const lnlen = buf.readUInt16LE(local + 26), lxlen = buf.readUInt16LE(local + 28)
    const start = local + 30 + lnlen + lxlen
    const raw = buf.subarray(start, start + csize)
    files[name] = () => (method === 0 ? raw : method === 8 ? inflateRawSync(raw) : (() => { throw new Error(`zip method ${method} unsupported`) })())
    p += 46 + nlen + xlen + clen
  }
  return files
}

// ---------------------------------------------------------------- xml ------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENT[e] ?? m))

/** Minimal XML → tree { name, attrs, children, text }. Namespaces are stripped from names. */
export function parseXml(xml) {
  const root = { name: '#root', attrs: {}, children: [], text: '' }
  const stack = [root]
  const re = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[\s\S]*?>|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g
  let m
  while ((m = re.exec(xml))) {
    const top = stack[stack.length - 1]
    if (m[1] !== undefined) top.text += m[1]
    else if (m[2]) { if (stack.length > 1) stack.pop() }
    else if (m[3]) {
      const attrs = {}
      for (const a of m[4].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1].replace(/^.*:/, '')] = decode(a[2] ?? a[3])
      const el = { name: m[3].replace(/^.*:/, ''), attrs, children: [], text: '' }
      top.children.push(el)
      if (!m[5]) stack.push(el)
    }
    else if (m[6]) top.text += decode(m[6])
  }
  return root
}
const kids = (el, name) => el.children.filter(c => c.name === name)
const kid = (el, name) => el.children.find(c => c.name === name)
function* walk(el) { yield el; for (const c of el.children) yield* walk(c) }
const textOf = el => (el ? el.text.trim() : '')

// ---------------------------------------------------------------- csv ------
export function parseCsv(text, delimiter) {
  text = text.replace(/^﻿/, '')
  const first = text.split(/\r?\n/, 1)[0] ?? ''
  const d = delimiter ?? (first.includes('\t') ? '\t' : (first.split(';').length > first.split(',').length ? ';' : ','))
  const rows = []
  let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') q = false
      else cell += c
    }
    else if (c === '"') q = true
    else if (c === d) { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    }
    else cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  const nonEmpty = rows.filter(r => r.some(v => v.trim() !== ''))
  const columns = (nonEmpty.shift() ?? []).map(s => s.trim())
  return { kind: 'table', columns, rows: nonEmpty.map(r => r.map(coerce)) }
}

/** "1 234,5" / "1,234.5" / "12%" → number; leaves text alone. */
export function coerce(v) {
  if (typeof v !== 'string') return v
  const s = v.trim()
  if (s === '') return null
  const t = s.replace(/[\s ]/g, '')
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return Number(t.replace(/,/g, ''))
  if (/^-?\d+,\d+$/.test(t)) return Number(t.replace(',', '.'))
  if (/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(t)) return Number(t)
  return s
}

// ---------------------------------------------------------------- xlsx -----
const CELL_RE = /^([A-Z]+)(\d+)$/
const colIndex = l => [...l].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0)

export function readXlsx(buf, opts = {}) {
  const { sheet, range } = opts
  const z = unzip(buf)
  const get = n => (z[n] ? z[n]().toString('utf8') : null)
  const shared = []
  const ss = get('xl/sharedStrings.xml')
  if (ss) for (const si of kids(parseXml(ss).children[0], 'si')) shared.push([...walk(si)].filter(e => e.name === 't').map(e => e.text).join(''))
  const wb = parseXml(get('xl/workbook.xml')).children[0]
  const rels = parseXml(get('xl/_rels/workbook.xml.rels')).children[0]
  const target = Object.fromEntries(kids(rels, 'Relationship').map(r => [r.attrs.Id, r.attrs.Target]))
  const sheets = kids(kid(wb, 'sheets'), 'sheet').map(s => ({ name: s.attrs.name, path: (t => t.startsWith('/') ? t.slice(1) : `xl/${t.replace(/^\.\//, '')}`)(target[s.attrs.id]) }))
  const chosen = sheet ? sheets.find(s => s.name === sheet) ?? sheets[Number(sheet) - 1] : sheets[0]
  if (!chosen) throw new Error(`sheet "${sheet}" not found (have: ${sheets.map(s => s.name).join(', ')})`)
  const ws = parseXml(get(chosen.path)).children[0]
  const grid = []
  for (const c of walk(ws)) {
    if (c.name !== 'c') continue
    const m = CELL_RE.exec(c.attrs.r ?? '')
    if (!m) continue
    const r = Number(m[2]) - 1, col = colIndex(m[1]) - 1
    const t = c.attrs.t, v = kid(c, 'v')
    let val = v ? v.text : null
    if (t === 'inlineStr') val = [...walk(c)].filter(e => e.name === 't').map(e => e.text).join('')
    else if (t === 's' && val !== null) val = shared[Number(val)]
    else if (t === 'b') val = val === '1'
    else if (val !== null && t !== 'str' && t !== 'e') val = Number(val)
    ;(grid[r] ??= [])[col] = val
  }
  let rows = grid.map(r => (r ? Array.from(r, x => x ?? null) : []))
  if (range) {
    const [a, b] = range.split(':')
    const [, ac, ar] = CELL_RE.exec(a), [, bc, br] = CELL_RE.exec(b)
    rows = rows.slice(Number(ar) - 1, Number(br)).map(r => r.slice(colIndex(ac) - 1, colIndex(bc)))
  }
  rows = rows.filter(r => r.some(v => v !== null && v !== ''))
  // header: explicit `header=N` (1-based within the range), else the first row whose non-empty
  // cells are all text and at least 2 (skips title rows and "param | value" rows)
  const filled = r => r.filter(v => v !== null && v !== '')
  const h = opts.header ? Number(opts.header) - 1
    : Math.max(0, rows.findIndex(r => filled(r).length >= 2 && filled(r).every(v => typeof v === 'string')))
  const columns = (rows[h] ?? []).map(v => (v == null ? '' : String(v).trim()))
  return { kind: 'table', columns, rows: rows.slice(h + 1), sheet: chosen.name, sheets: sheets.map(s => s.name) }
}

// ---------------------------------------------------------------- kml/gpx --
const coordsOf = s => s.trim().split(/\s+/).map(t => t.split(',').map(Number)).filter(p => p.length >= 2 && p.every(Number.isFinite)).map(([x, y]) => [x, y])

export function kmlToGeojson(xml) {
  const features = []
  for (const pm of walk(parseXml(xml))) {
    if (pm.name !== 'Placemark') continue
    const properties = { name: textOf(kid(pm, 'name')), description: textOf(kid(pm, 'description')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }
    for (const d of walk(pm)) if (d.name === 'Data' && d.attrs.name) properties[d.attrs.name] = coerce(textOf(kid(d, 'value')))
    for (const d of walk(pm)) if (d.name === 'SimpleData' && d.attrs.name) properties[d.attrs.name] = coerce(d.text.trim())
    for (const g of walk(pm)) {
      const c = kid(g, 'coordinates')
      if (g.name === 'Point' && c) features.push({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: coordsOf(c.text)[0] } })
      else if (g.name === 'LineString' && c) features.push({ type: 'Feature', properties, geometry: { type: 'LineString', coordinates: coordsOf(c.text) } })
      else if (g.name === 'Polygon') {
        const ring = [...walk(g)].find(e => e.name === 'coordinates')
        if (ring) features.push({ type: 'Feature', properties, geometry: { type: 'Polygon', coordinates: [coordsOf(ring.text)] } })
      }
      else if (g.name === 'Track') { // gx:Track
        const pts = kids(g, 'coord').map(e => e.text.trim().split(/\s+/).map(Number).slice(0, 2))
        if (pts.length > 1) features.push({ type: 'Feature', properties, geometry: { type: 'LineString', coordinates: pts } })
      }
    }
  }
  return { type: 'FeatureCollection', features }
}

export function gpxToGeojson(xml) {
  const root = parseXml(xml)
  const features = []
  const pt = e => [Number(e.attrs.lon), Number(e.attrs.lat)]
  for (const e of walk(root)) {
    if (e.name === 'wpt') features.push({ type: 'Feature', properties: { name: textOf(kid(e, 'name')), description: textOf(kid(e, 'desc')) }, geometry: { type: 'Point', coordinates: pt(e) } })
    if (e.name === 'trk' || e.name === 'rte') {
      const pts = [...walk(e)].filter(x => x.name === 'trkpt' || x.name === 'rtept').map(pt)
      if (pts.length > 1) features.push({ type: 'Feature', properties: { name: textOf(kid(e, 'name')), description: textOf(kid(e, 'desc')) }, geometry: { type: 'LineString', coordinates: pts } })
    }
  }
  return { type: 'FeatureCollection', features }
}

// ---------------------------------------------------------------- entry ----
export function readSource(path, opts = {}) {
  const ext = extname(path).toLowerCase()
  if (ext === '.csv' || ext === '.tsv' || ext === '.txt') return parseCsv(readFileSync(path, 'utf8'), ext === '.tsv' ? '\t' : opts.delimiter)
  if (ext === '.xlsx' || ext === '.xlsm') return readXlsx(readFileSync(path), opts)
  if (ext === '.kml') return { kind: 'geojson', data: kmlToGeojson(readFileSync(path, 'utf8')) }
  if (ext === '.kmz') {
    const z = unzip(readFileSync(path))
    const k = Object.keys(z).find(n => n.toLowerCase().endsWith('.kml'))
    if (!k) throw new Error('no .kml inside .kmz')
    return { kind: 'geojson', data: kmlToGeojson(z[k]().toString('utf8')) }
  }
  if (ext === '.gpx') return { kind: 'geojson', data: gpxToGeojson(readFileSync(path, 'utf8')) }
  if (ext === '.geojson' || ext === '.json') {
    const data = JSON.parse(readFileSync(path, 'utf8'))
    if (data && (data.type === 'FeatureCollection' || data.type === 'Feature')) return { kind: 'geojson', data: data.type === 'Feature' ? { type: 'FeatureCollection', features: [data] } : data }
    if (Array.isArray(data) && data.every(o => o && typeof o === 'object' && !Array.isArray(o))) {
      const columns = [...new Set(data.flatMap(Object.keys))]
      return { kind: 'table', columns, rows: data.map(o => columns.map(c => o[c] ?? null)) }
    }
    throw new Error('JSON must be GeoJSON or an array of objects')
  }
  throw new Error(`unsupported file type "${ext}" (csv, tsv, xlsx, json, geojson, kml, kmz, gpx)`)
}
