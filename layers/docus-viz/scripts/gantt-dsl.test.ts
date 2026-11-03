import assert from 'node:assert/strict'
import { parseGantt, parseDate, formatDay } from '../shared/gantt-dsl.ts'
const t = (name: string, fn: () => void) => { try { fn(); console.log('✓', name) } catch (e) { console.log('✖', name, (e as Error).message); process.exitCode = 1 } }
const plan = `title: Этапы
unit: смена
today: 45
section Этап 1
s1 Мобилизация SD 32 : 1 - 30
section Этап 2
s2 Пиковая мощность : after s1, 80 [crit]
s3 Финиш : after s2, 40
done Сдача : 150 [milestone]
  | 52 ед. техники`
t('unit scale with after-chains', () => {
  const d = parseGantt(plan)
  assert.equal(d.errors.length, 0, d.errors.join('; '))
  assert.deepEqual(d.tasks.map(x => [x.id, x.start, x.end]), [['s1', 1, 30], ['s2', 31, 110], ['s3', 111, 150], ['done', 150, 150]])
  assert.equal(d.unit, 'смена'); assert.equal(d.today, 45); assert.deepEqual(d.sections, ['Этап 1', 'Этап 2'])
  assert.ok(d.tasks[1]!.crit); assert.ok(d.tasks[3]!.milestone); assert.equal(d.tasks[3]!.description, '52 ед. техники')
})
t('dates ISO and DD.MM.YYYY', () => {
  const d = parseGantt('a Проект : 2026-03-01 - 15.03.2026\nb Сдача : after a, 3')
  assert.equal(d.isDate, true); assert.equal(d.errors.length, 0, d.errors.join())
  assert.equal(formatDay(d.tasks[1]!.start), '16.03.2026'); assert.equal(formatDay(d.tasks[1]!.end), '18.03.2026')
})
t('start, duration', () => assert.deepEqual([parseGantt('a A : 5, 10').tasks[0]!.start, parseGantt('a A : 5, 10').tasks[0]!.end], [5, 14]))
t('end before start errors', () => assert.ok(parseGantt('a A : 10 - 5').errors.length))
t('unknown dependency errors', () => assert.match(parseGantt('a A : after zz, 3').errors[0]!, /zz/))
t('circular dependency errors', () => assert.ok(parseGantt('a A : after b, 1\nb B : after a, 1').errors.some(e => /circular/.test(e))))
t('unknown flag errors', () => assert.ok(parseGantt('a A : 1 - 2 [urgent]').errors.length))
t('table src with ru columns', () => {
  const d = parseGantt('unit: неделя', { kind: 'table', columns: ['Этап', 'Начало', 'Длительность', 'Раздел', 'Статус'], rows: [['Проект', 1, 4, 'ПИР', 'готово'], ['Стройка', 5, 20, 'СМР', 'в работе']] })
  assert.equal(d.errors.length, 0, d.errors.join()); assert.equal(d.tasks[1]!.end, 24); assert.ok(d.tasks[0]!.done); assert.ok(d.tasks[1]!.active)
})
t('excel serial dates in table', () => {
  const d = parseGantt('', { kind: 'table', columns: ['Задача', 'Дата начала', 'Дата окончания'], rows: [['A', 46082, 46090]] })
  assert.equal(d.isDate, true, d.errors.join()); assert.equal(formatDay(d.tasks[0]!.start), '01.03.2026')
})
t('parseDate rejects overflow', () => { assert.equal(parseDate('2026-13-45'), undefined); assert.equal(parseDate('31.02.2026'), undefined); assert.ok(parseDate('29.02.2028')) })
import { plural } from '../shared/plural.ts'
t('ru plurals', () => { assert.equal(plural(30, 'смена'), '30 смен'); assert.equal(plural(21, 'смена'), '21 смена'); assert.equal(plural(3, 'день'), '3 дня'); assert.equal(plural(12, 'неделя'), '12 недель'); assert.equal(plural(5, 'sprint'), '5 sprint') })
