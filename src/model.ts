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

/** A market stand. Dimensions are in meters; `placement` is null while the stand is not on the map. */
export interface Stand {
  id: string
  name: string
  notes: string
  width: number
  depth: number
  placement: Placement | null
}

/** Two reference points on the image and their real-world distance in meters. */
export interface Reference {
  a: Point
  b: Point
  meters: number
}

export interface Project {
  id: string
  name: string
  createdAt: string
  image: { width: number; height: number; type: string }
  reference: Reference
  showLabels: boolean
  stands: Stand[]
}

export function newId(): string {
  return crypto.randomUUID()
}

export function newStand(partial: Partial<Stand> = {}): Stand {
  return { id: newId(), name: 'Neuer Stand', notes: '', width: 3, depth: 2, placement: null, ...partial }
}
