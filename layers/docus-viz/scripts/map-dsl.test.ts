import assert from 'node:assert/strict'
import { parseMap } from '../shared/map-dsl.ts'
import { resolveMap, formatChainage, formatDistance } from '../shared/map-geometry.ts'
import { matchMapFence } from '../remark-viz.mjs'

const t = (name: string, fn: () => void) => { try { fn(); console.log('✓', name) } catch (e) { console.log('✖', name, (e as Error).message); process.exitCode = 1 } }

t('place lat,lon → [lon,lat]', () => assert.deepEqual(parseMap('a [camp] Лагерь @ 51.5, 88.2').places[0]!.coord, [88.2, 51.5]))
t('invalid lat rejected', () => assert.ok(parseMap('a @ 95, 10').errors.length))
t('route through ids and coords', () => {
  const d = parseMap('a @ 50, 88\nb @ 50, 89\nroute r [road] Трасса: a -> 50.5, 88.5 -> b')
  assert.equal(d.errors.length, 0); assert.equal(d.routes[0]!.refs.length, 3)
})
t('unknown place in route errors', () => assert.ok(parseMap('route r: a -> 50, 88').errors.some(e => /unknown place/.test(e.message))))
t('1° of latitude ≈ 111.2 km', () => {
  const g = resolveMap(parseMap('route r: 50, 88 -> 51, 88'))
  assert.ok(Math.abs(g.routes[0]!.lengthKm - 111.19) < 0.1, String(g.routes[0]!.lengthKm))
})
t('at measure on route', () => {
  const g = resolveMap(parseMap('route r: 50, 88 -> 51, 88\nat r@55.6 [bridge] Мост'))
  const p = g.places.find(x => x.kind === 'bridge')!
  assert.ok(Math.abs(p.coord[1] - 50.5) < 0.01)
})
t('at beyond route errors', () => assert.ok(resolveMap(parseMap('route r: 50, 88 -> 50.1, 88\nat r@50 Далеко')).errors.length))
t('haul along route uses road distance', () => {
  const g = resolveMap(parseMap('route r: 50, 88 -> 50, 89 -> 51, 89\nhaul r@10 -> r@100 : возка'))
  assert.ok(Math.abs(g.hauls[0]!.km - 90) < 1e-6); assert.equal(g.hauls[0]!.alongRoute, 'r')
})
t('haul between places is geodesic', () => {
  const g = resolveMap(parseMap('a @ 50, 88\nb @ 51, 88\nhaul a -> b'))
  assert.ok(Math.abs(g.hauls[0]!.km - 111.19) < 0.1)
})
t('haul unknown endpoint errors', () => assert.ok(parseMap('a @ 50, 88\nhaul a -> zz').errors.length))
t('segment by measures', () => {
  const g = resolveMap(parseMap('route r: 50, 88 -> 51, 88\nsegment r 10..20 [warn] Выемки'))
  assert.ok(Math.abs(g.segments[0]!.km - 10) < 1e-6)
})
t('chainage km+m and PK', () => {
  const d = parseMap('chainage: 0+00 @ km 111\nroute r: 50, 88 -> 51, 88')
  assert.equal(formatChainage(14.3, d), 'км 125+300 · ПК 143+00')
})
t('chainage with offset', () => {
  const d = parseMap('chainage: 10+50 @ km 111\nroute r: 50, 88 -> 51, 88')
  assert.equal(formatChainage(0, d), 'км 112+050 · ПК 10+50')
})
t('format distance', () => { assert.equal(formatDistance(0.45, 'km'), '450 м'); assert.equal(formatDistance(30.675, 'km'), '30,7 км') })
t('# kept in labels, comments stripped', () => assert.equal(parseMap('a [info] Пункт #3 @ 50, 88  # comment').places[0]!.label, 'Пункт #3'))
t('fence match', () => { assert.deepEqual(matchMapFence('map{height=300}', null), { lang: 'map', attrs: { height: '300' } }); assert.equal(matchMapFence('mapping', null), null) })
t('link to at-marker', () => { const d = parseMap('route r: 50, 88 -> 51, 88\nat r@5 [camp] Лагерь\nlink r@5: /x'); assert.equal(d.errors.length, 0); assert.equal(d.places[0]!.link, '/x') })
// --- file sources ---
const kmlSrc = { kind: 'geojson', data: { type: 'FeatureCollection', features: [
  { type: 'Feature', properties: { name: 'Ось трассы' }, geometry: { type: 'LineString', coordinates: [[88, 50], [88, 51]] } },
  { type: 'Feature', properties: { name: 'Карьер' }, geometry: { type: 'Point', coordinates: [88.5, 50.5] } },
] } }
t('src: routes and points seeded', () => {
  const d = parseMap('title: x', kmlSrc)
  assert.equal(d.errors.length, 0); assert.equal(d.routes[0]!.id, 'route1'); assert.equal(d.places[0]!.label, 'Карьер')
})
t('src: DSL refers to seeded route', () => {
  const d = parseMap('at route1@10 [bridge] Мост\nhaul карьер -> route1@50 : возка', kmlSrc)
  assert.equal(d.errors.length, 0, JSON.stringify(d.errors))
  const g = resolveMap(d); assert.equal(g.hauls.length, 1); assert.ok(g.places.some(p => p.kind === 'bridge'))
})
t('src: style restyles seeded feature', () => {
  const d = parseMap('style route1 [rail] Ж/д ветка\n  | Существующая ветка', kmlSrc)
  assert.equal(d.routes[0]!.kind, 'rail'); assert.equal(d.routes[0]!.label, 'Ж/д ветка'); assert.equal(d.routes[0]!.description, 'Существующая ветка')
})
t('src: style unknown id lists available', () => assert.match(parseMap('style nope [rail]', kmlSrc).errors[0]!.message, /route1/))
t('src: table with lat/lon columns', () => {
  const d = parseMap('', { kind: 'table', columns: ['Название', 'Широта', 'Долгота'], rows: [['Склад', 55.75, 37.61], ['Плохая', 'x', 1]] })
  assert.equal(d.places.length, 1); assert.deepEqual(d.places[0]!.coord, [37.61, 55.75])
})
t('src: table without coords errors', () => assert.ok(parseMap('', { kind: 'table', columns: ['a', 'b'], rows: [] }).errors.length))
