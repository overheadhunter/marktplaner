import { faBoltLightning, faDroplet, type IconDefinition } from '@fortawesome/free-solid-svg-icons'
import type { Stand, Utilities } from './model'

/** Display metadata for each utility a stand may require; order defines the rendering order of the icons. */
export const UTILITIES: { key: keyof Utilities; label: string; icon: IconDefinition; cls: string }[] = [
  { key: 'power', label: 'Strom', icon: faBoltLightning, cls: 'text-yellow-500' },
  { key: 'freshWater', label: 'Frischwasser', icon: faDroplet, cls: 'text-blue-500' },
  { key: 'sewage', label: 'Abwasser', icon: faDroplet, cls: 'text-amber-800' },
]

/** Utilities enabled on the given stand, in display order. */
export function activeUtilities(stand: Stand) {
  return UTILITIES.filter((u) => stand.utilities?.[u.key])
}
