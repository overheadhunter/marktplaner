import { describe, expect, it } from 'vitest'
import { newStand } from './model'
import { compareNumbers, standNumbers } from './numbering'

const stand = (id: string, number?: string) => newStand({ id, number })

describe('standNumbers', () => {
  it('numbers stands consecutively in list order', () => {
    const n = standNumbers([stand('a'), stand('b'), stand('c')])
    expect([...n.values()]).toEqual(['1', '2', '3'])
  })

  it('keeps explicit numbers and skips them when auto-numbering', () => {
    const n = standNumbers([stand('a'), stand('b', '2'), stand('c'), stand('d', ' 1 '), stand('e', 'A7'), stand('f')])
    expect(n.get('a')).toBe('3')
    expect(n.get('b')).toBe('2')
    expect(n.get('c')).toBe('4')
    expect(n.get('d')).toBe('1')
    expect(n.get('e')).toBe('A7')
    expect(n.get('f')).toBe('5')
  })

  it('treats blank numbers as unset', () => {
    expect(standNumbers([stand('a', '   ')]).get('a')).toBe('1')
  })
})

describe('compareNumbers', () => {
  it('sorts naturally', () => {
    expect(['10', '2', 'A2', 'A10', '1'].sort(compareNumbers)).toEqual(['1', '2', '10', 'A2', 'A10'])
  })
})
