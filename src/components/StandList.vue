<script setup lang="ts">
import type { Project } from '../model'
import StandListItem from './StandListItem.vue'

defineProps<{ project: Project; selectedId: string | null; hoveredId: string | null }>()
const emit = defineEmits<{
  select: [id: string | null]
  hover: [id: string | null]
  drag: [id: string, at: { x: number; y: number }]
  dragend: [id: string, at: { x: number; y: number } | null]
  add: []
  place: [id: string]
  delete: [id: string]
}>()
</script>

<template>
  <aside class="flex h-full min-h-0 flex-col border-l border-neutral-200 bg-neutral-50">
    <div class="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
      <h2 class="text-lg font-semibold">Marktstände</h2>
      <span class="text-sm text-neutral-500">{{ project.stands.length }}</span>
      <button type="button" class="ml-auto rounded bg-sky-600 px-3 py-1 text-sm text-white hover:bg-sky-700" @click="emit('add')">+ Hinzufügen</button>
    </div>
    <p class="px-4 py-2 text-xs text-neutral-500">Stände auf die Karte ziehen oder „Platzieren“ klicken. Auf der Karte: ziehen zum Verschieben, Griff zum Drehen (⇧ rastet in 15°-Schritten).</p>
    <ul class="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-4">
      <StandListItem
        v-for="s in project.stands"
        :key="s.id"
        :stand="s"
        :selected="s.id === selectedId"
        :hovered="s.id === hoveredId"
        @select="emit('select', s.id)"
        @hover="emit('hover', $event ? s.id : null)"
        @drag="emit('drag', s.id, $event)"
        @dragend="emit('dragend', s.id, $event)"
        @place="emit('place', s.id)"
        @delete="emit('delete', s.id)"
      />
      <li v-if="project.stands.length === 0" class="py-8 text-center text-sm text-neutral-400">Noch keine Marktstände.</li>
    </ul>
  </aside>
</template>
