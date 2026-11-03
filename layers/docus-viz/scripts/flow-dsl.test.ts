import { parseFlow, applyOverrides } from '../shared/flow-dsl.ts'
import { matchFlowFence } from '../remark-viz.mjs'
import assert from 'node:assert/strict'
const t = (name: string, fn: () => void) => { try { fn(); console.log('✓', name) } catch (e) { console.log('✖', name, (e as Error).message); process.exitCode = 1 } }
t('group-N id no collision', () => { const d = parseFlow('group G: x\ngroup-0 -> x'); assert.equal(d.errors.length, 0); assert.notEqual(d.groups[0]!.id, 'group-0') })
t('# in labels kept', () => { const d = parseFlow('a [service] See http://foo.com/x#y and #tag\na -> b : issue #42\nb -> c : note  # comment\n# full comment'); assert.equal(d.nodes[0]!.label, 'See http://foo.com/x#y and #tag'); assert.equal(d.edges[0]!.label, 'issue #42'); assert.equal(d.edges[1]!.label, 'note') })
t('\\# escape', () => assert.equal(parseFlow('a -> b : x  \\# y').edges[0]!.label, 'x  # y'))
t('colon variants', () => { for (const l of ['a -> b: L', 'a -> b :L', 'a -> b : L', 'a->b:L']) { const d = parseFlow(l); assert.equal(d.errors.length, 0, l); assert.equal(d.edges[0]!.label, 'L', l) } })
t('label with colon & arrow text', () => assert.equal(parseFlow('a -> b : GET http://x:80/a').edges[0]!.label, 'GET http://x:80/a'))
t('cyrillic ids', () => { const d = parseFlow('пользователь -> сервис : запрос'); assert.equal(d.errors.length, 0); assert.equal(d.nodes[0]!.label, 'Пользователь') })
t('id: Label decl', () => assert.equal(parseFlow('api: API Gateway').nodes[0]!.label, 'API Gateway'))
t('node named group/link as edge', () => { const d = parseFlow('group -> link : x'); assert.equal(d.errors.length, 0); assert.equal(d.edges.length, 1) })
t('malformed link errors', () => assert.ok(parseFlow('link a: b c').errors.length))
t('self-loop warns', () => assert.ok(parseFlow('a -> a : retry').warnings.length))
t('direction override + lowercase', () => { const d = applyOverrides(parseFlow('a -> b'), { direction: 'tb' }); assert.equal(d.direction, 'TB'); assert.ok(d.directionSet) })
t('bad direction override errors', () => assert.ok(applyOverrides(parseFlow('a -> b'), { direction: 'up' }).errors.length))
t('graph lang implies mode', () => assert.equal(applyOverrides(parseFlow('a -> b'), { lang: 'graph' }).mode, 'graph'))
t('fence no-space meta', () => assert.deepEqual(matchFlowFence('flow{height=300}', null), { lang: 'flow', attrs: { height: '300' } }))
t('fence other lang', () => assert.equal(matchFlowFence('flowchart', null), null))
t('empty arrow side errors', () => assert.ok(parseFlow('a -> : x').errors.length))
import { tableToFlowDsl } from '../shared/flow-dsl.ts'
t('table src → edges in order', () => {
  const { dsl } = tableToFlowDsl({ kind: 'table', columns: ['Откуда', 'Куда', 'Действие', 'Тип'], rows: [['Клиент', 'API', 'запрос', ''], ['API', 'Очередь', 'событие', 'async']] })
  const d = parseFlow(dsl)
  assert.equal(d.errors.length, 0, dsl); assert.equal(d.edges.length, 2); assert.equal(d.edges[1]!.style, 'dashed'); assert.equal(d.nodes[0]!.label, 'Клиент')
})
t('table src with spaces in names', () => {
  const d = parseFlow(tableToFlowDsl({ kind: 'table', columns: ['from', 'to'], rows: [['Бухгалтерия отдел', 'Склад №2']] }).dsl)
  assert.equal(d.errors.length, 0); assert.equal(d.nodes[1]!.label, 'Склад №2')
})
t('table src node list', () => {
  const d = parseFlow(tableToFlowDsl({ kind: 'table', columns: ['id', 'Название', 'Тип', 'Описание'], rows: [['db', 'База', 'store', 'Postgres']] }).dsl + '\nx -> db')
  assert.equal(d.nodes.find(n => n.id === 'db')!.kind, 'store'); assert.equal(d.nodes.find(n => n.id === 'db')!.description, 'Postgres')
})
t('table src wrong columns errors', () => assert.ok(tableToFlowDsl({ kind: 'table', columns: ['a'], rows: [] }).error))
