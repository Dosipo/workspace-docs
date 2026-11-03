import assert from 'node:assert/strict'
import { parseChart, niceTicks } from '../shared/chart-dsl.ts'
const t = (name: string, fn: () => void) => { try { fn(); console.log('✓', name) } catch (e) { console.log('✖', name, (e as Error).message); process.exitCode = 1 } }
const hours = { kind: 'table', columns: ['Машина', 'Маш.час', 'Расчётное число', 'Принято'], rows: [['SD 26', 4234.72, 2.57, 3], ['SD 32', 2614.98, 1.58, 2], ['Самосвал', 60171.9, 36.47, 37], ['ИТОГО', 67021.6, null, 42]] }
t('defaults: first text col x, all numeric y', () => { const d = parseChart('', hours); assert.deepEqual(d.categories, ['SD 26', 'SD 32', 'Самосвал']); assert.equal(d.series.length, 3) })
t('totals row excluded with note', () => assert.ok(parseChart('', hours).notes.some(n => /ИТОГО/.test(n))))
t('y by name and letter', () => { assert.equal(parseChart('y: Маш.час', hours).series[0]!.name, 'Маш.час'); assert.equal(parseChart('y: D', hours).series[0]!.name, 'Принято') })
t('unknown column lists available', () => assert.match(parseChart('y: Нет', hours).errors[0]!, /Маш\.час/))
t('sort desc', () => assert.equal(parseChart('y: Маш.час\nsort: desc', hours).categories[0], 'Самосвал'))
t('top N groups rest', () => { const d = parseChart('y: Маш.час\ntop: 1', hours); assert.equal(d.categories.length, 2); assert.match(d.categories[1]!, /Прочее/); assert.ok(Math.abs(d.series[0]!.values[1]! - 6849.7) < 0.01) })
t('inline pipe table with ru numbers', () => { const d = parseChart('type: line\nМесяц | План | Факт\n---|---|---\nЯнв | 1 200,5 | 1100\nФев | 900 | 950'); assert.equal(d.errors.length, 0); assert.equal(d.series[0]!.values[0], 1200.5) })
t('pie negative errors', () => assert.ok(parseChart('type: pie\na,b\nx,-1').errors.length))
t('unknown type errors', () => assert.ok(parseChart('type: radar', hours).errors.length))
t('no data errors', () => assert.ok(parseChart('title: x').errors.length))
t('nice ticks', () => { assert.deepEqual(niceTicks(0, 60171), [0, 20000, 40000, 60000, 80000].slice(0, niceTicks(0, 60171).length)); assert.ok(niceTicks(0, 60171).at(-1)! >= 60171) })
t('totals excluded even with custom exclude', () => { const d = parseChart('y: Принято\nexclude: Самосвал', hours); assert.ok(!d.categories.includes('ИТОГО')); assert.ok(!d.categories.includes('Самосвал')) })
t('total: keep', () => assert.ok(parseChart('y: Принято\ntotal: keep', hours).categories.includes('ИТОГО')))
t('where filter by column value', () => {
  const vol = { kind: 'table', columns: ['Вид', 'Ед', 'Объём'], rows: [['A', 'м3', 10], ['B', 'м2', 20], ['C', 'м3', 5]] }
  const d = parseChart('x: Вид\ny: Объём\nwhere: Ед = м3', vol); assert.deepEqual(d.categories, ['A', 'C'])
})
t('where bad syntax errors', () => assert.ok(parseChart('where: ???', hours).errors.length))
