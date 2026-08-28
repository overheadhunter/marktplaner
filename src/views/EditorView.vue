<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import MapCanvas from '../components/MapCanvas.vue'
import SelectionOverlay from '../components/SelectionOverlay.vue'
import StandList from '../components/StandList.vue'
import { normalizeAngle, pxPerMeter } from '../geometry'
import { newStand, type Placement, type Point } from '../model'
import { useImageUrl } from '../store/images'
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
const selectedStand = computed(() => project.value?.stands.find((s) => s.id === selectedId.value) ?? null)

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

function unplace(id: string) {
  const s = stand(id)
  if (s) s.placement = null
}

function updatePlacement(id: string, placement: Placement) {
  const s = stand(id)
  if (s) s.placement = placement
}

function deleteStand(id: string) {
  const p = project.value
  if (!p) return
  const s = stand(id)
  if (!s || !confirm(`Marktstand „${s.name}“ endgültig löschen?`)) return
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
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="project" class="grid h-screen grid-cols-3 overflow-hidden">
    <div class="relative col-span-2 min-h-0 h-full">
      <header class="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-3 p-3">
        <RouterLink to="/" class="pointer-events-auto rounded bg-white/90 px-3 py-1 text-sm shadow hover:bg-white">← Projekte</RouterLink>
        <h1 class="pointer-events-auto rounded bg-white/90 px-3 py-1 font-semibold shadow">{{ project.name }}</h1>
        <button type="button" class="pointer-events-auto ml-auto rounded bg-white/90 px-3 py-1 text-sm shadow hover:bg-white" @click="map?.fit()">Einpassen</button>
      </header>
      <MapCanvas
        ref="map"
        :image-url="imageUrl"
        :image-size="project.image"
        :stands="project.stands"
        :px-per-meter="ppm"
        :selected-id="selectedId"
        :show-labels="project.showLabels"
        @select="selectedId = $event"
        @update:placement="updatePlacement"
        @drop-stand="placeAt"
      />
      <SelectionOverlay v-if="selectedStand" :stand="selectedStand" @close="selectedId = null" @place="place(selectedStand.id)" @unplace="unplace(selectedStand.id)" />
    </div>
    <StandList :project="project" :selected-id="selectedId" @select="selectedId = $event" @add="addStand" @place="place" @delete="deleteStand" />
  </div>
</template>
