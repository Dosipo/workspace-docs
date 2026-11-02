import { stringify } from 'yaml'

// Сериализует frontmatter-поля страницы в YAML для блока «Метаданные страницы».
// Скаляры и ключи экранирует библиотека `yaml`, поэтому `"true"`, `*x` и переводы строк не ломаются.
// Скаляры, массивы скаляров и объекты — в одну строку (flow); массив объектов — по строке на элемент.
export function serializeOkfFields(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const listOfObjects = Array.isArray(value) && value.some(v => v && typeof v === 'object')
      return stringify({ [key]: value }, { flowLevel: listOfObjects ? 2 : 1, lineWidth: 0 }).trimEnd()
    })
    .join('\n')
}
