<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import MapCanvas from '../components/MapCanvas.vue'
import MapLegend from '../components/MapLegend.vue'
import SelectionOverlay from '../components/SelectionOverlay.vue'
import { standNumbers } from '../numbering'
import type { ViewBox } from '../composables/useViewport'
import StandList from '../components/StandList.vue'
import { normalizeAngle, pxPerMeter } from '../geometry'
import { newStand, type Placement, type Point, type VehicleSide } from '../model'
import { useImageUrl } from '../store/images'
import { exportProject } from '../store/transfer'
import { useProjects } from '../store/projects'

const props = defineProps<{ id: string }>()
const router = useRouter()
const { byId } = useProjects()

const project = computed(() => byId(props.id))
if (!project.value) router.replace('/')

const imageUrl = useImageUrl(toRef(props, 'id'))
const ppm = computed(() => (project.value ? pxPerMeter(project.value.reference) : 1))

const map = ref<InstanceType<typeof MapCanvas>>()
const selectedId = ref<string | null>(null)
const hoveredId = ref<string | null>(null)
const selectedStand = computed(() => project.value?.stands.find((s) => s.id === selectedId.value) ?? null)

const placedStands = computed(() => project.value?.stands.filter((s) => s.placement) ?? [])

// stands whose center lies within the given viewBox (legend only lists what is currently visible / printed)
function visibleStands(vb: ViewBox) {
  return placedStands.value.filter((s) => {
    const p = s.placement!
    return p.x >= vb.x && p.x <= vb.x + vb.w && p.y >= vb.y && p.y <= vb.y + vb.h
  })
}
const numbers = computed(() => standNumbers(project.value?.stands ?? []))
// what the map prints inside each stand, depending on the label mode
const labels = computed(() => {
  const p = project.value
  if (!p) return new Map<string, string>()
  return p.labelMode === 'numbers' ? numbers.value : new Map(p.stands.map((s) => [s.id, s.name]))
})

function stand(id: string) {
  return project.value?.stands.find((s) => s.id === id)
}

function addStand() {
  const s = newStand()
  project.value?.stands.push(s)
  selectedId.value = s.id
}

function placeAt(id: string, at: Point) {
  const s = stand(id)
  if (!s) return
  s.placement = { x: at.x, y: at.y, angle: s.placement?.angle ?? 0 }
  selectedId.value = id
}

function place(id: string) {
  placeAt(id, map.value?.center() ?? { x: 0, y: 0 })
}

// drag from the list: name chip follows the cursor outside the map, a true-to-scale ghost inside it
const drag = ref<{ id: string; x: number; y: number; overMap: boolean } | null>(null)
const dragStand = computed(() => (drag.value ? stand(drag.value.id) : undefined))
const ghost = computed(() => (drag.value?.overMap && dragStand.value ? { stand: dragStand.value, clientX: drag.value.x, clientY: drag.value.y } : null))

function onDrag(id: string, at: { x: number; y: number }) {
  drag.value = { id, x: at.x, y: at.y, overMap: map.value?.containsClient(at.x, at.y) ?? false }
}

function onDragEnd(id: string, at: { x: number; y: number } | null) {
  if (at && map.value?.containsClient(at.x, at.y)) placeAt(id, map.value.clientToImage(at.x, at.y))
  drag.value = null
}

async function onExport() {
  if (!project.value) return
  try {
    await exportProject(project.value)
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Export fehlgeschlagen.')
  }
}

function updateVehicleSide(id: string, side: VehicleSide) {
  const s = stand(id)
  if (s?.vehicle) s.vehicle.side = side
}

function unplace(id: string) {
  const s = stand(id)
  if (s) s.placement = null
}

function updatePlacement(id: string, placement: Placement) {
  const s = stand(id)
  if (s) s.placement = placement
}

// first "x" only takes a placed stand off the map; a second one on the now unplaced stand deletes it after confirmation
function deleteStand(id: string) {
  const p = project.value
  if (!p) return
  const s = stand(id)
  if (!s) return
  if (s.placement) {
    s.placement = null
    return
  }
  if (!confirm(`Marktstand „${s.name}“ endgültig löschen?`)) return
  p.stands.splice(p.stands.indexOf(s), 1)
  if (selectedId.value === id) selectedId.value = null
}

