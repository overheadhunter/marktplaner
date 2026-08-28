<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useViewport } from '../composables/useViewport'
import type { Placement, Point, Stand } from '../model'
import StandShape from './StandShape.vue'

export interface Calibration {
  a?: Point
  b?: Point
}

const props = withDefaults(
  defineProps<{
    imageUrl?: string
    imageSize: { width: number; height: number }
    mode?: 'edit' | 'calibrate'
    stands?: Stand[]
    pxPerMeter?: number
    selectedId?: string | null
    showLabels?: boolean
    calibration?: Calibration
  }>(),
  { mode: 'edit', stands: () => [], pxPerMeter: 1, selectedId: null, showLabels: true, calibration: () => ({}) },
)

const emit = defineEmits<{
  select: [id: string | null]
  'update:placement': [id: string, placement: Placement]
  'drop-stand': [id: string, at: Point]
  'update:calibration': [calibration: Calibration]
}>()

const svg = ref<SVGSVGElement>()
const viewport = useViewport(svg)

const placedStands = computed(() => props.stands.filter((s): s is Stand & { placement: Placement } => s.placement !== null))

const markerRadius = computed(() => 7 / viewport.scale.value)

let observer: ResizeObserver | undefined
onMounted(() => {
  viewport.fit(props.imageSize.width, props.imageSize.height)
  observer = new ResizeObserver(() => viewport.refreshClientSize())
  if (svg.value) observer.observe(svg.value)
})
onBeforeUnmount(() => observer?.disconnect())
watch(() => [props.imageSize.width, props.imageSize.height], ([w, h]) => viewport.fit(w!, h!))

function onWheel(e: WheelEvent) {
  viewport.zoomAt(e.clientX, e.clientY, Math.exp(e.deltaY * 0.0015))
}

// background: pan on drag, click on tap
function onBackgroundPointerDown(e: PointerEvent) {
  if (e.button !== 0 || !svg.value) return
  const el = svg.value
  const startClient = { x: e.clientX, y: e.clientY }
  let last = viewport.clientToImage(e.clientX, e.clientY)
  let moved = false
  const onMove = (ev: PointerEvent) => {
    if (!moved && Math.hypot(ev.clientX - startClient.x, ev.clientY - startClient.y) < 3) return
    moved = true
    const p = viewport.clientToImage(ev.clientX, ev.clientY)
    viewport.panBy(p.x - last.x, p.y - last.y)
    last = viewport.clientToImage(ev.clientX, ev.clientY)
  }
  const onUp = (ev: PointerEvent) => {
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
    if (!moved && ev.type === 'pointerup') onBackgroundClick(viewport.clientToImage(ev.clientX, ev.clientY))
  }
  el.setPointerCapture(e.pointerId)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
}

function onBackgroundClick(p: Point) {
  if (props.mode === 'calibrate') {
    if (!props.calibration.a) emit('update:calibration', { ...props.calibration, a: p })
    else if (!props.calibration.b) emit('update:calibration', { ...props.calibration, b: p })
  } else {
    emit('select', null)
  }
}

function onMarkerPointerDown(e: PointerEvent, which: 'a' | 'b') {
  if (e.button !== 0) return
  e.stopPropagation()
  const el = e.currentTarget as Element
  const onMove = (ev: PointerEvent) => emit('update:calibration', { ...props.calibration, [which]: viewport.clientToImage(ev.clientX, ev.clientY) })
  const onUp = () => {
    el.removeEventListener('pointermove', onMove as EventListener)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
  }
  el.setPointerCapture(e.pointerId)
  el.addEventListener('pointermove', onMove as EventListener)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
}

function onDrop(e: DragEvent) {
  const id = e.dataTransfer?.getData('application/x-marktplaner-stand')
  if (!id) return
  emit('drop-stand', id, viewport.clientToImage(e.clientX, e.clientY))
}

defineExpose({ center: viewport.center, fit: () => viewport.fit(props.imageSize.width, props.imageSize.height) })
</script>

<template>
  <svg
    ref="svg"
    class="h-full w-full touch-none bg-neutral-200"
    :viewBox="viewport.viewBoxString.value"
    @wheel.prevent="onWheel"
    @pointerdown="onBackgroundPointerDown"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <image v-if="imageUrl" :href="imageUrl" :width="imageSize.width" :height="imageSize.height" x="0" y="0" />
    <rect v-else :width="imageSize.width" :height="imageSize.height" class="fill-neutral-300" />

    <template v-if="mode === 'edit'">
      <StandShape
        v-for="s in placedStands"
        :key="s.id"
        :stand="s"
        :px-per-meter="pxPerMeter"
        :scale="viewport.scale.value"
        :selected="s.id === selectedId"
        :show-label="showLabels"
        :to-image="viewport.clientToImage"
        @select="emit('select', $event)"
        @update:placement="(id, p) => emit('update:placement', id, p)"
      />
    </template>

    <template v-else>
      <line
        v-if="calibration.a && calibration.b"
        :x1="calibration.a.x"
        :y1="calibration.a.y"
        :x2="calibration.b.x"
        :y2="calibration.b.y"
        class="stroke-red-600"
        stroke-width="3"
        vector-effect="non-scaling-stroke"
      />
      <circle
        v-for="which in (['a', 'b'] as const)"
        v-show="calibration[which]"
        :key="which"
        :cx="calibration[which]?.x ?? 0"
        :cy="calibration[which]?.y ?? 0"
        :r="markerRadius"
        class="cursor-grab fill-red-500 stroke-white"
        stroke-width="2"
        vector-effect="non-scaling-stroke"
        @pointerdown="onMarkerPointerDown($event, which)"
      />
    </template>
  </svg>
</template>
