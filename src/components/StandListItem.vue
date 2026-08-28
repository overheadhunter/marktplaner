<script setup lang="ts">
import { ref, watch } from 'vue'
import { newVehicle, type Stand } from '../model'
import { COLOR_LABELS, DEFAULT_COLOR, STAND_COLORS, standClasses } from '../colors'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { UTILITIES, activeUtilities } from '../utilities'
import type { Utilities } from '../model'

const props = defineProps<{
  stand: Stand
  selected: boolean
  hovered: boolean
  /** effective number shown in the color indicator (numbers mode only) */
  number?: string
}>()
const emit = defineEmits<{
  select: []
  hover: [hovering: boolean]
  /** pointer position (client coords) while dragging the item */
  drag: [at: { x: number; y: number }]
  /** drop position, or null if the drag was cancelled */
  dragend: [at: { x: number; y: number } | null]
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

// pointer-based drag (instead of HTML5 DnD) so the map can render a true-to-scale ghost while dragging
function onPointerDown(e: PointerEvent) {
  if (e.button !== 0 || (e.target as HTMLElement).closest('input, textarea, button')) return
  const el = e.currentTarget as HTMLElement
  const start = { x: e.clientX, y: e.clientY }
  let dragging = false
  const onMove = (ev: PointerEvent) => {
    if (!dragging) {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 5) return
      dragging = true
      emit('select')
    }
    emit('drag', { x: ev.clientX, y: ev.clientY })
  }
  const onUp = (ev: PointerEvent) => {
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
    if (dragging) emit('dragend', ev.type === 'pointerup' ? { x: ev.clientX, y: ev.clientY } : null)
  }
  el.setPointerCapture(e.pointerId)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
}

function num(e: Event): number {
  const v = Number.parseFloat((e.target as HTMLInputElement).value)
  return Number.isFinite(v) && v > 0 ? v : 0.01
}

function toggleVehicle(e: Event) {
  const enabled = (e.target as HTMLInputElement).checked
  if (props.stand.vehicle) props.stand.vehicle.enabled = enabled
  else props.stand.vehicle = { ...newVehicle(), enabled }
}

function setUtility(key: keyof Utilities, e: Event) {
  props.stand.utilities ??= {}
  props.stand.utilities[key] = (e.target as HTMLInputElement).checked
}

function setVehicle(key: 'width' | 'depth', e: Event) {
  props.stand.vehicle ??= { ...newVehicle(), enabled: false }
  props.stand.vehicle[key] = num(e)
}
</script>

