import type { Project } from '../model'

export function serialize(projects: Project[]): string {
  return JSON.stringify(projects)
}

export function deserialize(json: string | null): Project[] {
  if (!json) return []
  try {
    const parsed: unknown = JSON.parse(json)
    return Array.isArray(parsed) ? (parsed as Project[]).map(normalizeProject) : []
  } catch {
    return []
  }
}

/** Fills in fields added after a project was stored, so older data (own storage or imported files) matches the current model. */
export function normalizeProject(raw: Project): Project {
  // `showLabels` predates `labelMode`
  const { showLabels: _showLabels, ...p } = raw as Project & { showLabels?: boolean }
  // legend positions were briefly stored as fractions (0..1) instead of image px; fall back to the default corner for those
  const legend = p.legend && (p.legend.x > 1 || p.legend.y > 1) ? p.legend : undefined
  return { ...p, labelMode: p.labelMode ?? 'names', legend }
}
