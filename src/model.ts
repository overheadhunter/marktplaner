import type { StandColor } from './colors'

/** Point in image pixel coordinates. */
export interface Point {
  x: number
  y: number
}

/** Position of a stand on the map: center in image pixels, angle in degrees (clockwise). */
export interface Placement {
  x: number
  y: number
  angle: number
}

/** Side of the stand (relative to its rotation handle being "top") on which the vehicle is parked. */
export type VehicleSide = 'left' | 'right' | 'bottom'

/** Optional vehicle parked next to a stand, same orientation, dimensions in meters. */
export interface Vehicle {
  enabled: boolean
  width: number
  depth: number
  side: VehicleSide
}

/** Gap between stand and vehicle in meters. */
export const VEHICLE_GAP = 1

/** Infrastructure a stand requires at its spot. */
export interface Utilities {
  power: boolean
  freshWater: boolean
  sewage: boolean
}

/** A market stand. Dimensions are in meters; `placement` is null while the stand is not on the map. */
export interface Stand {
  id: string
  name: string
  notes: string
  width: number
  depth: number
  placement: Placement | null
  vehicle?: Vehicle
  /** Color-code for the stand, defaults to `DEFAULT_COLOR` when absent. */
  color?: StandColor
  /** Required utilities; absent keys mean "not required". */
  utilities?: Partial<Utilities>
  /** Explicit stand number ("Standnummer"); empty/absent stands are auto-numbered, see `standNumbers()`. */
  number?: string
}

/** Two reference points on the image and their real-world distance in meters. */
export interface Reference {
  a: Point
  b: Point
  meters: number
}

/** What the map prints inside each stand: its name, or its (auto-)number with a legend. */
export type LabelMode = 'names' | 'numbers'

export interface Project {
  id: string
  name: string
  createdAt: string
  image: { width: number; height: number; type: string }
  reference: Reference
  labelMode: LabelMode
  /** Bottom-right corner of the legend in image px; defaults to the image's bottom-right corner. */
  legend?: Point
  stands: Stand[]
}

export function newId(): string {
  return crypto.randomUUID()
}

export function newVehicle(): Vehicle {
  return { enabled: true, width: 5, depth: 2, side: 'bottom' }
}

export function newStand(partial: Partial<Stand> = {}): Stand {
  return { id: newId(), name: 'Neuer Stand', notes: '', width: 3, depth: 2, placement: null, ...partial }
}