function rotateSelected(delta: number) {
  const s = selectedStand.value
  if (s?.placement) s.placement = { ...s.placement, angle: normalizeAngle(s.placement.angle + delta) }
}

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  if (e.key === 'Escape') selectedId.value = null
  else if (selectedId.value && (e.key === 'Delete' || e.key === 'Backspace')) unplace(selectedId.value)
  else if (e.key === '[') rotateSelected(-5)
  else if (e.key === ']') rotateSelected(5)
  else return
  e.preventDefault()
}
// print layout: the currently visible map area, no selection/handles, page orientation matching that area
const printing = ref(false)
let pageStyle: HTMLStyleElement | undefined
function onBeforePrint() {
  printing.value = true
  // print the currently visible area; orient the page like that area
  const vb = map.value?.viewBox
  if (vb && !pageStyle) {
    pageStyle = document.createElement('style')
    pageStyle.textContent = `@page { size: ${vb.w >= vb.h ? 'landscape' : 'portrait'}; margin: 1cm; }`
    document.head.appendChild(pageStyle)
  }
}
function print() {
  window.print()
}
function onAfterPrint() {
  printing.value = false
  pageStyle?.remove()
  pageStyle = undefined
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('beforeprint', onBeforePrint)
  window.addEventListener('afterprint', onAfterPrint)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('beforeprint', onBeforePrint)
  window.removeEventListener('afterprint', onAfterPrint)
  onAfterPrint()
})
</script>

<template>
  <!-- map column: DIN A4 landscape (√2 : 1) at full height when the window is wide enough, otherwise whatever is left next to the sidebar's minimum width -->
  <div v-if="project" class="grid h-screen grid-cols-[minmax(20rem,calc(100vh*1.41421))_minmax(22rem,1fr)] overflow-hidden print:block print:h-auto print:overflow-visible">
    <div class="relative min-h-0 h-full print:flex print:h-[calc(100vh-2cm)] print:flex-col">
      <h1 class="mb-3 hidden text-center text-2xl font-bold print:block">{{ project.name }}</h1>
      <header class="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-3 p-3 print:hidden">
        <RouterLink to="/" class="pointer-events-auto rounded bg-white/90 px-3 py-1 text-sm shadow hover:bg-white">← Projekte</RouterLink>
        <h1 class="pointer-events-auto rounded bg-white/90 px-3 py-1 font-semibold shadow">{{ project.name }}</h1>
        <div class="pointer-events-auto ml-auto flex overflow-hidden rounded bg-white/90 text-sm shadow">
          <button type="button" class="px-3 py-1" :class="project.labelMode === 'names' ? 'bg-sky-600 text-white' : 'hover:bg-white'" @click="project.labelMode = 'names'">Namen</button>
          <button type="button" class="px-3 py-1" :class="project.labelMode === 'numbers' ? 'bg-sky-600 text-white' : 'hover:bg-white'" @click="project.labelMode = 'numbers'">Nummern</button>
        </div>
        <button type="button" class="pointer-events-auto rounded bg-white/90 px-3 py-1 text-sm shadow hover:bg-white" @click="map?.fit()">Einpassen</button>
        <button type="button" class="pointer-events-auto rounded bg-white/90 px-3 py-1 text-sm shadow hover:bg-white" @click="onExport">Exportieren</button>
        <button type="button" class="pointer-events-auto rounded bg-white/90 px-3 py-1 text-sm shadow hover:bg-white" @click="print()">Drucken</button>
      </header>
      <MapCanvas
        ref="map"
        :image-url="imageUrl"
        :image-size="project.image"
        :stands="project.stands"
        :px-per-meter="ppm"
        :selected-id="printing ? null : selectedId"
        :hovered-id="printing ? null : hoveredId"
        :labels="labels"
        class="print:min-h-0 print:flex-1"
        @select="selectedId = $event"
        @hover="hoveredId = $event"
        @update:placement="updatePlacement"
        @update:vehicle-side="updateVehicleSide"
        :ghost="ghost"
      >
        <template #overlay="{ scale, toImage, viewBox }">
          <MapLegend
            v-if="project.labelMode === 'numbers'"
            :stands="visibleStands(viewBox)"
            :numbers="numbers"
            :position="project.legend ?? { x: project.image.width, y: project.image.height }"
            :scale="scale"
            :to-image="toImage"
            @update:position="project.legend = $event"
          />
        </template>
      </MapCanvas>
      <div
        v-if="drag && !drag.overMap && dragStand"
        class="pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-1/2 rounded bg-white px-2 py-1 text-sm font-medium shadow-lg ring-1 ring-neutral-300"
        :style="{ left: `${drag.x}px`, top: `${drag.y}px` }"
      >
        {{ dragStand.name || 'Unbenannt' }}
      </div>
      <SelectionOverlay v-if="selectedStand" :stand="selectedStand" class="print:hidden" @close="selectedId = null" @place="place(selectedStand.id)" @unplace="unplace(selectedStand.id)" />
    </div>
    <StandList
      class="print:hidden"
      :project="project"
      :selected-id="selectedId"
      :hovered-id="hoveredId"
      :numbers="project.labelMode === 'numbers' ? numbers : null"
      @select="selectedId = $event"
      @hover="hoveredId = $event"
      @drag="onDrag"
      @dragend="onDragEnd"
      @add="addStand"
      @place="place"
      @delete="deleteStand"
    />
  </div>
</template>
