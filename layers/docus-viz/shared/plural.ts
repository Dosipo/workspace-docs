/** Russian plural forms for unit words: plural(30, 'смена') → "30 смен". Unknown words are left as is. */
const FORMS: Record<string, [string, string, string]> = {
  смена: ['смена', 'смены', 'смен'], день: ['день', 'дня', 'дней'], неделя: ['неделя', 'недели', 'недель'],
  месяц: ['месяц', 'месяца', 'месяцев'], час: ['час', 'часа', 'часов'], год: ['год', 'года', 'лет'],
  квартал: ['квартал', 'квартала', 'кварталов'], этап: ['этап', 'этапа', 'этапов'], задача: ['задача', 'задачи', 'задач'],
  спринт: ['спринт', 'спринта', 'спринтов'], сутки: ['сутки', 'суток', 'суток'],
}
export function pluralWord(n: number, word: string): string {
  const f = FORMS[word.toLowerCase()]
  if (!f || !Number.isInteger(n)) return f ? f[1] : word
  const a = Math.abs(n) % 100, b = a % 10
  return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b >= 2 && b <= 4 ? f[1] : f[2]
}
export const plural = (n: number, word: string) => `${n.toLocaleString('ru-RU')} ${pluralWord(n, word)}`
