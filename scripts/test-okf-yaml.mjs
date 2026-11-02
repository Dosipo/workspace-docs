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
