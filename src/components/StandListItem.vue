<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Stand } from '../model'

const props = defineProps<{ stand: Stand; selected: boolean }>()
const emit = defineEmits<{
  select: []
  place: []
  unplace: []
  delete: []
}>()

const root = ref<HTMLElement>()
watch(
  () => props.selected,
  (sel) => {
    if (sel) root.value?.scrollIntoView({ block: 'nearest' })
  },
)

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData('application/x-marktplaner-stand', props.stand.id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
  emit('select')
}

function num(e: Event): number {
  const v = Number.parseFloat((e.target as HTMLInputElement).value)
  return Number.isFinite(v) && v > 0 ? v : 0.01
}
</script>

<template>
  <li
    ref="root"
    draggable="true"
    class="rounded-lg border p-3 shadow-sm transition-colors"
    :class="selected ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200' : 'border-neutral-200 bg-white hover:border-neutral-300'"
    @click="emit('select')"
    @dragstart="onDragStart"
  >
    <div class="flex items-center gap-2">
      <input
        v-model.trim="stand.name"
        type="text"
        placeholder="Name"
        class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 font-medium hover:border-neutral-300 focus:border-sky-500 focus:outline-none"
      />
      <span
        class="shrink-0 rounded-full px-2 py-0.5 text-xs"
        :class="stand.placement ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-500'"
      >
        {{ stand.placement ? 'platziert' : 'nicht platziert' }}
      </span>
    </div>

    <textarea
      v-model="stand.notes"
      rows="2"
      placeholder="Notizen"
      class="mt-2 w-full resize-y rounded border border-neutral-200 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
    />

    <div class="mt-2 flex items-center gap-2 text-sm">
      <label class="flex items-center gap-1">
        <span class="text-neutral-500">Breite</span>
        <input :value="stand.width" type="number" min="0.01" step="0.01" class="w-20 rounded border border-neutral-200 px-1 py-0.5 text-right" @change="stand.width = num($event)" />
        <span class="text-neutral-500">m</span>
      </label>
      <span class="text-neutral-400">×</span>
      <label class="flex items-center gap-1">
        <span class="text-neutral-500">Tiefe</span>
        <input :value="stand.depth" type="number" min="0.01" step="0.01" class="w-20 rounded border border-neutral-200 px-1 py-0.5 text-right" @change="stand.depth = num($event)" />
        <span class="text-neutral-500">m</span>
      </label>
    </div>

    <div class="mt-3 flex flex-wrap gap-2 text-sm">
      <button v-if="!stand.placement" type="button" class="rounded bg-sky-600 px-2 py-1 text-white hover:bg-sky-700" @click.stop="emit('place')">Platzieren</button>
      <button v-else type="button" class="rounded bg-neutral-200 px-2 py-1 hover:bg-neutral-300" @click.stop="emit('unplace')">Von Karte entfernen</button>
      <button type="button" class="ml-auto rounded px-2 py-1 text-red-600 hover:bg-red-50" @click.stop="emit('delete')">Löschen</button>
    </div>
  </li>
</template>
