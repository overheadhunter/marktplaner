/** Tailwind palette names offered for color-coding stands. The utilities built from them are safelisted in `style.css`. */
export const STAND_COLORS = ['red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan', 'blue', 'violet', 'fuchsia', 'rose'] as const

export type StandColor = (typeof STAND_COLORS)[number]

export const DEFAULT_COLOR: StandColor = 'orange'

export const COLOR_LABELS: Record<StandColor, string> = {
  red: 'Rot',
  orange: 'Orange',
  yellow: 'Gelb',
  lime: 'Limette',
  green: 'Grün',
  teal: 'Türkis',
  cyan: 'Cyan',
  blue: 'Blau',
  violet: 'Violett',
  fuchsia: 'Fuchsia',
  rose: 'Rosé',
}

/** Utility classes for rendering a stand in the given color; the `selected` variants use darker shades and higher opacity. */
export function standClasses(color: StandColor, selected: boolean) {
  const c = color
  return {
    fill: selected ? `fill-${c}-500/60` : `fill-${c}-400/40`,
    stroke: selected ? `stroke-${c}-800` : `stroke-${c}-600`,
    vehicleFill: selected ? `fill-${c}-300/40` : `fill-${c}-200/40`,
    vehicleStroke: selected ? `stroke-${c}-700` : `stroke-${c}-500`,
    arrow: `fill-${c}-700 hover:fill-${c}-500`,
    handle: `stroke-${c}-800`,
    swatch: `bg-${c}-500`,
  }
}
