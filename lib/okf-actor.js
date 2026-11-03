// Разбор id участника OKF (created_by, updated_by, contributors) для блока «О странице».
//   human:<handle>           → человек
//   <vendor>/<model>         → модель (vendor из MODEL_VENDORS)
//   <Имя>/<платформа|модель> → ИИ-агент; если после «/» известная модель — рядом логотип вендора
//   всё остальное            → «Другие» (не записываем молча в агентов)

// Логотипы из @iconify-json/logos. darkInvert — монохромный тёмный логотип,
// который в тёмной теме нужно инвертировать, иначе он не виден.
const LOGOS = new Map(Object.entries({
  claude: { icon: 'i-logos-claude-icon' },
  anthropic: { icon: 'i-logos-claude-icon' },
  gpt: { icon: 'i-logos-openai-icon', darkInvert: true },
  openai: { icon: 'i-logos-openai-icon', darkInvert: true },
  mistral: { icon: 'i-logos-mistral-ai-icon' },
  llama: { icon: 'i-logos-meta-icon' },
  meta: { icon: 'i-logos-meta-icon' },
  gemini: { icon: 'i-logos-google-gemini-icon' },
  deepseek: { icon: 'i-logos-deepseek-icon' },
  qwen: { icon: 'i-logos-qwen-icon' },
}))

export const MODEL_VENDORS = [...LOGOS.keys()]

export const ACTOR_KINDS = ['human', 'agent', 'model', 'other']

export const ACTOR_LABELS = {
  human: { group: 'Люди', title: 'Человек' },
  agent: { group: 'Агенты', title: 'ИИ-агент' },
  model: { group: 'Модели', title: 'Модель' },
  other: { group: 'Другие', title: 'Тип не распознан' },
}

const KIND_ICONS = {
  human: 'i-lucide-user',
  agent: 'i-lucide-bot',
  model: 'i-lucide-sparkles',
  other: 'i-lucide-circle-help',
}

function vendorLogo(name) {
  // Map, а не объект: ключи вроде «constructor» или «__proto__» не должны находить прототип.
  const logo = LOGOS.get(String(name || '').toLowerCase())
  return logo ? { vendor: String(name).toLowerCase(), ...logo } : null
}

/**
 * @param {string} id
 * @returns {{ kind: 'human'|'agent'|'model'|'other', icon: string, darkInvert: boolean, vendor: string|null, vendorIcon: string|null, vendorDarkInvert: boolean }}
 */
export function parseActor(id) {
  const value = typeof id === 'string' ? id.trim() : ''
  const base = { darkInvert: false, vendor: null, vendorIcon: null, vendorDarkInvert: false }

  // Вся строка целиком: «human:anna/extra» и «human:anna extra» — не человек.
  if (/^human:[^\s/]+$/.test(value)) {
    return { ...base, kind: 'human', icon: KIND_ICONS.human }
  }

  const pair = /^([^\s/:]+)\/([^\s/:]+)$/.exec(value)
  if (!pair) {
    return { ...base, kind: 'other', icon: KIND_ICONS.other }
  }

  const [, owner, rest] = pair
  const asModel = vendorLogo(owner)
  if (asModel) {
    return { ...base, kind: 'model', icon: asModel.icon, darkInvert: !!asModel.darkInvert, vendor: asModel.vendor }
  }

  // Агент: «Docs/claude-sonnet-5-5» → вендор claude; «Mika/multica» → без логотипа
  const onModel = vendorLogo(rest.split(/[-_.]/)[0])
  return {
    ...base,
    kind: 'agent',
    icon: KIND_ICONS.agent,
    vendor: onModel ? onModel.vendor : null,
    vendorIcon: onModel ? onModel.icon : null,
    vendorDarkInvert: onModel ? !!onModel.darkInvert : false,
  }
}

/**
 * Объединяет участников без повторов по id и раскладывает по видам.
 * Порядок внутри группы — порядок первого появления.
 * @param  {...(object|object[]|undefined|null)} lists
 * @returns {{ kind: string, label: string, actors: Array<{ id: string, name: string } & ReturnType<typeof parseActor>> }[]}
 */
export function groupActors(...lists) {
  const seen = new Set()
  const groups = { human: [], agent: [], model: [], other: [] }
  for (const list of lists) {
    for (const actor of [].concat(list ?? [])) {
      if (!actor || typeof actor !== 'object') continue
      const id = typeof actor.id === 'string' ? actor.id.trim() : ''
      if (!id || seen.has(id)) continue
      seen.add(id)
      const parsed = parseActor(id)
      const name = typeof actor.name === 'string' && actor.name.trim() ? actor.name.trim() : id
      groups[parsed.kind].push({ id, name, ...parsed })
    }
  }
  return ACTOR_KINDS
    .filter(kind => groups[kind].length)
    .map(kind => ({ kind, label: ACTOR_LABELS[kind].group, actors: groups[kind] }))
}
