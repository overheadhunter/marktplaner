import type { Stand } from './model'

/**
 * Effective stand numbers: explicit numbers are kept verbatim, the remaining stands are numbered 1, 2, 3, … in list order, skipping any value already taken explicitly.
 *
 * @param stands stands in list order
 * @return stand id → number
 */
export function standNumbers(stands: Stand[]): Map<string, string> {
  const explicit = new Set(stands.map((s) => s.number?.trim()).filter((n): n is string => !!n))
  const result = new Map<string, string>()
  let next = 1
  for (const s of stands) {
    const n = s.number?.trim()
    if (n) {
      result.set(s.id, n)
    } else {
      while (explicit.has(String(next))) next++
      result.set(s.id, String(next++))
    }
  }
  return result
}

/** Natural ordering for stand numbers, so that "2" sorts before "10" and "A1" before "A2". */
export function compareNumbers(a: string, b: string): number {
  return a.localeCompare(b, 'de', { numeric: true, sensitivity: 'base' })
}
