<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useViewport } from '../composables/useViewport'
import type { Placement, Point, Stand, VehicleSide } from '../model'
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
    hoveredId?: string | null
    /** stand id → text printed inside the stand; stands without an entry get no label */
    labels?: Map<string, string>
    calibration?: Calibration
    /** stand being dragged in from the list, rendered translucently at the given client position */
    ghost?: { stand: Stand; clientX: number; clientY: number } | null
  }>(),
  { mode: 'edit', stands: () => [], pxPerMeter: 1, selectedId: null, hoveredId: null, labels: () => new Map(), calibration: () => ({}), ghost: null },
)

const emit = defineEmits<{
  select: [id: string | null]
  hover: [id: string | null]
  'update:placement': [id: string, placement: Placement]
  'update:vehicle-side': [id: string, side: VehicleSide]
  'update:calibration': [calibration: Calibration]
}>()

const svg = ref<SVGSVGElement>()
const viewport = useViewport(svg)

const placedStands = computed(() => props.stands.filter((s): s is Stand & { placement: Placement } => s.placement !== null))

// screen px per image px (printing keeps the current viewBox, so strokes/handles sized by this also print in proportion)
const scale = computed(() => viewport.scale.value)

const ghostStand = computed<(Stand & { placement: Placement }) | null>(() => {
  const g = props.ghost
  if (!g) return null
  const at = viewport.clientToImage(g.clientX, g.clientY)
  return { ...g.stand, placement: { x: at.x, y: at.y, angle: g.stand.placement?.angle ?? 0 } }
})

/** Whether the given client position lies within the map element. */
function containsClient(clientX: number, clientY: number): boolean {
  const r = svg.value?.getBoundingClientRect()
  return !!r && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
}

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

defineExpose({ center: viewport.center, fit: () => viewport.fit(props.imageSize.width, props.imageSize.height), clientToImage: viewport.clientToImage, containsClient, viewBox: viewport.viewBox })
</script>

<template>
  <svg
    ref="svg"
    class="h-full w-full touch-none bg-neutral-200 print:bg-white"
    :viewBox="viewport.viewBoxString.value"
    @wheel.prevent="onWheel"
    @pointerdown="onBackgroundPointerDown"
  >
    <image v-if="imageUrl" :href="imageUrl" :width="imageSize.width" :height="imageSize.height" x="0" y="0" />
    <rect v-else :width="imageSize.width" :height="imageSize.height" class="fill-neutral-300" />

    <template v-if="mode === 'edit'">
      <StandShape
        v-for="s in placedStands"
        :key="s.id"
        :stand="s"
        :px-per-meter="pxPerMeter"
        :scale="scale"
        :selected="s.id === selectedId"
        :hovered="s.id === hoveredId"
        :label="labels.get(s.id)"
        :to-image="viewport.clientToImage"
        @select="emit('select', $event)"
        @hover="emit('hover', $event)"
        @update:placement="(id, p) => emit('update:placement', id, p)"
        @update:vehicle-side="(id, side) => emit('update:vehicle-side', id, side)"
      />
      <StandShape
        v-if="ghostStand"
        :stand="ghostStand"
        :px-per-meter="pxPerMeter"
        :scale="scale"
        :selected="false"
        :hovered="true"
        :label="labels.get(ghostStand.id)"
        :to-image="viewport.clientToImage"
        class="pointer-events-none opacity-60"
      />
      <!-- extra SVG content positioned in image coordinates, e.g. the legend -->
      <slot name="overlay" :scale="scale" :to-image="viewport.clientToImage" :view-box="viewport.viewBox" />
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
