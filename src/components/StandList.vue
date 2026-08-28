<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faChevronDown, faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons'
import type { Project } from '../model'
import StandListItem from './StandListItem.vue'

const props = defineProps<{
  project: Project
  selectedId: string | null
  hoveredId: string | null
  /** effective stand numbers to show in the color indicators, or null in names mode */
  numbers: Map<string, string> | null
}>()
const emit = defineEmits<{
  select: [id: string | null]
  hover: [id: string | null]
  drag: [id: string, at: { x: number; y: number }]
  dragend: [id: string, at: { x: number; y: number } | null]
  add: []
  place: [id: string]
  delete: [id: string]
}>()

const query = ref('')
const searchNames = ref(true)
const searchNotes = ref(false)
const optionsOpen = ref(false)
const options = ref<HTMLElement>()
const searchInput = ref<HTMLInputElement>()

const filteredStands = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.project.stands
  return props.project.stands.filter((s) => (searchNames.value && s.name.toLowerCase().includes(q)) || (searchNotes.value && s.notes.toLowerCase().includes(q)))
})

// close the options dropdown when clicking anywhere else
function onDocumentPointerDown(e: PointerEvent) {
  if (optionsOpen.value && !options.value?.contains(e.target as Node)) optionsOpen.value = false
}
// ⌘F / Ctrl+F focuses the list search; pressing it again while already focused falls through to the browser's find bar
function onKeyDown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'f') {
    if (document.activeElement === searchInput.value) return
    e.preventDefault()
    searchInput.value?.focus()
    searchInput.value?.select()
  }
}
onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  window.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <aside class="flex h-full min-h-0 flex-col border-l border-neutral-200 bg-neutral-50">
    <div class="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
      <h2 class="text-lg font-semibold">Marktstände</h2>
      <span class="text-sm text-neutral-500">{{ project.stands.length }}</span>
      <button type="button" class="ml-auto rounded bg-sky-600 px-3 py-1 text-sm text-white hover:bg-sky-700" @click="emit('add')">+ Hinzufügen</button>
    </div>

    <div class="flex px-4 pt-3">
      <div class="relative flex-1">
        <FontAwesomeIcon :icon="faMagnifyingGlass" class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          placeholder="Suchen… (⌘F)"
          class="w-full rounded-l border border-neutral-300 bg-white py-1 pr-7 pl-8 text-sm focus:border-sky-500 focus:outline-none"
        />
        <button v-if="query" type="button" class="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-700" title="Suche löschen" @click="query = ''">
          <FontAwesomeIcon :icon="faXmark" class="size-3" />
        </button>
      </div>
      <div ref="options" class="relative">
        <button
          type="button"
          class="flex h-full items-center gap-1 rounded-r border border-l-0 border-neutral-300 bg-neutral-100 px-2 text-xs text-neutral-600 hover:bg-neutral-200"
          :class="optionsOpen && 'bg-neutral-200'"
          title="Suchbereich"
          @click="optionsOpen = !optionsOpen"
        >
          {{ searchNames && searchNotes ? 'Name + Notizen' : searchNotes ? 'Notizen' : 'Name' }}
          <FontAwesomeIcon :icon="faChevronDown" class="size-2.5" />
        </button>
        <div v-if="optionsOpen" class="absolute right-0 z-10 mt-1 w-40 rounded border border-neutral-200 bg-white p-2 text-sm shadow-lg">
          <label class="flex items-center gap-2 py-0.5"><input v-model="searchNames" type="checkbox" class="accent-sky-600" /> In Namen suchen</label>
          <label class="flex items-center gap-2 py-0.5"><input v-model="searchNotes" type="checkbox" class="accent-sky-600" /> In Notizen suchen</label>
        </div>
      </div>
    </div>

    <p class="px-4 py-2 text-xs text-neutral-500">Stände auf die Karte ziehen oder „Platzieren“ klicken. Auf der Karte: ziehen zum Verschieben, Griff zum Drehen (⇧ rastet in 15°-Schritten).</p>
    <ul class="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-4">
      <StandListItem
        v-for="s in filteredStands"
        :key="s.id"
        :stand="s"
        :selected="s.id === selectedId"
        :hovered="s.id === hoveredId"
        :number="numbers?.get(s.id)"
        @select="emit('select', s.id)"
        @hover="emit('hover', $event ? s.id : null)"
        @drag="emit('drag', s.id, $event)"
        @dragend="emit('dragend', s.id, $event)"
        @place="emit('place', s.id)"
        @delete="emit('delete', s.id)"
      />
      <li v-if="project.stands.length === 0" class="py-8 text-center text-sm text-neutral-400">Noch keine Marktstände.</li>
      <li v-else-if="filteredStands.length === 0" class="py-8 text-center text-sm text-neutral-400">Keine Treffer für „{{ query.trim() }}“.</li>
    </ul>
  </aside>
</template>
