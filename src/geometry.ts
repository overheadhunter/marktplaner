import type { Point, Reference } from './model'

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Image pixels per real-world meter derived from the calibration reference. */
export function pxPerMeter(ref: Reference): number {
  return distance(ref.a, ref.b) / ref.meters
}

/** Formats a length in meters with centimeter resolution, e.g. `12.34 m`. */
export function formatMeters(m: number): string {
  return `${m.toFixed(2)} m`
}

/** Normalizes an angle into `[0, 360)`. */
export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360
}

export function snapAngle(deg: number, step: number): number {
  return normalizeAngle(Math.round(deg / step) * step)
}

/**
 * Rotation for a stand's label so that the text runs along the longer side and is never upside down.
 *
 * @param angle rotation of the stand in degrees
 * @param width stand width (the side along the un-rotated x axis)
 * @param depth stand depth (the side along the un-rotated y axis)
 * @return label rotation in degrees within `(-90, 90]`
 */
export function labelAngle(angle: number, width: number, depth: number): number {
  const base = width >= depth ? angle : angle + 90
  // map into (-90, 90]
  const n = normalizeAngle(base)
  return n > 90 && n <= 270 ? n - 180 : n > 270 ? n - 360 : n
}

/** Font size (in image px) that fits `name` into a box of the given side lengths. */
export function labelFontSize(name: string, longSidePx: number, shortSidePx: number): number {
  const chars = Math.max(1, name.length)
  return Math.max(0, Math.min(shortSidePx * 0.6, (longSidePx * 0.9) / (0.6 * chars)))
}
