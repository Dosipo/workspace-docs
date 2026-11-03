import { lineString, point, featureCollection } from '@turf/helpers'
import turfLength from '@turf/length'
import along from '@turf/along'
import bbox from '@turf/bbox'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import type { Feature, FeatureCollection, LineString, Point } from 'geojson'
import type { MapDocument, LngLat, Units } from './map-dsl.ts'

export interface ResolvedRoute { id: string, label: string, kind: string, description?: string, link?: string, line: Feature<LineString>, lengthKm: number }
export interface ResolvedPlace { id: string, label: string, kind: string, description?: string, link?: string, coord: LngLat, measureKm?: number, routeId?: string }
export interface ResolvedHaul { id: string, label?: string, from: ResolvedPlace, to: ResolvedPlace, line: Feature<LineString>, km: number, alongRoute?: string }
export interface ResolvedSegment { id: string, label: string, kind: string, routeId: string, line: Feature<LineString>, km: number, from: number, to: number }

export interface ResolvedMap {
  routes: ResolvedRoute[]
  places: ResolvedPlace[]
  hauls: ResolvedHaul[]
  segments: ResolvedSegment[]
  bounds?: [number, number, number, number]
  errors: string[]
}

/** Sub-line of a route between two measures (km from start). */
function slice(line: Feature<LineString>, fromKm: number, toKm: number): Feature<LineString> {
  const coords = line.geometry.coordinates
  const out: number[][] = [along(line, fromKm).geometry.coordinates]
  let acc = 0
  for (let i = 1; i < coords.length; i++) {
    acc += turfLength(lineString([coords[i - 1]!, coords[i]!]))
    if (acc > fromKm && acc < toKm) out.push(coords[i]!)
  }
  out.push(along(line, toKm).geometry.coordinates)
  return lineString(out)
}

export function resolveMap(doc: MapDocument): ResolvedMap {
  const errors: string[] = []
  const placeById = new Map<string, ResolvedPlace>()
  for (const p of doc.places) if (p.coord) placeById.set(p.id, { ...p, coord: p.coord })

  const routes: ResolvedRoute[] = []
  for (const r of doc.routes) {
    const coords = r.refs.map(ref => (typeof ref === 'string' ? placeById.get(ref)?.coord : ref)).filter(Boolean) as LngLat[]
    if (coords.length < 2) continue
    const line = lineString(coords)
    routes.push({ id: r.id, label: r.label, kind: r.kind, description: r.description, link: r.link, line, lengthKm: turfLength(line) })
  }
  const routeById = new Map(routes.map(r => [r.id, r]))

  for (const p of doc.places) {
    if (!p.at) continue
    const r = routeById.get(p.at.route)
    if (!r) continue
    if (p.at.measure < 0 || p.at.measure > r.lengthKm + 1e-6) {
      errors.push(`"${p.label}" at ${p.at.measure} km is outside route "${r.id}" (length ${r.lengthKm.toFixed(3)} km)`)
      continue
    }
    const c = along(r.line, p.at.measure).geometry.coordinates as LngLat
    placeById.set(p.id, { ...p, coord: c, measureKm: p.at.measure, routeId: r.id })
  }

  const endpoint = (ref: string): ResolvedPlace | undefined => {
    const m = ref.match(/^(.+)@(-?\d+(?:\.\d+)?)$/)
    if (m) {
      const r = routeById.get(m[1]!)
      if (!r) return
      const km = Math.min(Math.max(0, Number(m[2])), r.lengthKm)
      return { id: ref, label: `${r.label}, ${km} км`, kind: 'default', coord: along(r.line, km).geometry.coordinates as LngLat, measureKm: km, routeId: r.id }
    }
    return placeById.get(ref)
  }

  const hauls: ResolvedHaul[] = []
  for (const h of doc.hauls) {
    const a = endpoint(h.from), b = endpoint(h.to)
    if (!a || !b) continue
    // both ends on the same route → distance along the road, otherwise geodesic straight line
    if (a.routeId && a.routeId === b.routeId && a.measureKm !== undefined && b.measureKm !== undefined && a.measureKm !== b.measureKm) {
      const r = routeById.get(a.routeId)!
      const [x, y] = a.measureKm < b.measureKm ? [a.measureKm, b.measureKm] : [b.measureKm, a.measureKm]
      hauls.push({ id: h.id, label: h.label, from: a, to: b, line: slice(r.line, x, y), km: y - x, alongRoute: r.id })
    }
    else {
      const line = lineString([a.coord, b.coord])
      hauls.push({ id: h.id, label: h.label, from: a, to: b, line, km: turfLength(line) })
    }
  }

  const segments: ResolvedSegment[] = []
  for (const s of doc.segments) {
    const r = routeById.get(s.route)
    if (!r) continue
    const to = Math.min(s.to, r.lengthKm)
    if (s.from >= to) { errors.push(`segment "${s.label}" ${s.from}..${s.to} is outside route "${r.id}"`); continue }
    segments.push({ id: s.id, label: s.label, kind: s.kind, routeId: r.id, line: slice(r.line, s.from, to), km: to - s.from, from: s.from, to })
  }

  const places = [...placeById.values()]
  const all: Feature[] = [...routes.map(r => r.line), ...places.map(p => point(p.coord)), ...hauls.map(h => h.line)]
  const bounds = all.length ? (bbox(featureCollection(all)) as [number, number, number, number]) : undefined
  return { routes, places, hauls, segments, bounds, errors }
}

/** Measure along route → nearest point on line for a clicked coordinate. */
export function measureAt(route: ResolvedRoute, coord: LngLat): number {
  const p = nearestPointOnLine(route.line, point(coord))
  return (p.properties as { location: number }).location
}

export function formatDistance(km: number, units: Units): string {
  if (units === 'mi') return `${(km * 0.621371).toFixed(km < 16 ? 2 : 1)} mi`
  if (units === 'm' || km < 1) return `${Math.round(km * 1000).toLocaleString('ru-RU')} м`
  return `${km.toFixed(km < 10 ? 2 : 1).replace('.', ',')} км`
}

/** "км 125+300 · ПК 140+00" for a route measure when chainage is configured. */
export function formatChainage(measureKm: number, doc: Pick<MapDocument, 'chainage'>): string | undefined {
  if (!doc.chainage) return
  const m = Math.round((measureKm + doc.chainage.offsetKm) * 1000)
  const km = doc.chainage.startLabelKm + Math.floor(m / 1000)
  const plus = String(m % 1000).padStart(3, '0')
  const pk = `ПК ${Math.floor(m / 100)}+${String(m % 100).padStart(2, '0')}`
  return `км ${km}+${plus} · ${pk}`
}

export function toFeatureCollection(features: Feature[]): FeatureCollection {
  return featureCollection(features)
}
export type { Feature, Point, LineString }
