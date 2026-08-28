<script setup lang="ts">
import { useProjects } from '../store/projects'

const { projects, remove } = useProjects()

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function onDelete(id: string, name: string) {
  if (confirm(`Projekt „${name}“ wirklich löschen?`)) await remove(id)
}
</script>

<template>
  <main class="mx-auto max-w-2xl p-6">
    <header class="mb-6 flex items-center gap-4">
      <h1 class="text-2xl font-bold">Marktplaner</h1>
      <RouterLink to="/new" class="ml-auto rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Neues Projekt</RouterLink>
    </header>

    <ul v-if="projects.length" class="space-y-2">
      <li v-for="p in projects" :key="p.id" class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <RouterLink :to="`/p/${p.id}`" class="min-w-0 flex-1">
          <div class="truncate font-medium">{{ p.name }}</div>
          <div class="text-sm text-neutral-500">{{ formatDate(p.createdAt) }} · {{ p.stands.length }} Stände · {{ p.stands.filter((s) => s.placement).length }} platziert</div>
        </RouterLink>
        <button type="button" class="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50" @click="onDelete(p.id, p.name)">Löschen</button>
      </li>
    </ul>
    <p v-else class="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">Noch keine Projekte. Lege ein neues Projekt an, um zu starten.</p>
    <p class="mt-6 text-xs text-neutral-400">Alle Daten werden ausschließlich lokal in diesem Browser gespeichert.</p>
  </main>
</template>