<template>
  <li
    ref="root"
    class="cursor-grab touch-pan-y rounded-md border px-2 py-1 transition-colors select-none"
    :class="selected ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200' : hovered ? 'border-neutral-400 bg-neutral-100' : 'border-neutral-200 bg-white'"
    @click="emit('select')"
    @pointerdown="onPointerDown"
    @mouseenter="emit('hover', true)"
    @mouseleave="emit('hover', false)"
  >
    <div class="flex items-center gap-2">
      <span
        v-if="number !== undefined"
        class="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
        :class="standClasses(stand.color ?? DEFAULT_COLOR, false).swatch"
        :title="`Standnummer ${number}`"
      >
        {{ number }}
      </span>
      <span v-else class="size-3 shrink-0 rounded-full" :class="standClasses(stand.color ?? DEFAULT_COLOR, false).swatch" />
      <input
        v-model.trim="stand.name"
        type="text"
        placeholder="Name"
        class="min-w-16 max-w-full shrink rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium field-sizing-content hover:border-neutral-300 focus:border-sky-500 focus:outline-none"
      />
      <span v-if="!stand.placement" class="shrink-0 rounded-full bg-amber-100 px-1.5 py-px text-[10px] leading-4 text-amber-800">unplatziert</span>
      <span v-if="activeUtilities(stand).length" class="flex shrink-0 items-center gap-1">
        <FontAwesomeIcon v-for="u in activeUtilities(stand)" :key="u.key" :icon="u.icon" :title="u.label" class="size-3" :class="u.cls" />
      </span>
      <button
        v-if="selected"
        type="button"
        class="ml-auto shrink-0 rounded px-1 text-sm leading-none text-neutral-400 hover:bg-red-50 hover:text-red-600"
        :title="stand.placement ? 'Von Karte entfernen' : 'Marktstand löschen'"
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

      <label class="mt-2 flex items-center gap-1 text-sm">
        <span class="mr-1 text-neutral-500">Standnummer:</span>
        <input
          v-model.trim="stand.number"
          type="text"
          :placeholder="number !== undefined ? `automatisch (${number})` : 'automatisch'"
          class="w-36 rounded border border-neutral-200 bg-white px-1 py-0.5"
        />
      </label>

      <div class="mt-2 flex items-center gap-1.5 text-sm">
        <span class="mr-1 text-neutral-500">Farbe:</span>
        <button
          v-for="c in STAND_COLORS"
          :key="c"
          type="button"
          :title="COLOR_LABELS[c]"
          class="size-5 rounded-full border-2 transition-transform hover:scale-110"
          :class="[standClasses(c, false).swatch, (stand.color ?? DEFAULT_COLOR) === c ? 'border-neutral-800 ring-2 ring-white ring-inset' : 'border-transparent']"
          @click.stop="stand.color = c"
        />
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div class="flex items-center gap-1">
          <span class="mr-1 text-neutral-500">Standgröße:</span>
          <input :value="stand.width" type="number" min="0.01" step="0.01" title="Breite" class="w-20 rounded border border-neutral-200 bg-white px-1 py-0.5 text-right" @change="stand.width = num($event)" />
          <span class="text-neutral-400">×</span>
          <input :value="stand.depth" type="number" min="0.01" step="0.01" title="Tiefe" class="w-20 rounded border border-neutral-200 bg-white px-1 py-0.5 text-right" @change="stand.depth = num($event)" />
          <span class="text-neutral-500">m</span>
        </div>
        <div class="flex items-center gap-1">
          <label class="mr-1 flex items-center gap-1 text-neutral-500">
            <input type="checkbox" :checked="stand.vehicle?.enabled ?? false" class="accent-sky-600" @change="toggleVehicle" />
            Auto:
          </label>
          <input :value="stand.vehicle?.width ?? 5" :disabled="!stand.vehicle?.enabled" type="number" min="0.01" step="0.01" title="Breite" class="w-20 rounded border border-neutral-200 bg-white px-1 py-0.5 text-right disabled:bg-neutral-100 disabled:text-neutral-400" @change="setVehicle('width', $event)" />
          <span class="text-neutral-400">×</span>
          <input :value="stand.vehicle?.depth ?? 2" :disabled="!stand.vehicle?.enabled" type="number" min="0.01" step="0.01" title="Tiefe" class="w-20 rounded border border-neutral-200 bg-white px-1 py-0.5 text-right disabled:bg-neutral-100 disabled:text-neutral-400" @change="setVehicle('depth', $event)" />
          <span class="text-neutral-500">m</span>
        </div>
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <label v-for="u in UTILITIES" :key="u.key" class="flex items-center gap-1.5 text-neutral-700">
          <input type="checkbox" :checked="stand.utilities?.[u.key] ?? false" class="accent-sky-600" @change="setUtility(u.key, $event)" />
          <FontAwesomeIcon :icon="u.icon" class="size-3.5" :class="u.cls" />
          {{ u.label }}
        </label>
      </div>
      <div v-if="!stand.placement" class="mt-2 flex text-sm">
        <button type="button" class="rounded bg-sky-600 px-3 py-1 text-white hover:bg-sky-700" @click.stop="emit('place')">Platzieren</button>
      </div>
    </template>
  </li>
</template>
