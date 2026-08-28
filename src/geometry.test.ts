import { describe, expect, it } from 'vitest'
import { distance, formatMeters, labelAngle, labelFontSize, normalizeAngle, pxPerMeter, snapAngle } from './geometry'

describe('geometry', () => {
  it('distance / pxPerMeter', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(pxPerMeter({ a: { x: 0, y: 0 }, b: { x: 100, y: 0 }, meters: 12.5 })).toBe(8)
  })

  it('formatMeters uses two decimals', () => {
    expect(formatMeters(1)).toBe('1.00 m')
    expect(formatMeters(12.345)).toBe('12.35 m')
  })

  it('normalizeAngle / snapAngle', () => {
    expect(normalizeAngle(-90)).toBe(270)
    expect(normalizeAngle(725)).toBe(5)
    expect(snapAngle(37, 15)).toBe(30)
    expect(snapAngle(-7, 15)).toBe(0)
  })

  it('labelAngle follows the longer side and stays upright', () => {
    expect(labelAngle(0, 3, 2)).toBe(0)
    expect(labelAngle(0, 2, 3)).toBe(90)
    expect(labelAngle(30, 3, 2)).toBe(30)
    expect(labelAngle(120, 3, 2)).toBe(-60)
    expect(labelAngle(180, 3, 2)).toBe(0)
    expect(labelAngle(270, 3, 2)).toBe(90)
    expect(labelAngle(300, 3, 2)).toBe(-60)
    expect(labelAngle(45, 2, 3)).toBe(-45)
    for (let a = 0; a < 360; a += 7) {
      const l = labelAngle(a, 3, 2)
      expect(l).toBeGreaterThan(-90)
      expect(l).toBeLessThanOrEqual(90)
    }
  })

  it('labelFontSize fits the box', () => {
    expect(labelFontSize('AB', 100, 50)).toBeCloseTo(30)
    expect(labelFontSize('A'.repeat(20), 100, 50)).toBeCloseTo(7.5)
    expect(labelFontSize('', 100, 50)).toBeGreaterThan(0)
  })
})
