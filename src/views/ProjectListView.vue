<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjects } from '../store/projects'
import { exportProject, importProject } from '../store/transfer'
import { TRANSFER_EXTENSION } from '../store/transferFormat'

const router = useRouter()
const { projects, add, remove } = useProjects()
const fileInput = ref<HTMLInputElement>()
const error = ref('')

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function onDelete(id: string, name: string) {
  if (confirm(`Projekt „${name}“ wirklich löschen?`)) await remove(id)
}

async function onExport(id: string) {
  error.value = ''
  const p = projects.find((p) => p.id === id)
  if (!p) return
  try {
    await exportProject(p)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Export fehlgeschlagen.'
  }
}

async function onImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  try {
    const project = await importProject(file)
    add(project)
    await router.push(`/p/${project.id}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Import fehlgeschlagen.'
  }
}
</script>

<template>
  <main class="mx-auto max-w-2xl p-6">
    <header class="mb-6 flex items-center gap-3">
      <h1 class="text-2xl font-bold">Marktplaner</h1>
      <button type="button" class="ml-auto rounded border border-neutral-300 px-4 py-2 hover:bg-neutral-100" @click="fileInput?.click()">Importieren…</button>
      <input ref="fileInput" type="file" :accept="TRANSFER_EXTENSION + ',application/json'" class="hidden" @change="onImport" />
      <RouterLink to="/new" class="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Neues Projekt</RouterLink>
    </header>

    <p v-if="error" class="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

    <ul v-if="projects.length" class="space-y-2">
      <li v-for="p in projects" :key="p.id" class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <RouterLink :to="`/p/${p.id}`" class="min-w-0 flex-1">
          <div class="truncate font-medium">{{ p.name }}</div>
          <div class="text-sm text-neutral-500">{{ formatDate(p.createdAt) }} · {{ p.stands.length }} Stände · {{ p.stands.filter((s) => s.placement).length }} platziert</div>
        </RouterLink>
        <button type="button" class="rounded px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100" :title="`Als ${TRANSFER_EXTENSION}-Datei speichern`" @click="onExport(p.id)">Exportieren</button>
        <button type="button" class="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50" @click="onDelete(p.id, p.name)">Löschen</button>
      </li>
    </ul>
    <p v-else class="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">Noch keine Projekte. Lege ein neues Projekt an oder importiere eine {{ TRANSFER_EXTENSION }}-Datei.</p>
    <p class="mt-6 text-xs text-neutral-400">Alle Daten werden ausschließlich lokal in diesem Browser gespeichert. Zum Übertragen auf ein anderes Gerät ein Projekt exportieren und dort importieren.</p>
  </main>
</template>
