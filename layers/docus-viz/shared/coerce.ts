/** "1 234,5" / "1,234.5" / "12" → number; trims text; empty → null. Mirrors sources/index.mjs#coerce. */
export function coerce(v: unknown): unknown {
  if (typeof v !== 'string') return v ?? null
  const s = v.trim()
  if (s === '') return null
  const t = s.replace(/[\s ]/g, '')
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return Number(t.replace(/,/g, ''))
  if (/^-?\d+,\d+$/.test(t)) return Number(t.replace(',', '.'))
  if (/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(t)) return Number(t)
  return s
}
