import type { Project } from '../model'

export const TRANSFER_FORMAT = 'marktplaner'
export const TRANSFER_VERSION = 1
export const TRANSFER_EXTENSION = '.marktplan'

/** On-disk representation of a `.marktplan` file: the project plus its map image as base64. */
export interface TransferFile {
  format: typeof TRANSFER_FORMAT
  version: typeof TRANSFER_VERSION
  project: Project
  image: { type: string; base64: string }
}

export function encodeTransfer(project: Project, imageType: string, imageBase64: string): string {
  const file: TransferFile = { format: TRANSFER_FORMAT, version: TRANSFER_VERSION, project, image: { type: imageType, base64: imageBase64 } }
  return JSON.stringify(file)
}

/**
 * Parses and validates a `.marktplan` file.
 *
 * @param json file content
 * @return the decoded file
 * @throws Error with a user-facing German message if the content is not a valid transfer file
 */
export function parseTransfer(json: string): TransferFile {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('Die Datei enthält kein gültiges JSON.')
  }
  if (!isRecord(data) || data.format !== TRANSFER_FORMAT) throw new Error('Die Datei ist keine Marktplaner-Datei.')
  if (data.version !== TRANSFER_VERSION) throw new Error(`Nicht unterstützte Dateiversion ${String(data.version)}.`)
  const { project, image } = data
  if (!isRecord(project) || typeof project.name !== 'string' || !isRecord(project.image) || !isRecord(project.reference) || !Array.isArray(project.stands)) {
    throw new Error('Die Projektdaten in der Datei sind unvollständig.')
  }
  if (!isRecord(image) || typeof image.type !== 'string' || typeof image.base64 !== 'string') throw new Error('Die Datei enthält kein Kartenbild.')
  return data as unknown as TransferFile
}

/** File name for exporting the given project, e.g. `Weihnachtsmarkt.marktplan`. */
export function transferFileName(projectName: string): string {
  const base = projectName.trim().replace(/[\\/:*?"<>|]+/g, '_') || 'projekt'
  return base + TRANSFER_EXTENSION
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}
