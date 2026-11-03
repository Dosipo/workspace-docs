// Чистые функции для блока «О странице»: подписи типа и статуса, даты, источники.
// Относительное время считается от переданного `today` — компонент передаёт его только
// после монтирования, чтобы на сгенерированном сайте «вчера» не застыло на дате сборки.

export const TYPE_LABELS = {
  Guide: 'Руководство',
  Overview: 'Обзор',
  Reference: 'Справочник',
  Tutorial: 'Урок',
  Concept: 'Концепция',
  FAQ: 'Вопросы и ответы',
  Playbook: 'Плейбук',
  Dataset: 'Набор данных',
}

export const STATUS_VIEW = {
  stable: { label: 'Стабильная', color: 'success' },
  draft: { label: 'Черновик', color: 'warning' },
  deprecated: { label: 'Устарела', color: 'error' },
}

export function typeLabel(type) {
  if (typeof type !== 'string' || !type.trim()) return null
  return TYPE_LABELS[type] ?? type
}

export function statusView(status) {
  if (typeof status !== 'string' || !status.trim()) return null
  return STATUS_VIEW[status] ?? { label: status, color: 'neutral' }
}

const MONTHS = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.']
const DAY = 86_400_000

/** UTC-полночь или null, если такого дня нет (Date.UTC молча переносит 31.02 на 3 марта). */
function utcDay(year, month, day) {
  const ms = Date.UTC(year, month - 1, day)
  const d = new Date(ms)
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day ? ms : null
}

/** «30.10.2026», «2026-10-30», «2026-04-30T00:00:00Z» → UTC-полночь дня (ms) или null. */
export function parseOkfDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    value = value.toISOString()
  }
  if (typeof value !== 'string' || !value.trim()) return null
  const ru = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim())
  if (ru) return utcDay(+ru[3], +ru[2], +ru[1])
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value.trim())
  if (iso) return utcDay(+iso[1], +iso[2], +iso[3])
  return null
}

/** UTC-полночь → «30 окт. 2026». Не зависит от локали и часового пояса — одинаково на сервере и клиенте. */
export function formatOkfDate(day) {
  const d = new Date(day)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Сегодняшний день пользователя как UTC-полночь — чтобы сравнивать с parseOkfDate. */
export function todayUtc(now = new Date()) {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

export function plural(n, one, few, many) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

/** Сколько прошло с даты: «сегодня», «вчера», «3 дня назад», «2 недели назад», «4 мес. назад». */
export function timeAgo(day, today) {
  const n = Math.round((today - day) / DAY)
  if (n <= 0) return 'сегодня'
  if (n === 1) return 'вчера'
  if (n < 7) return `${n} ${plural(n, 'день', 'дня', 'дней')} назад`
  if (n < 30) {
    const w = Math.round(n / 7)
    return `${w} ${plural(w, 'неделю', 'недели', 'недель')} назад`
  }
  if (n < 365) return `${Math.round(n / 30.44)} мес. назад`
  const y = Math.round(n / 365.25)
  return `${y} ${plural(y, 'год', 'года', 'лет')} назад`
}

/** Срок проверки: { text, tone } — tone: 'muted' (> 30 дней), 'warning' (≤ 30), 'error' (прошёл). */
export function staleView(day, today) {
  const left = Math.round((day - today) / DAY)
  if (left < 0) return { text: 'срок прошёл', tone: 'error' }
  if (left === 0) return { text: 'сегодня', tone: 'warning' }
  return { text: `осталось ${left} ${plural(left, 'день', 'дня', 'дней')}`, tone: left <= 30 ? 'warning' : 'muted' }
}

const FILE_KINDS = {
  xlsx: { icon: 'i-lucide-file-spreadsheet', label: 'таблица Excel' },
  xls: { icon: 'i-lucide-file-spreadsheet', label: 'таблица Excel' },
  csv: { icon: 'i-lucide-file-spreadsheet', label: 'таблица CSV' },
  docx: { icon: 'i-lucide-file-text', label: 'документ Word' },
  doc: { icon: 'i-lucide-file-text', label: 'документ Word' },
  pdf: { icon: 'i-lucide-file-text', label: 'PDF' },
  md: { icon: 'i-lucide-file-text', label: 'Markdown' },
  txt: { icon: 'i-lucide-file-text', label: 'текст' },
  png: { icon: 'i-lucide-image', label: 'изображение' },
  jpg: { icon: 'i-lucide-image', label: 'изображение' },
  jpeg: { icon: 'i-lucide-image', label: 'изображение' },
}

const SITE_LOGOS = {
  'github.com': { icon: 'i-logos-github-icon', darkInvert: true },
  'notion.so': { icon: 'i-logos-notion-icon' },
  'notion.site': { icon: 'i-logos-notion-icon' },
  'figma.com': { icon: 'i-logos-figma' },
  'drive.google.com': { icon: 'i-logos-google-drive' },
  'docs.google.com': { icon: 'i-logos-google-drive' },
}

// Адреса самой базы: прод, staging и превью Vercel. Ссылки на них — внутренние,
// в «Источниках» не показываются (остаются только в YAML).
const KB_HOSTS = ['workspace-docs-rho.vercel.app', 'workspace-docs-staging.vercel.app']
const KB_HOST_PATTERNS = [/^workspace-docs(?:-[a-z0-9-]+)?-dosipos-projects\.vercel\.app$/]

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

/**
 * Ссылка ведёт на саму базу?
 * @param {string} url
 * @param {string[]} [origins] дополнительные адреса базы, например текущий origin после монтирования
 */
export function isKbUrl(url, origins = []) {
  const host = hostOf(url)
  if (!host) return false
  if (KB_HOSTS.includes(host) || KB_HOST_PATTERNS.some(re => re.test(host))) return true
  return origins.some(origin => hostOf(origin) === host)
}

/**
 * Источник для блока «О странице» или null, если его показывать не нужно
 * (internal:* и ссылки на саму базу остаются только в YAML).
 * @param {object} source
 * @param {{ origins?: string[] }} [options]
 */
export function sourceView(source, { origins = [] } = {}) {
  const resource = typeof source?.resource === 'string' ? source.resource.trim() : ''
  const title = typeof source?.title === 'string' && source.title.trim() ? source.title.trim() : null

  if (/^file:./.test(resource)) {
    const name = resource.slice(5).trim()
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
    const kind = FILE_KINDS[ext] ?? { icon: 'i-lucide-file', label: 'файл' }
    return { type: 'file', title: title ?? name, hint: kind.label, icon: kind.icon, darkInvert: false, href: null }
  }

  if (/^https?:\/\/[^\s/]+/i.test(resource) && hostOf(resource) && !isKbUrl(resource, origins)) {
    const host = resource.replace(/^https?:\/\//i, '').split(/[/?#]/)[0].replace(/^www\./, '').toLowerCase()
    const logo = SITE_LOGOS[host] ?? { icon: 'i-lucide-globe' }
    return { type: 'link', title: title ?? host, hint: title ? host : null, icon: logo.icon, darkInvert: !!logo.darkInvert, href: resource }
  }

  return null
}

export function sourceViews(sources, options) {
  return (Array.isArray(sources) ? sources : []).map(source => sourceView(source, options)).filter(Boolean)
}
