// Тесты разбора участников и представления полей блока «О странице».
// Запуск: npm run test:okf-actor
import assert from 'node:assert/strict'
import { parseActor, groupActors } from '../lib/okf-actor.js'
import {
  typeLabel, statusView, parseOkfDate, formatOkfDate, timeAgo, staleView, sourceView, sourceViews,
} from '../lib/okf-view.js'

let count = 0
function test(name, fn) {
  fn()
  count++
  console.log(`ok  ${name}`)
}

// --- parseActor ---------------------------------------------------------
test('human:<handle> — человек', () => {
  const a = parseActor('human:dosipo')
  assert.equal(a.kind, 'human')
  assert.equal(a.icon, 'i-lucide-user')
  assert.equal(parseActor('human:alsu@example.com').kind, 'human')
})

test('vendor/model — модель с логотипом вендора', () => {
  assert.deepEqual(
    [parseActor('claude/opus-5-5').icon, parseActor('anthropic/claude-3').icon],
    ['i-logos-claude-icon', 'i-logos-claude-icon'],
  )
  const gpt = parseActor('gpt/gpt-5')
  assert.equal(gpt.kind, 'model')
  assert.equal(gpt.icon, 'i-logos-openai-icon')
  assert.equal(gpt.darkInvert, true)
  assert.equal(parseActor('openai/o3').icon, 'i-logos-openai-icon')
  assert.equal(parseActor('mistral/large').icon, 'i-logos-mistral-ai-icon')
  assert.equal(parseActor('llama/3-70b').icon, 'i-logos-meta-icon')
  assert.equal(parseActor('meta/llama-4').icon, 'i-logos-meta-icon')
  assert.equal(parseActor('Claude/Sonnet-4-6').kind, 'model', 'вендор без учёта регистра')
})

test('Имя/платформа — агент без логотипа', () => {
  const a = parseActor('Mika/multica')
  assert.equal(a.kind, 'agent')
  assert.equal(a.icon, 'i-lucide-bot')
  assert.equal(a.vendorIcon, null)
  assert.equal(parseActor('multica-agent/multica').kind, 'agent')
})

test('Имя/модель — агент с маленьким логотипом вендора', () => {
  const a = parseActor('Docs/claude-sonnet-5-5')
  assert.equal(a.kind, 'agent')
  assert.equal(a.icon, 'i-lucide-bot')
  assert.equal(a.vendor, 'claude')
  assert.equal(a.vendorIcon, 'i-logos-claude-icon')
  assert.equal(parseActor('Helper/gpt-5').vendorIcon, 'i-logos-openai-icon')
  assert.equal(parseActor('Helper/gpt-5').vendorDarkInvert, true)
})

test('прочие форматы — «Другие», не агенты', () => {
  for (const id of ['ci-bot', '', 'a/b/c', '/x', 'x/', 'human:', 'Имя модель/x', undefined, null, 42]) {
    const a = parseActor(id)
    assert.equal(a.kind, 'other', String(id))
    assert.equal(a.icon, 'i-lucide-circle-help')
  }
})

// --- groupActors --------------------------------------------------------
test('объединение contributors ∪ created_by ∪ updated_by без повторов по id', () => {
  const groups = groupActors(
    [
      { id: 'Mika/multica', name: 'Mika' },
      { id: 'human:dosipo', name: 'Даниил Осипов' },
      { id: 'claude/sonnet-4-6', name: 'Claude Sonnet 4.6' },
      { id: 'Mika/multica', name: 'Mika (дубль)' },
    ],
    { id: 'Mika/multica', name: 'Mika' },
    { id: 'Docs/claude-sonnet-5-5', name: 'Docs' },
  )
  assert.deepEqual(groups.map(g => g.label), ['Люди', 'Агенты', 'Модели'])
  assert.deepEqual(groups[1].actors.map(a => a.name), ['Mika', 'Docs'])
  assert.equal(groups.flatMap(g => g.actors).length, 4)
})

test('группа «Другие» последней; пустые и битые записи пропускаются', () => {
  const groups = groupActors(
    [{ id: 'ci-bot', name: 'ci-bot' }, null, 'str', { name: 'без id' }, { id: '  ' }],
    undefined,
    null,
    { id: 'human:anna' },
  )
  assert.deepEqual(groups.map(g => g.kind), ['human', 'other'])
  assert.equal(groups[0].actors[0].name, 'human:anna', 'без name выводится id')
})

test('10+ участников — все на месте и по группам', () => {
  const list = Array.from({ length: 12 }, (_, i) => ({ id: `human:u${i}`, name: `U${i}` }))
  const groups = groupActors(list)
  assert.equal(groups[0].actors.length, 12)
})

