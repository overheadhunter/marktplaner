import type { Project } from '../model'

export function serialize(projects: Project[]): string {
  return JSON.stringify(projects)
}

export function deserialize(json: string | null): Project[] {
  if (!json) return []
  try {
    const parsed: unknown = JSON.parse(json)
    return Array.isArray(parsed) ? (parsed as Project[]) : []
  } catch {
    return []
  }
}
