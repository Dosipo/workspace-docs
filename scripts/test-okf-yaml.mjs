// Проверка round-trip: parse(serializeOkfFields(x)) === x. Запуск: npm run test:okf-yaml
import assert from 'node:assert/strict'
import { parse } from 'yaml'
import { serializeOkfFields } from '../lib/okf-yaml.js'

const cases = {
  'строка "true"': { contributors: [{ id: 'a/b', name: 'true' }] },
  'имя *author (alias)': { contributors: [{ id: 'x', name: '*author' }] },
  'перевод строки': { note: 'строка 1\nстрока 2', contributors: [{ name: 'a\nb' }] },
  'ключи с двоеточием и пробелом': { generated: { 'a: b': 'x', 'c d': 'y' } },
  'null/число/boolean-строки': { v: ['null', '123', 'yes', '~', ''], n: 5, b: false },
  'кавычки и #': { name: `O'Neil "Q" #1`, id: 'human:dosipo' },
  'объект generated': { generated: { by: 'human:dosipo', at: '2026-11-02T13:11:59Z' } },
  'теги': { tags: ['overview', 'ai-tools', 'n8n'] },
  'contributors из PR': {
    created_by: { id: 'Mika/multica', name: 'Mika' },
    contributors: [
      { id: 'Mika/multica', name: 'Mika' },
      { id: 'human:dosipo', name: 'Даниил Осипов' },
      { id: 'claude/sonnet-4-6', name: 'Claude Sonnet 4.6' },
    ],
  },
}

for (const [name, input] of Object.entries(cases)) {
  const out = serializeOkfFields(input)
  assert.deepEqual(parse(out), input, `${name}\n${out}`)
  console.log(`ok  ${name}`)
}
assert.equal(serializeOkfFields({ a: null, b: undefined }), '')
console.log('ok  null/undefined пропускаются')

// Проверки самого вывода (формата), а не только round-trip
const lines = s => s.split('\n')
const people = [
  { id: 'Mika/multica', name: 'Mika' },
  { id: 'human:dosipo', name: 'Даниил Осипов' },
  { id: 'claude/opus-5-5', name: 'Claude Opus 5.5' },
]
const c = serializeOkfFields({ contributors: people })
assert.deepEqual(lines(c), [
  'contributors:',
  '  - { id: Mika/multica, name: Mika }',
  '  - { id: human:dosipo, name: Даниил Осипов }',
  '  - { id: claude/opus-5-5, name: Claude Opus 5.5 }',
], c)
console.log('ok  формат: один участник = одна строка')

const t = serializeOkfFields({ tags: ['overview', 'n8n'] })
assert.equal(t, 'tags: [ overview, n8n ]', t)
console.log('ok  формат: tags в flow')

const g = serializeOkfFields({ generated: { by: 'human:dosipo', at: '2026-11-02T13:11:59Z' } })
assert.equal(lines(g).length, 1, g)
assert.match(g, /^generated: \{ by: .*, at: .* \}$/, g)
console.log('ok  формат: вложенный объект в одну строку (flow)')