test('нет участников — пустой список', () => {
  assert.deepEqual(groupActors(undefined, null, []), [])
})

// --- okf-view -----------------------------------------------------------
test('тип: перевод и неизвестное как есть', () => {
  assert.equal(typeLabel('Reference'), 'Справочник')
  assert.equal(typeLabel('Playbook'), 'Плейбук')
  assert.equal(typeLabel('Whitepaper'), 'Whitepaper')
  assert.equal(typeLabel(''), null)
})

test('статус: подпись и цвет', () => {
  assert.deepEqual(statusView('stable'), { label: 'Стабильная', color: 'success' })
  assert.deepEqual(statusView('draft'), { label: 'Черновик', color: 'warning' })
  assert.deepEqual(statusView('deprecated'), { label: 'Устарела', color: 'error' })
  assert.equal(statusView('beta').label, 'beta')
  assert.equal(statusView(undefined), null)
})

test('даты: оба формата и формат вывода', () => {
  assert.equal(parseOkfDate('30.10.2026'), Date.UTC(2026, 9, 30))
  assert.equal(parseOkfDate('2027-04-30T00:00:00Z'), Date.UTC(2027, 3, 30))
  assert.equal(parseOkfDate('2026-11-02'), Date.UTC(2026, 10, 2))
  assert.equal(parseOkfDate('завтра'), null)
  assert.equal(formatOkfDate(Date.UTC(2026, 9, 30)), '30 окт. 2026')
  assert.equal(formatOkfDate(Date.UTC(2026, 10, 2)), '2 нояб. 2026')
  assert.equal(formatOkfDate(Date.UTC(2026, 8, 1)), '1 сент. 2026')
})

test('относительное время', () => {
  const today = Date.UTC(2026, 10, 3)
  assert.equal(timeAgo(today, today), 'сегодня')
  assert.equal(timeAgo(Date.UTC(2026, 10, 2), today), 'вчера')
  assert.equal(timeAgo(Date.UTC(2026, 9, 31), today), '3 дня назад')
  assert.equal(timeAgo(Date.UTC(2026, 9, 20), today), '2 недели назад')
  assert.equal(timeAgo(Date.UTC(2026, 6, 3), today), '4 мес. назад')
})

test('срок проверки: > 30 дней, ≤ 30 дней, прошёл', () => {
  const today = Date.UTC(2026, 10, 3)
  assert.deepEqual(staleView(Date.UTC(2027, 3, 30), today), { text: 'осталось 178 дней', tone: 'muted' })
  assert.deepEqual(staleView(Date.UTC(2026, 10, 24), today), { text: 'осталось 21 день', tone: 'warning' })
  assert.deepEqual(staleView(Date.UTC(2026, 9, 15), today), { text: 'срок прошёл', tone: 'error' })
})

test('источники: файлы и ссылки показываются, internal:* — нет', () => {
  const list = sourceViews([
    { resource: 'internal:arealdev-kb', title: 'База' },
    { resource: 'file:Регламент закупок 2026.docx' },
    { resource: 'file:Бюджет Q4.xlsx', title: 'Бюджет' },
    { resource: 'file:схема' },
    { resource: 'https://github.com/Dosipo/workspace-docs', title: 'Репозиторий' },
    { resource: 'https://www.artificialanalysis.ai/models' },
    { resource: '/instrumenty/n8n' },
    null,
  ])
  assert.equal(list.length, 5)
  assert.deepEqual(list[0], { type: 'file', title: 'Регламент закупок 2026.docx', hint: 'документ Word', icon: 'i-lucide-file-text', darkInvert: false, href: null })
  assert.equal(list[1].icon, 'i-lucide-file-spreadsheet')
  assert.equal(list[1].hint, 'таблица Excel')
  assert.equal(list[2].icon, 'i-lucide-file')
  assert.equal(list[3].icon, 'i-logos-github-icon')
  assert.equal(list[3].hint, 'github.com')
  assert.equal(list[4].icon, 'i-lucide-globe')
  assert.equal(list[4].title, 'artificialanalysis.ai')
  assert.equal(list[4].hint, null, 'без title домен не повторяется')
  assert.equal(sourceView({ resource: 'https://docs.google.com/x' }).icon, 'i-logos-google-drive')
  assert.equal(sourceView({ resource: 'https://www.figma.com/file/1' }).icon, 'i-logos-figma')
  assert.equal(sourceView({ resource: 'https://notion.so/p' }).icon, 'i-logos-notion-icon')
  assert.deepEqual(sourceViews(undefined), [])
})

console.log(`\n${count} тестов прошло`)
