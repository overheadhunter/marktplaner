<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Stand } from '../model'

const props = defineProps<{ stand: Stand; selected: boolean }>()
const emit = defineEmits<{
  select: []
  place: []
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
    class="rounded-md border px-2 py-1 transition-colors"
    :class="selected ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200' : 'border-neutral-200 bg-white hover:border-neutral-300'"
    @click="emit('select')"
    @dragstart="onDragStart"
  >
    <div class="flex items-center gap-2">
      <input
        v-model.trim="stand.name"
        type="text"
        placeholder="Name"
        class="min-w-16 max-w-full shrink rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium field-sizing-content hover:border-neutral-300 focus:border-sky-500 focus:outline-none"
      />
      <span
        class="shrink-0 rounded-full px-1.5 py-px text-[10px] leading-4"
        :class="stand.placement ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-500'"
      >
        {{ stand.placement ? 'platziert' : 'nicht platziert' }}
      </span>
      <button
        v-if="selected"
        type="button"
        class="ml-auto shrink-0 rounded px-1 text-sm leading-none text-neutral-400 hover:bg-red-50 hover:text-red-600"
        title="Marktstand löschen"
        @click.stop="emit('delete')"
      >
        ✕
      </button>
    </div>

    <template v-if="selected">
      <textarea
        v-model="stand.notes"
        rows="2"
        placeholder="Notizen"
        class="mt-2 w-full resize-y rounded border border-neutral-200 bg-white px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
      />

      <div class="mt-2 flex items-center gap-1 text-sm">
        <span class="mr-1 text-neutral-500">Standgröße:</span>
        <input :value="stand.width" type="number" min="0.01" step="0.01" title="Breite" class="w-20 rounded border border-neutral-200 bg-white px-1 py-0.5 text-right" @change="stand.width = num($event)" />
        <span class="text-neutral-400">×</span>
        <input :value="stand.depth" type="number" min="0.01" step="0.01" title="Tiefe" class="w-20 rounded border border-neutral-200 bg-white px-1 py-0.5 text-right" @change="stand.depth = num($event)" />
        <span class="text-neutral-500">m</span>
      </div>
      <div v-if="!stand.placement" class="mt-2 flex text-sm">
        <button type="button" class="rounded bg-sky-600 px-3 py-1 text-white hover:bg-sky-700" @click.stop="emit('place')">Platzieren</button>
      </div>
    </template>
  </li>
</template>
