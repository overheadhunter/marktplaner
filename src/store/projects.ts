import { reactive, watch } from 'vue'
import type { Project } from '../model'
import { deleteImage } from './images'
import { deserialize, serialize } from './serialization'

export const STORAGE_KEY = 'marktplaner.projects.v1'

const projects = reactive<Project[]>(deserialize(localStorage.getItem(STORAGE_KEY)))

let timer: ReturnType<typeof setTimeout> | undefined
const flush = () => {
  clearTimeout(timer)
  timer = undefined
  localStorage.setItem(STORAGE_KEY, serialize(projects))
}
watch(
  projects,
  () => {
    clearTimeout(timer)
    timer = setTimeout(flush, 300)
  },
  { deep: true },
)
window.addEventListener('beforeunload', () => {
  if (timer !== undefined) flush()
})

export function useProjects() {
  return {
    projects,
    byId: (id: string) => projects.find((p) => p.id === id),
    add(project: Project) {
      projects.push(project)
    },
    async remove(id: string) {
      const i = projects.findIndex((p) => p.id === id)
      if (i >= 0) projects.splice(i, 1)
      await deleteImage(id)
    },
  }
}
