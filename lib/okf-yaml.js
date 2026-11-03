import { Document, stringify } from 'yaml'

// Сериализует frontmatter-поля страницы в YAML для блока «Метаданные страницы».
// Скаляры и ключи экранирует библиотека `yaml`, поэтому `"true"`, `*x` и переводы строк не ломаются.
// Flow-формат задан явно на узлах: объекты и массивы скаляров — в одну строку,
// массив объектов — блоком, по одной строке на элемент.
function serializeField(key, value) {
  const doc = new Document({ [key]: value })
  const node = doc.get(key, true)
  if (node && typeof node === 'object' && 'items' in node) {
    const hasObjects = Array.isArray(value) && value.some(v => v && typeof v === 'object')
    if (hasObjects) {
      // сам список — блоком, каждый элемент (объект) — flow
      node.items.forEach((item) => {
        if (item && typeof item === 'object' && 'items' in item) item.flow = true
      })
    } else {
      node.flow = true
    }
  }
  return doc.toString({ lineWidth: 0 }).trimEnd()
}

export function serializeOkfFields(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => serializeField(key, value))
    .join('\n')
}

export { stringify }
