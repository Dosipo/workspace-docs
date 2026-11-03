/**
 * Map DSL — routes, places and distances for Docus pages.
 *
 *   title: Участок км 111–142
 *   basemap: streets            # streets | light | dark | satellite (default: streets, follows dark mode)
 *   units: km                   # km | m | mi
 *   chainage: 0+00 @ km 111     # optional: label route measures as km / PK (пикеты, 100 m)
 *
 *   # Places: id [kind] Label @ lat, lon
 *   base [camp] Базовый городок @ 50.9012, 88.1234
 *     | Развёрнут на км 125, жильё и ремонтная база.
 *   quarry [quarry] Карьер ЩПС @ 50.95, 88.40
 *
 *   # Route: polyline through coordinates and/or place ids
 *   route main [road] Трасса км 111–142: 50.80,87.90 -> 50.85,88.00 -> base -> 50.96,88.30
 *     | Строящийся участок, 30.675 км.
 *
 *   # Haul / distance: computed along an existing route between two places, or straight line
 *   haul quarry -> base : возка ЩПС            # straight line (geodesic)
 *   haul base -> main@30.6 : вывозка в отвал   # to a point on a route at measure (km from route start)
 *
 *   # Markers along a route by measure
 *   at main@3.0 [bridge] Мост через р. Биче-Кадык-ОС
 *   at main@11.5 [culvert] Труба d=1.0
 *
 *   # Segments (colored stretches of a route by measure)
 *   segment main 5.0..9.5 [warn] Пиковые выемки
 *
 * Distances are computed client-side with turf (great-circle), never typed by hand.
 */

export const PLACE_KINDS = ['default', 'camp', 'quarry', 'spoil', 'bridge', 'culvert', 'city', 'start', 'end', 'warn', 'info'] as const
export type PlaceKind = typeof PLACE_KINDS[number]
export const ROUTE_KINDS = ['road', 'haul', 'rail', 'river', 'boundary', 'plan'] as const
export type RouteKind = typeof ROUTE_KINDS[number]
export type Basemap = 'streets' | 'light' | 'dark' | 'satellite'
export type Units = 'km' | 'm' | 'mi'

export type LngLat = [number, number]

export interface MapPlace { id: string, label: string, kind: PlaceKind, coord?: LngLat, at?: { route: string, measure: number }, description?: string, link?: string }
export interface MapRoute { id: string, label: string, kind: RouteKind, refs: (LngLat | string)[], description?: string, link?: string }
export interface MapHaul { id: string, from: string, to: string, label?: string, line: number }
export interface MapSegment { id: string, route: string, from: number, to: number, kind: PlaceKind, label: string }

export interface MapDocument {
  title?: string
  basemap: Basemap
  basemapSet: boolean
  units: Units
  chainage?: { offsetKm: number, startLabelKm: number }
  places: MapPlace[]
  routes: MapRoute[]
  hauls: MapHaul[]
  segments: MapSegment[]
  errors: { line: number, message: string }[]
  warnings: { line: number, message: string }[]
}

const ID = '[\\p{L}\\p{N}_.-]+'
const ID_RE = new RegExp(`^${ID}$`, 'u')
const NUM = '-?\\d+(?:\\.\\d+)?'
const COORD_RE = new RegExp(`^(${NUM})\\s*,\\s*(${NUM})$`)
const PLACE_RE = new RegExp(`^(${ID})\\s*(?:\\[(\\w+)\\])?\\s*(.*?)\\s*@\\s*(${NUM})\\s*,\\s*(${NUM})$`, 'u')
const ROUTE_RE = new RegExp(`^route\\s+(${ID})\\s*(?:\\[(\\w+)\\])?\\s*([^:]*):\\s*(.+)$`, 'iu')
const HAUL_RE = new RegExp(`^haul\\s+(\\S+)\\s*->\\s*(\\S+?)\\s*(?::\\s*(.*))?$`, 'iu')
const AT_RE = new RegExp(`^at\\s+(${ID})@(${NUM})\\s*(?:\\[(\\w+)\\])?\\s*(.*)$`, 'iu')
const SEG_RE = new RegExp(`^segment\\s+(${ID})\\s+(${NUM})\\s*\\.\\.\\s*(${NUM})\\s*(?:\\[(\\w+)\\])?\\s*(.*)$`, 'iu')
const STYLE_RE = new RegExp(`^style\\s+(${ID})\\s*(?:\\[(\\w+)\\])?\\s*(.*)$`, 'iu')
const LINK_RE = new RegExp(`^link\\s+(${ID}(?:@${NUM})?)\\s*:\\s*(\\S+)$`, 'iu')
const REF_AT_RE = new RegExp(`^(${ID})@(${NUM})$`, 'u')

