import assert from 'node:assert/strict'
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { parseCsv, kmlToGeojson, gpxToGeojson, readSource, coerce } from '../sources/index.mjs'
import { resolveSrc, loadSrc, matchVizFence } from '../remark-viz.mjs'
const t = (name: string, fn: () => void) => { try { fn(); console.log('✓', name) } catch (e) { console.log('✖', name, (e as Error).message); process.exitCode = 1 } }
t('csv: ; delimiter, quotes, ru numbers, BOM', () => { const r = parseCsv('﻿а;б\n"x;y";"1 200,5"\n'); assert.deepEqual(r.columns, ['а', 'б']); assert.deepEqual(r.rows[0], ['x;y', 1200.5]) })
t('csv: escaped quotes and newline in cell', () => assert.deepEqual(parseCsv('a,b\n"he said ""hi""","l1\nl2"\n').rows[0], ['he said "hi"', 'l1\nl2']))
t('coerce', () => { assert.equal(coerce('1,234.5'), 1234.5); assert.equal(coerce('12,5'), 12.5); assert.equal(coerce('ПК 10'), 'ПК 10'); assert.equal(coerce(''), null) })
t('kml: line, point, polygon, ExtendedData, entities', () => {
  const g = kmlToGeojson('<kml><Document><Placemark><name>A &amp; B</name><ExtendedData><Data name="km"><value>3</value></Data></ExtendedData><LineString><coordinates>1,2,0 3,4,0</coordinates></LineString></Placemark><Placemark><Point><coordinates>5,6</coordinates></Point></Placemark><Placemark><Polygon><outerBoundaryIs><LinearRing><coordinates>0,0 1,0 1,1 0,0</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>')
  assert.deepEqual(g.features.map(f => f.geometry.type), ['LineString', 'Point', 'Polygon']); assert.equal(g.features[0].properties.name, 'A & B'); assert.equal(g.features[0].properties.km, 3)
})
t('gpx: wpt + trk', () => assert.deepEqual(gpxToGeojson('<gpx><wpt lat="1" lon="2"/><trk><trkseg><trkpt lat="1" lon="2"/><trkpt lat="3" lon="4"/></trkseg></trk></gpx>').features.map(f => f.geometry.type), ['Point', 'LineString']))
const dir = mkdtempSync(join(tmpdir(), 'viz-'))
mkdirSync(join(dir, 'data')); mkdirSync(join(dir, 'content'))
writeFileSync(join(dir, 'data', 'a.csv'), 'x,y\n1,2\n'); writeFileSync(join(dir, 'content', 'b.csv'), 'p,q\n3,4\n')
t('resolveSrc: data/ first, then next to md', () => { assert.match(resolveSrc('a.csv', join(dir, 'content', 'page.md'), dir).path, /data\/a\.csv$/); assert.match(resolveSrc('b.csv', join(dir, 'content', 'page.md'), dir).path, /content\/b\.csv$/) })
t('resolveSrc: missing file explains where it looked', () => assert.match(resolveSrc('zz.csv', join(dir, 'content', 'p.md'), dir).error, /data\/zz\.csv/))
t('resolveSrc: refuses paths outside project', () => assert.ok(resolveSrc('../../../../etc/hosts', join(dir, 'content', 'p.md'), dir).error))
t('loadSrc: never throws, returns srcError', () => { writeFileSync(join(dir, 'data', 'bad.json'), '{oops'); assert.ok(loadSrc({ src: 'bad.json' }, join(dir, 'content', 'p.md'), dir).srcError) })
t('loadSrc: unsupported type', () => { writeFileSync(join(dir, 'data', 'x.pdf'), '%PDF'); assert.match(loadSrc({ src: 'x.pdf' }, null, dir).srcError, /unsupported/) })
t('json array → table, geojson → geojson', () => {
  writeFileSync(join(dir, 'data', 'arr.json'), '[{"a":1},{"a":2,"b":3}]'); writeFileSync(join(dir, 'data', 'g.json'), '{"type":"Feature","geometry":{"type":"Point","coordinates":[1,2]}}')
  assert.deepEqual(readSource(join(dir, 'data', 'arr.json')).columns, ['a', 'b']); assert.equal(readSource(join(dir, 'data', 'g.json')).kind, 'geojson')
})
t('fence matching for all block types', () => {
  assert.equal(matchVizFence('chart{src=a.csv}', null).component, 'viz-chart'); assert.equal(matchVizFence('gantt', null).component, 'viz-gantt')
  assert.equal(matchVizFence('graph', null).attrs.mode, 'graph'); assert.equal(matchVizFence('charts', null), null)
})
t('xlsx sample: header detection skips title & param rows', () => {
  const p = '/Users/daniilosipov/Projects/docus-flow/public/cases/road-km-111-142-sample.xlsx'
  try { readSource(p) } catch { return } // sample not present on other machines
  assert.equal(readSource(p).columns[0], 'Вид работ'); assert.equal(readSource(p, { sheet: 'Маш-часы и парк' }).columns[0], 'Машина')
})
