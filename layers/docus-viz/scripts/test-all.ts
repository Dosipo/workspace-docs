// Runs every *.test.ts in this folder; exit 1 if any fails.
import { readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const dir = dirname(fileURLToPath(import.meta.url))
let failed = 0, passed = 0
for (const f of readdirSync(dir).filter(f => f.endsWith('.test.ts')).sort()) {
  let out = '', crashed = ''
  try { out = execFileSync(process.execPath, [join(dir, f)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }
  catch (e: any) { out = e.stdout ?? ''; if (!/^✖/m.test(out)) crashed = String(e.stderr ?? e.message).split('\n').find(l => /Error/.test(l)) ?? 'crashed' }
  const p = (out.match(/^✓/gm) ?? []).length, x = (out.match(/^✖.*$/gm) ?? [])
  // a file that crashes or runs zero tests is a failure, never a silent pass
  if (crashed || p + x.length === 0) x.push(`✖ ${f} did not run: ${crashed || 'no tests found'}`)
  passed += p; failed += x.length
  console.log(`${x.length ? '✖' : '✓'} ${f}: ${p} passed${x.length ? `, ${x.length} failed` : ''}`)
  x.forEach(l => console.log(`    ${l}`))
}
console.log(`\n${passed} passed · ${failed} failed`)
process.exit(failed ? 1 : 0)