function stripComment(line: string) {
  const s = line.replace(/\\#/g, '\u0000')
  if (/^\s*#/.test(s)) return ''
  const m = s.match(/\s{2,}#/)
  return (m ? s.slice(0, m.index) : s).replaceAll('\u0000', '#')
}

/** Parses "lat, lon" (human order) into [lon, lat] (GeoJSON order). */
function parseCoord(s: string): LngLat | undefined {
  const m = s.trim().match(COORD_RE)
  if (!m) return
  const lat = Number(m[1]), lon = Number(m[2])
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return
  return [lon, lat]
}

export function parseMap(source: string, embedded?: any, embedOpts: { routeKind?: string, pointKind?: string } = {}): MapDocument {
  const doc: MapDocument = { basemap: 'streets', basemapSet: false, units: 'km', places: [], routes: [], hauls: [], segments: [], errors: [], warnings: [] }
  if (embedded) seedFromSource(doc, embedded, embedOpts)
  let last: { description?: string } | undefined
  const err = (line: number, message: string) => doc.errors.push({ line, message })

  source.replace(/\r\n?/g, '\n').split('\n').forEach((raw, i) => {
    const n = i + 1
    const t = raw.trim()
    if (t.startsWith('|')) {
      if (!last) return err(n, 'Description line "|" must follow a place or route')
      const text = t.slice(1).trim()
      last.description = last.description ? `${last.description} ${text}` : text
      return
    }
    const line = stripComment(raw).trim()
    if (!line) return
    last = undefined

    let m: RegExpMatchArray | null
    if ((m = line.match(/^(title|basemap|units|chainage)\s*:\s*(.+)$/i))) {
      const key = m[1]!.toLowerCase(), v = m[2]!.trim()
      if (key === 'title') doc.title = v
      else if (key === 'basemap') {
        if (['streets', 'light', 'dark', 'satellite'].includes(v)) { doc.basemap = v as Basemap; doc.basemapSet = true }
        else err(n, `Unknown basemap "${v}" (streets | light | dark | satellite)`)
      }
      else if (key === 'units') {
        if (['km', 'm', 'mi'].includes(v)) doc.units = v as Units
        else err(n, `Unknown units "${v}" (km | m | mi)`)
      }
      else {
        // chainage: 0+00 @ km 111   → route measure 0 is labelled km 111 / ПК 0+00
        const c = v.match(/^(\d+)\+(\d+(?:\.\d+)?)\s*@\s*km\s*(\d+(?:\.\d+)?)$/i)
        if (!c) err(n, 'chainage must look like "0+00 @ km 111"')
        else doc.chainage = { offsetKm: (Number(c[1]) * 100 + Number(c[2])) / 1000, startLabelKm: Number(c[3]) }
      }
      return
    }
    if ((m = line.match(ROUTE_RE))) {
      const [, id, kind, label, body] = m
      const refs: (LngLat | string)[] = []
      for (const part of body!.split(/\s*->\s*/)) {
        const c = parseCoord(part)
        if (c) refs.push(c)
        else if (ID_RE.test(part.trim())) refs.push(part.trim())
        else err(n, `Route point "${part}" is neither "lat, lon" nor a place id`)
      }
      if (refs.length < 2) err(n, `Route "${id}" needs at least 2 points`)
      const k = (kind?.toLowerCase() ?? 'road') as RouteKind
      if (!(ROUTE_KINDS as readonly string[]).includes(k)) err(n, `Unknown route kind "${kind}" (${ROUTE_KINDS.join(' | ')})`)
      const r: MapRoute = { id: id!, kind: k, label: label!.trim() || id!, refs }
      doc.routes.push(r); last = r
      return
    }
    if ((m = line.match(HAUL_RE))) {
      const [, from, to, label] = m
      doc.hauls.push({ id: `h${doc.hauls.length + 1}`, from: from!, to: to!, label: label?.trim() || undefined, line: n })
      return
    }
    if ((m = line.match(AT_RE))) {
      const [, route, measure, kind, label] = m
      const p: MapPlace = { id: `${route}@${measure}`, kind: kindOf(kind, n), label: label!.trim() || `${route} ${measure}`, at: { route: route!, measure: Number(measure) } }
      doc.places.push(p); last = p
      return
    }
    if ((m = line.match(SEG_RE))) {
      const [, route, a, b, kind, label] = m
      if (Number(b) <= Number(a)) err(n, `Segment end ${b} must be greater than start ${a}`)
      doc.segments.push({ id: `s${doc.segments.length + 1}`, route: route!, from: Number(a), to: Number(b), kind: kindOf(kind, n), label: label!.trim() })
      return
    }
    if ((m = line.match(STYLE_RE))) {
      // restyle a feature that came from the src file (or declared earlier): kind, label, description
      const [, id, kind, label] = m
      const place = doc.places.find(p => p.id === id)
      const route = doc.routes.find(r => r.id === id)
      if (!place && !route) return err(n, `style: unknown id "${id}" (ids from src: ${[...doc.routes, ...doc.places].slice(0, 8).map(x => x.id).join(', ')}${doc.routes.length + doc.places.length > 8 ? ', …' : ''})`)
      if (route) {
        if (kind) { const k = kind.toLowerCase(); if ((ROUTE_KINDS as readonly string[]).includes(k)) route.kind = k as RouteKind; else err(n, `Unknown route kind "${kind}"`) }
        if (label?.trim()) route.label = label.trim()
        last = route
      }
      else {
        if (kind) place!.kind = kindOf(kind, n)
        if (label?.trim()) place!.label = label.trim()
        last = place
      }
      return
    }
    if ((m = line.match(LINK_RE))) {
      const target = doc.places.find(p => p.id === m![1]) ?? doc.routes.find(r => r.id === m![1])
      if (target) target.link = m[2]
      else err(n, `link: unknown id "${m[1]}" (declare it first)`)
      return
    }
    if ((m = line.match(PLACE_RE))) {
      const [, id, kind, label, lat, lon] = m
      const coord = parseCoord(`${lat}, ${lon}`)
      if (!coord) return err(n, `Invalid coordinates "${lat}, ${lon}" (expected "lat, lon" in degrees)`)
      const seeded = doc.places.find(p => p.id === id && (p as any).seeded)
      if (seeded) { Object.assign(seeded, { kind: kindOf(kind, n), label: label!.trim() || seeded.label, coord }); delete (seeded as any).seeded; last = seeded; return }
      if (doc.places.some(p => p.id === id)) return err(n, `Duplicate place id "${id}"`)
      const p: MapPlace = { id: id!, kind: kindOf(kind, n), label: label!.trim() || id!, coord }
      doc.places.push(p); last = p
      return
    }
    err(n, `Cannot parse "${line}"`)
  })

  function kindOf(k: string | undefined, n: number): PlaceKind {
    const v = (k?.toLowerCase() ?? 'default')
    if ((PLACE_KINDS as readonly string[]).includes(v)) return v as PlaceKind
    err(n, `Unknown kind "${k}" (${PLACE_KINDS.join(' | ')})`)
    return 'default'
  }

  // reference checks
  const placeIds = new Set(doc.places.map(p => p.id))
  const routeIds = new Set(doc.routes.map(r => r.id))
  for (const r of doc.routes) for (const ref of r.refs) if (typeof ref === 'string' && !placeIds.has(ref)) doc.errors.push({ line: 0, message: `Route "${r.id}" references unknown place "${ref}"` })
  for (const p of doc.places) if (p.at && !routeIds.has(p.at.route)) doc.errors.push({ line: 0, message: `"at ${p.id}": unknown route "${p.at.route}"` })
  for (const s of doc.segments) if (!routeIds.has(s.route)) doc.errors.push({ line: 0, message: `segment: unknown route "${s.route}"` })
  for (const h of doc.hauls) for (const end of [h.from, h.to]) {
    const ra = end.match(REF_AT_RE)
    if (ra ? !routeIds.has(ra[1]!) : !placeIds.has(end)) doc.errors.push({ line: h.line, message: `haul: unknown endpoint "${end}" (place id or route@km)` })
  }
  if (!doc.places.length && !doc.routes.length) doc.errors.push({ line: 0, message: 'Map has no places or routes' })
  return doc
}

/**
 * Merges features from an embedded file (KML/GPX/GeoJSON, or a table with lat/lon columns)
 * into the document. File features come first so the DSL can reference them by id
 * (`at axis@3 …`, `haul a -> axis@20`). Ids: `id`/`name` property, slugified; first route
 * can always be referenced as `route1`, first point `point1`, etc.
 */
function seedFromSource(doc: MapDocument, src: any, opts: { routeKind?: string, pointKind?: string } = {}) {
  const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40)
  const taken = new Set([...doc.places.map(p => p.id), ...doc.routes.map(r => r.id)])
  const uniq = (base: string) => { let id = base || 'f', i = 2; while (taken.has(id)) id = `${base}-${i++}`; taken.add(id); return id }
  const routes: MapRoute[] = [], places: MapPlace[] = []
  let ri = 0, pi = 0
  const rk = ((ROUTE_KINDS as readonly string[]).includes(opts.routeKind ?? '') ? opts.routeKind : 'road') as RouteKind
  const pk = ((PLACE_KINDS as readonly string[]).includes(opts.pointKind ?? '') ? opts.pointKind : 'default') as PlaceKind

  const addLine = (coords: number[][], props: any) => {
    if (coords.length < 2) return
    ri++
    const label = String(props?.name || props?.title || `Маршрут ${ri}`)
    const id = uniq(props?.id ? slug(String(props.id)) : ri === 1 && !taken.has('route1') ? 'route1' : slug(label) || `route${ri}`)
    const kind = (ROUTE_KINDS as readonly string[]).includes(props?.kind) ? props.kind : rk
    routes.push({ id, label, kind, refs: coords.map(c => [c[0]!, c[1]!] as LngLat), description: props?.description || undefined, ...({ seeded: true } as any) })
  }
  const addPoint = (c: number[], props: any) => {
    pi++
    const label = String(props?.name || props?.title || `Точка ${pi}`)
    const id = uniq(props?.id ? slug(String(props.id)) : slug(label) || `point${pi}`)
    const kind = (PLACE_KINDS as readonly string[]).includes(props?.kind) ? props.kind : pk
    places.push({ id, label, kind, coord: [c[0]!, c[1]!], description: props?.description || undefined, link: props?.link || undefined, ...({ seeded: true } as any) })
  }

  if (src.kind === 'geojson') {
    for (const f of src.data?.features ?? []) {
      const g = f?.geometry
      if (!g) continue
      if (g.type === 'Point') addPoint(g.coordinates, f.properties)
      else if (g.type === 'MultiPoint') g.coordinates.forEach((c: number[]) => addPoint(c, f.properties))
      else if (g.type === 'LineString') addLine(g.coordinates, f.properties)
      else if (g.type === 'MultiLineString') g.coordinates.forEach((c: number[][]) => addLine(c, f.properties))
      else if (g.type === 'Polygon') addLine(g.coordinates[0], { ...f.properties, kind: f.properties?.kind ?? 'boundary' })
      else if (g.type === 'MultiPolygon') g.coordinates.forEach((p: number[][][]) => addLine(p[0]!, { ...f.properties, kind: f.properties?.kind ?? 'boundary' }))
    }
  }
  else if (src.kind === 'table') {
    // rows with latitude/longitude columns → points
    const cols = (src.columns as string[]).map(c => c.toLowerCase())
    const find = (...names: string[]) => cols.findIndex(c => names.some(n => c === n || c.startsWith(n)))
    const lat = find('lat', 'широта', 'y'), lon = find('lon', 'lng', 'долгота', 'x')
    const name = find('name', 'название', 'наименование', 'title', 'объект', 'адрес', 'address')
    const desc = find('description', 'описание', 'comment', 'примечание')
    const kind = find('kind', 'тип', 'type')
    if (lat < 0 || lon < 0) doc.errors.push({ line: 0, message: `table src needs latitude/longitude columns (have: ${src.columns.join(', ')})` })
    else for (const r of src.rows as any[][]) {
      const la = Number(r[lat]), lo = Number(r[lon])
      if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) continue
      addPoint([lo, la], { name: name >= 0 ? r[name] : undefined, description: desc >= 0 ? r[desc] : undefined, kind: kind >= 0 ? r[kind] : undefined })
    }
  }
  doc.routes.push(...routes)
  doc.places.push(...places)
  if (!routes.length && !places.length) doc.warnings.push({ line: 0, message: 'src contains no usable points or lines' })
}

export function applyMapOverrides(doc: MapDocument, o: { basemap?: string, title?: string }) {
  if (o.basemap && ['streets', 'light', 'dark', 'satellite'].includes(o.basemap)) { doc.basemap = o.basemap as Basemap; doc.basemapSet = true }
  if (o.title) doc.title = o.title
  return doc
}
